import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Preços conforme documentação seção 4.2
const CREDIT_PRICING = {
  CHANNEL_ANALYSIS: { base: 5, gemini: 6, claude: 7 },
};

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

    // Extrair userId
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id || null;
    }

    const body = await req.json();
    const { 
      channelUrl,
      channelId,
      maxVideos = 10,
      model = "gemini"
    } = body;

    if (!channelUrl && !channelId) {
      throw new Error("channelUrl or channelId is required");
    }

    console.log(`[Analyze Channel] Processing channel: ${channelUrl || channelId}`);

    // Calcular créditos
    let modelKey: 'base' | 'gemini' | 'claude' = 'base';
    if (model?.includes('gemini')) modelKey = 'gemini';
    else if (model?.includes('claude') || model?.includes('gpt')) modelKey = 'claude';

    const creditsNeeded = CREDIT_PRICING.CHANNEL_ANALYSIS[modelKey];

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

      await supabaseAdmin
        .from("user_credits")
        .update({ balance: currentBalance - creditsNeeded })
        .eq("user_id", userId);

      await supabaseAdmin.from("credit_usage").insert({
        user_id: userId,
        operation_type: "channel_analysis",
        credits_used: creditsNeeded,
        model_used: model,
        details: { channel_url: channelUrl, max_videos: maxVideos }
      });
    }

    // Buscar YouTube API Key do usuário se disponível
    let channelData: any = null;
    
    if (userId) {
      const { data: apiSettings } = await supabaseAdmin
        .from("user_api_settings")
        .select("youtube_api_key")
        .eq("user_id", userId)
        .single();
      
      if (apiSettings?.youtube_api_key) {
        try {
          // Extrair channel ID da URL se necessário
          let targetChannelId = channelId;
          if (!targetChannelId && channelUrl) {
            const match = channelUrl.match(/(?:channel\/|c\/|@)([^\/\?]+)/);
            if (match) targetChannelId = match[1];
          }

          if (targetChannelId) {
            // Buscar dados do canal
            const channelResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/channels?id=${targetChannelId}&part=snippet,statistics&key=${apiSettings.youtube_api_key}`
            );
            
            if (channelResponse.ok) {
              const data = await channelResponse.json();
              if (data.items && data.items.length > 0) {
                const channel = data.items[0];
                channelData = {
                  name: channel.snippet.title,
                  description: channel.snippet.description,
                  subscriberCount: parseInt(channel.statistics.subscriberCount || "0"),
                  videoCount: parseInt(channel.statistics.videoCount || "0"),
                  viewCount: parseInt(channel.statistics.viewCount || "0"),
                  thumbnailUrl: channel.snippet.thumbnails?.high?.url
                };
              }
            }
          }
        } catch (err) {
          console.log("[Analyze Channel] YouTube API error:", err);
        }
      }
    }

    // Construir prompt de análise
    const analysisPrompt = `Analise este canal do YouTube e forneça insights estratégicos:

CANAL: ${channelUrl || channelId}
${channelData ? `
DADOS DO CANAL:
- Nome: ${channelData.name}
- Inscritos: ${channelData.subscriberCount?.toLocaleString()}
- Vídeos: ${channelData.videoCount?.toLocaleString()}
- Views totais: ${channelData.viewCount?.toLocaleString()}
- Descrição: ${channelData.description?.substring(0, 300)}
` : ""}

Analise e forneça:

1. ANÁLISE GERAL:
   - Qual o posicionamento do canal?
   - Qual o nicho principal?
   - Qual a proposta de valor?

2. ESTRATÉGIAS IDENTIFICADAS:
   - Quais estratégias de conteúdo são usadas?
   - Qual a frequência de postagem ideal para este nicho?
   - Quais formatos funcionam melhor?

3. PADRÕES DE SUCESSO:
   - Quais tipos de vídeos têm mais views?
   - Quais títulos funcionam melhor?
   - Quais thumbnails são mais efetivas?

4. OPORTUNIDADES:
   - Gaps de conteúdo identificados
   - Tendências não exploradas
   - Potencial de crescimento

5. RECOMENDAÇÕES:
   - Estratégias para competir/colaborar
   - Conteúdos a criar
   - Como se diferenciar

Retorne em JSON:
{
  "channelInfo": {
    "name": "nome do canal",
    "niche": "nicho principal",
    "subniche": "subnicho",
    "positioning": "descrição do posicionamento"
  },
  "metrics": {
    "subscribers": número,
    "videos": número,
    "totalViews": número,
    "avgViewsPerVideo": número estimado,
    "engagementRate": "alto/médio/baixo"
  },
  "strategies": ["estratégia 1", "estratégia 2", "estratégia 3"],
  "successPatterns": {
    "videoTypes": ["tipo 1", "tipo 2"],
    "titlePatterns": ["padrão 1", "padrão 2"],
    "thumbnailStyle": "descrição do estilo de thumbnail"
  },
  "opportunities": ["oportunidade 1", "oportunidade 2", "oportunidade 3"],
  "recommendations": ["recomendação 1", "recomendação 2", "recomendação 3"],
  "competitorScore": 85,
  "growthPotential": "alto/médio/baixo"
}`;

    // Chamar API de IA
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: analysisPrompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[Analyze Channel] AI API error:", errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parsear resposta JSON
    let analysis;
    try {
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1].trim());
      } else {
        analysis = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error("[Analyze Channel] Failed to parse AI response:", parseError);
      throw new Error("Failed to parse AI analysis response");
    }

    console.log("[Analyze Channel] Analysis completed successfully");

    // Retornar resposta
    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        creditsUsed: creditsNeeded
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[Analyze Channel] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
