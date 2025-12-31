import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tabela oficial de preços conforme documentação seção 4.2
const CREDIT_PRICING = {
  TITLE_ANALYSIS: { base: 6, gemini: 7, claude: 9 },
};

// Função para extrair videoId da URL do YouTube
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^[a-zA-Z0-9_-]{11}$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1] || match[0];
  }
  return null;
}

// Função para buscar dados do vídeo via YouTube Data API
async function fetchYouTubeVideoData(videoId: string, apiKey: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics&key=${apiKey}`
  );
  
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error("Video not found");
  }
  
  const video = data.items[0];
  const publishedAt = new Date(video.snippet.publishedAt);
  const daysAgo = Math.floor((Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    title: video.snippet.title,
    description: video.snippet.description,
    thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
    views: parseInt(video.snippet.statistics?.viewCount || "0"),
    comments: parseInt(video.snippet.statistics?.commentCount || "0"),
    likes: parseInt(video.snippet.statistics?.likeCount || "0"),
    publishedAt: video.snippet.publishedAt,
    daysAgo,
    channelTitle: video.snippet.channelTitle,
    tags: video.snippet.tags || []
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Extrair userId do token JWT
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id || null;
    }

    const body = await req.json();
    const { 
      videoUrl, 
      model = "gemini", 
      language = "Português",
      folderId = null
    } = body;

    if (!videoUrl) {
      throw new Error("videoUrl is required");
    }

    // Passo 2: Extrair videoId
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    console.log(`[Analyze Titles] Processing video: ${videoId}, Language: ${language}`);

    // Passo 3: Buscar YouTube API Key do usuário (fallback para dados básicos)
    let videoData: any = null;
    
    if (userId) {
      const { data: apiSettings } = await supabaseAdmin
        .from("user_api_settings")
        .select("youtube_api_key")
        .eq("user_id", userId)
        .single();
      
      if (apiSettings?.youtube_api_key) {
        try {
          videoData = await fetchYouTubeVideoData(videoId, apiSettings.youtube_api_key);
          console.log("[Analyze Titles] Fetched video data from YouTube API");
        } catch (err) {
          console.log("[Analyze Titles] YouTube API error, continuing without video data:", err);
        }
      }
    }

    // Calcular créditos
    let modelKey: 'base' | 'gemini' | 'claude' = 'base';
    if (model?.includes('gemini')) modelKey = 'gemini';
    else if (model?.includes('claude') || model?.includes('gpt')) modelKey = 'claude';
    
    const creditsNeeded = CREDIT_PRICING.TITLE_ANALYSIS[modelKey];

    // Verificar e debitar créditos
    if (userId) {
      const { data: creditData } = await supabaseAdmin
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      const currentBalance = creditData?.balance ?? 50;
      
      if (currentBalance < creditsNeeded) {
        return new Response(
          JSON.stringify({ error: `Créditos insuficientes. Necessário: ${creditsNeeded}, Disponível: ${currentBalance}` }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Debitar créditos
      await supabaseAdmin
        .from("user_credits")
        .update({ balance: currentBalance - creditsNeeded })
        .eq("user_id", userId);

      await supabaseAdmin.from("credit_usage").insert({
        user_id: userId,
        operation_type: "title_analysis",
        credits_used: creditsNeeded,
        model_used: model,
        details: { video_id: videoId, language }
      });
    }

    // Passo 8: Construir prompt de análise conforme documentação
    const langLabel = language === "Português" ? "Português Brasileiro" : language === "English" ? "Inglês" : "Espanhol";
    
    const analysisPrompt = `Você é um especialista em análise de títulos virais para YouTube.

VÍDEO PARA ANALISAR:
- URL: ${videoUrl}
- Video ID: ${videoId}
${videoData ? `
- Título Original: "${videoData.title}"
- Visualizações: ${videoData.views?.toLocaleString() || "N/A"}
- Comentários: ${videoData.comments?.toLocaleString() || "N/A"}
- Dias no ar: ${videoData.daysAgo}
- Canal: ${videoData.channelTitle}
- Tags: ${videoData.tags?.slice(0, 10).join(", ") || "N/A"}
- Descrição (início): "${videoData.description?.substring(0, 300) || "N/A"}"
` : ""}

Analise este título e identifique:

1. FÓRMULA DO TÍTULO:
   - Qual padrão/técnica ele usa? (pergunta, número, mistério, nome próprio, CAIXA ALTA, etc)
   - Por que essa fórmula funciona para este nicho?

2. NICHO E SUBNICHO:
   - Nicho principal detectado
   - Subnicho específico
   - Micronicho (se aplicável)

3. ELEMENTOS DE SUCESSO:
   - Por que este título viralizou?
   - Que gatilhos emocionais ativa?
   - Que curiosidade desperta?

4. GERE 5 TÍTULOS OTIMIZADOS:
   - Use a mesma fórmula identificada
   - Adapte para o idioma: ${langLabel}
   - Mantenha o impacto e curiosidade
   - Use CAIXA ALTA estrategicamente
   - Máximo 60 caracteres cada

Retorne APENAS em formato JSON válido:
{
  "originalTitle": "título original do vídeo",
  "translatedTitle": "título traduzido se necessário ou igual ao original",
  "videoStats": {
    "views": número,
    "comments": número,
    "days": número
  },
  "detectedNiche": "nicho principal",
  "detectedSubniche": "subnicho específico",
  "detectedMicroniche": "micronicho",
  "formula": "descrição da fórmula identificada",
  "whyItWorks": "explicação de por que este título funciona e viraliza",
  "titles": [
    {"title": "TÍTULO 1 OTIMIZADO", "score": 95, "explanation": "Usa a fórmula X com gatilho Y"},
    {"title": "TÍTULO 2 OTIMIZADO", "score": 92, "explanation": "Variação da fórmula com Z"},
    {"title": "TÍTULO 3 OTIMIZADO", "score": 90, "explanation": "Combina elementos A e B"},
    {"title": "TÍTULO 4 OTIMIZADO", "score": 88, "explanation": "Foco em gatilho W"},
    {"title": "TÍTULO 5 OTIMIZADO", "score": 85, "explanation": "Alternativa com Q"}
  ]
}`;

    // Passo 9: Chamar API de IA
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: analysisPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[Analyze Titles] AI API error:", errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parsear resposta JSON
    let analysis;
    try {
      // Tentar extrair JSON de markdown code blocks
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1].trim());
      } else {
        analysis = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error("[Analyze Titles] Failed to parse AI response:", parseError);
      throw new Error("Failed to parse AI analysis response");
    }

    // Passo 10: Salvar no banco de dados
    if (userId) {
      // Salvar análise do vídeo
      const { data: analysisRecord, error: analysisError } = await supabaseAdmin
        .from("analyzed_videos")
        .insert({
          user_id: userId,
          youtube_video_id: videoId,
          video_url: videoUrl,
          original_title: analysis.originalTitle || videoData?.title,
          translated_title: analysis.translatedTitle,
          original_views: analysis.videoStats?.views || videoData?.views,
          original_comments: analysis.videoStats?.comments || videoData?.comments,
          original_days: analysis.videoStats?.days || videoData?.daysAgo,
          original_thumbnail_url: videoData?.thumbnailUrl,
          detected_niche: analysis.detectedNiche,
          detected_subniche: analysis.detectedSubniche,
          detected_microniche: analysis.detectedMicroniche,
          analysis_data_json: analysis,
          folder_id: folderId,
        })
        .select("id")
        .single();

      if (analysisError) {
        console.error("[Analyze Titles] Error saving analysis:", analysisError);
      } else if (analysisRecord && analysis.titles) {
        // Salvar títulos gerados
        const titlesToInsert = analysis.titles.map((t: any) => ({
          video_analysis_id: analysisRecord.id,
          user_id: userId,
          title_text: t.title,
          model_used: model,
          pontuacao: t.score || 0,
          explicacao: t.explanation || "",
          formula: analysis.formula,
        }));

        await supabaseAdmin.from("generated_titles").insert(titlesToInsert);
        console.log(`[Analyze Titles] Saved ${titlesToInsert.length} generated titles`);
      }
    }

    // Passo 11: Retornar resposta
    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          originalTitle: analysis.originalTitle || videoData?.title,
          translatedTitle: analysis.translatedTitle,
          videoStats: {
            views: analysis.videoStats?.views || videoData?.views || 0,
            comments: analysis.videoStats?.comments || videoData?.comments || 0,
            days: analysis.videoStats?.days || videoData?.daysAgo || 0,
            thumbnail: videoData?.thumbnailUrl
          },
          detectedNiche: analysis.detectedNiche,
          detectedSubniche: analysis.detectedSubniche,
          detectedMicroniche: analysis.detectedMicroniche,
          formula: analysis.formula,
          whyItWorks: analysis.whyItWorks
        },
        generatedTitles: (analysis.titles || []).map((t: any, idx: number) => ({
          id: idx,
          title: t.title,
          pontuacao: t.score,
          explicacao: t.explanation || analysis.formula
        })),
        creditsUsed: creditsNeeded
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[Analyze Titles] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
