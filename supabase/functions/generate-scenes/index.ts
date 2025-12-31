import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Preços conforme documentação seção 4.2
const CREDIT_PRICING = {
  IMAGE_PROMPT: { base: 1, gemini: 2, claude: 3 },
  IMAGE_BATCH_10: { base: 10, gemini: 20, claude: 30 },
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
      title = "",
      niche = "",
      model = "gemini",
      style = "photorealistic",
      estimatedScenes = 8,
      wordsPerScene = 100
    } = body;

    if (!script) {
      throw new Error("script is required");
    }

    console.log(`[Generate Scenes] Processing script with ${script.split(/\s+/).length} words`);

    // Passo 2: Dividir roteiro em cenas
    const words = script.split(/\s+/);
    const actualWordsPerScene = wordsPerScene || Math.ceil(words.length / estimatedScenes);
    const scenes: { number: number; text: string; wordCount: number }[] = [];

    for (let i = 0; i < words.length; i += actualWordsPerScene) {
      const sceneText = words.slice(i, i + actualWordsPerScene).join(' ');
      scenes.push({
        number: scenes.length + 1,
        text: sceneText,
        wordCount: sceneText.split(/\s+/).length
      });
    }

    console.log(`[Generate Scenes] Divided into ${scenes.length} scenes`);

    // Calcular créditos
    let modelKey: 'base' | 'gemini' | 'claude' = 'base';
    if (model?.includes('gemini')) modelKey = 'gemini';
    else if (model?.includes('claude') || model?.includes('gpt')) modelKey = 'claude';

    let creditsNeeded: number;
    if (scenes.length >= 10) {
      creditsNeeded = Math.ceil((scenes.length / 10) * CREDIT_PRICING.IMAGE_BATCH_10[modelKey]);
    } else {
      creditsNeeded = Math.ceil(scenes.length * CREDIT_PRICING.IMAGE_PROMPT[modelKey]);
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
        model_used: model,
        details: { scene_count: scenes.length, title }
      });
    }

    // Passo 3: Gerar prompt para cada cena
    const scenePrompts: Array<{
      sceneNumber: number;
      sceneText: string;
      imagePrompt: string;
      wordCount: number;
    }> = [];

    for (const scene of scenes) {
      const prompt = `Crie um prompt detalhado para gerar uma imagem desta cena de vídeo:

CENA ${scene.number}:
"${scene.text}"

TÍTULO DO VÍDEO: "${title}"
NICHO: "${niche}"
ESTILO VISUAL: ${style}

Requisitos do prompt:
- Descreva a composição visual completa
- Inclua elementos principais da cena
- Especifique estilo: ${style}
- Seja específico sobre cores, iluminação, ambiente
- Prompt deve ter entre 50-150 palavras
- Otimizado para geração de imagem com IA

Retorne APENAS o prompt de imagem em inglês, sem explicações, sem aspas, apenas o texto do prompt.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!aiResponse.ok) {
        console.error(`[Generate Scenes] Error generating prompt for scene ${scene.number}`);
        continue;
      }

      const aiData = await aiResponse.json();
      const imagePrompt = aiData.choices?.[0]?.message?.content?.trim() || "";

      scenePrompts.push({
        sceneNumber: scene.number,
        sceneText: scene.text,
        imagePrompt,
        wordCount: scene.wordCount
      });

      console.log(`[Generate Scenes] Generated prompt for scene ${scene.number}`);
    }

    // Retornar resposta
    return new Response(
      JSON.stringify({
        success: true,
        scenes: scenePrompts.map(s => ({
          number: s.sceneNumber,
          text: s.sceneText,
          imagePrompt: s.imagePrompt,
          wordCount: s.wordCount
        })),
        totalScenes: scenePrompts.length,
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
