import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Preços conforme documentação seção 4.2
const CREDIT_PRICING = {
  base: 5,
  gemini: 6,
  claude: 8,
};

// Interface for admin API settings
interface AdminApiKeys {
  openai?: string;
  gemini?: string;
  claude?: string;
  laozhang?: string;
  openai_validated?: boolean;
  gemini_validated?: boolean;
  claude_validated?: boolean;
  laozhang_validated?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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
      script, 
      model = "gpt-4o",
      style = "cinematic",
      wordsPerScene = 80
    } = body;

    if (!script) {
      throw new Error("script is required");
    }

    const wordCount = script.split(/\s+/).filter(Boolean).length;
    const estimatedScenes = Math.ceil(wordCount / wordsPerScene);

    console.log(`[Generate Scenes] Processing script with ${wordCount} words, estimating ${estimatedScenes} scenes`);

    // Calcular créditos baseado no modelo
    let modelKey: 'base' | 'gemini' | 'claude' = 'base';
    if (model?.includes('gemini')) modelKey = 'gemini';
    else if (model?.includes('claude') || model?.includes('gpt')) modelKey = 'claude';

    const creditsNeeded = CREDIT_PRICING[modelKey];

    // Get admin API keys
    const { data: adminData } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'api_keys')
      .maybeSingle();

    const adminApiKeys = adminData?.value as AdminApiKeys | null;

    // Determine which API to use
    let apiUrl: string;
    let apiKey: string;
    let apiModel: string;

    // Priority: Laozhang > OpenAI
    if (adminApiKeys?.laozhang && adminApiKeys.laozhang_validated) {
      apiUrl = "https://api.laozhang.ai/v1/chat/completions";
      apiKey = adminApiKeys.laozhang;
      
      // Map model for Laozhang
      if (model?.includes("claude")) {
        apiModel = "claude-sonnet-4-20250514";
      } else if (model?.includes("gemini-pro") || model?.includes("gemini-2.5-pro")) {
        apiModel = "gemini-2.5-pro";
      } else if (model?.includes("gemini")) {
        apiModel = "gemini-2.5-flash";
      } else {
        apiModel = "gpt-4o";
      }
      console.log(`[Generate Scenes] Using Laozhang AI - Model: ${apiModel}`);
    } else if (adminApiKeys?.openai && adminApiKeys.openai_validated) {
      apiUrl = "https://api.openai.com/v1/chat/completions";
      apiKey = adminApiKeys.openai;
      apiModel = "gpt-4o";
      console.log('[Generate Scenes] Using admin OpenAI API key');
    } else if (OPENAI_API_KEY) {
      apiUrl = "https://api.openai.com/v1/chat/completions";
      apiKey = OPENAI_API_KEY;
      apiModel = "gpt-4o";
      console.log('[Generate Scenes] Using system OpenAI API key');
    } else {
      return new Response(
        JSON.stringify({ error: "Nenhuma chave de API configurada. Configure as chaves no painel admin." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
        operation_type: "scene_prompts",
        credits_used: creditsNeeded,
        model_used: apiModel,
        details: { word_count: wordCount, estimated_scenes: estimatedScenes }
      });

      await supabaseAdmin.from("credit_transactions").insert({
        user_id: userId,
        amount: -creditsNeeded,
        transaction_type: "debit",
        description: "Geração de prompts de cenas"
      });
    }

    // Limitar número de cenas para evitar resposta truncada
    const maxScenes = 20;
    const effectiveWordsPerScene = estimatedScenes > maxScenes 
      ? Math.ceil(wordCount / maxScenes) 
      : wordsPerScene;
    const actualEstimatedScenes = Math.min(estimatedScenes, maxScenes);

    console.log(`[Generate Scenes] Adjusted: ${actualEstimatedScenes} scenes, ~${effectiveWordsPerScene} words/scene`);

    // Prompt para gerar todas as cenas de uma vez
    const systemPrompt = `Você é um especialista em produção audiovisual e geração de prompts para IA de imagem.
Sua tarefa é analisar um roteiro e dividi-lo em cenas, gerando prompts de imagem otimizados para cada cena.

Regras IMPORTANTES:
1. Divida o roteiro em NO MÁXIMO ${actualEstimatedScenes} cenas
2. Cada cena deve ter aproximadamente ${effectiveWordsPerScene} palavras do roteiro
3. Para cada cena, gere um prompt de imagem CONCISO em INGLÊS (máximo 60 palavras)
4. Inclua: composição visual, elementos principais, iluminação, estilo ${style}
5. Otimize para geração de imagem com IA (sem texto, sem rostos específicos)

Retorne APENAS um JSON válido:
{
  "scenes": [
    {
      "number": 1,
      "text": "resumo da cena em português (máximo 50 palavras)",
      "imagePrompt": "concise image prompt in English",
      "wordCount": 150
    }
  ]
}

CRÍTICO: Retorne APENAS o JSON puro, sem markdown, sem explicações.`;

    const userPrompt = `Analise este roteiro e gere os prompts de imagem:

ROTEIRO:
${script.substring(0, 15000)}

ESTILO: ${style}
MÁXIMO DE CENAS: ${actualEstimatedScenes}`;

    console.log(`[Generate Scenes] Calling ${apiUrl} with model: ${apiModel}`);

    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 16000,
        temperature: 0.5
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`[Generate Scenes] AI API error: ${aiResponse.status}`, errorText);
      
      // Refund credits on error
      if (userId) {
        const { data: creditData } = await supabaseAdmin
          .from("user_credits")
          .select("balance")
          .eq("user_id", userId)
          .single();

        if (creditData) {
          await supabaseAdmin
            .from("user_credits")
            .update({ balance: creditData.balance + creditsNeeded })
            .eq("user_id", userId);

          await supabaseAdmin.from("credit_transactions").insert({
            user_id: userId,
            amount: creditsNeeded,
            transaction_type: "refund",
            description: "Reembolso - Erro na geração de prompts"
          });
        }
      }
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Erro na API de IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content?.trim() || "";

    console.log(`[Generate Scenes] AI response received, parsing...`);

    // Parse JSON response
    let parsedScenes;
    try {
      // Remove markdown code blocks if present
      let jsonContent = content;
      if (jsonContent.startsWith("```json")) {
        jsonContent = jsonContent.slice(7);
      }
      if (jsonContent.startsWith("```")) {
        jsonContent = jsonContent.slice(3);
      }
      if (jsonContent.endsWith("```")) {
        jsonContent = jsonContent.slice(0, -3);
      }
      jsonContent = jsonContent.trim();

      parsedScenes = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("[Generate Scenes] Failed to parse AI response:", content.substring(0, 500));
      
      // Refund credits on parse error
      if (userId) {
        const { data: creditData } = await supabaseAdmin
          .from("user_credits")
          .select("balance")
          .eq("user_id", userId)
          .single();

        if (creditData) {
          await supabaseAdmin
            .from("user_credits")
            .update({ balance: creditData.balance + creditsNeeded })
            .eq("user_id", userId);

          await supabaseAdmin.from("credit_transactions").insert({
            user_id: userId,
            amount: creditsNeeded,
            transaction_type: "refund",
            description: "Reembolso - Erro no parsing da resposta"
          });
        }
      }
      
      throw new Error("Falha ao processar resposta da IA. Tente novamente.");
    }

    const scenes = parsedScenes.scenes || [];

    console.log(`[Generate Scenes] Successfully generated ${scenes.length} scene prompts`);

    // Retornar resposta
    return new Response(
      JSON.stringify({
        success: true,
        scenes: scenes.map((s: any, index: number) => ({
          number: s.number || index + 1,
          text: s.text || "",
          imagePrompt: s.imagePrompt || "",
          wordCount: s.wordCount || 0
        })),
        totalScenes: scenes.length,
        creditsUsed: creditsNeeded
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[Generate Scenes] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
