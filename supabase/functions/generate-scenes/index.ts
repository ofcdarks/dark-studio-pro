import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Preços conforme documentação seção 4.2
const CREDIT_PRICING = {
  base: 3,
  gemini: 5,
  claude: 8,
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
        model_used: model,
        details: { word_count: wordCount, estimated_scenes: estimatedScenes }
      });
    }

    // Prompt para gerar todas as cenas de uma vez
    const systemPrompt = `Você é um especialista em produção audiovisual e geração de prompts para IA de imagem.
Sua tarefa é analisar um roteiro e dividi-lo em cenas, gerando prompts de imagem otimizados para cada cena.

Regras:
1. Divida o roteiro em segmentos de aproximadamente ${wordsPerScene} palavras cada
2. Para cada cena, gere um prompt de imagem detalhado em INGLÊS
3. O prompt deve ter entre 50-100 palavras
4. Inclua: composição visual, elementos principais, iluminação, cores, estilo ${style}
5. Otimize para geração de imagem com IA (sem texto, sem rostos específicos de celebridades)

Retorne APENAS um JSON válido no seguinte formato:
{
  "scenes": [
    {
      "number": 1,
      "text": "texto original da cena em português",
      "imagePrompt": "detailed image prompt in English...",
      "wordCount": 80
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem markdown, sem \`\`\`json, apenas o objeto JSON puro.`;

    const userPrompt = `Analise este roteiro e gere os prompts de imagem para cada cena:

ROTEIRO:
${script}

ESTILO VISUAL: ${style}
PALAVRAS POR CENA: ~${wordsPerScene}`;

    console.log(`[Generate Scenes] Calling AI API with model: google/gemini-2.5-flash`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`[Generate Scenes] AI API error: ${aiResponse.status}`, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
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
      console.error("[Generate Scenes] Failed to parse AI response:", content);
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
