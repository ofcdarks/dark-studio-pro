import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Preços conforme documentação
const CREDIT_PRICING = {
  base: 2,    // por lote de 10 cenas
  gemini: 3,
  claude: 4,
};

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

interface CharacterDescription {
  name: string;
  description: string;
  seed: number;
}

interface SceneResult {
  number: number;
  text: string;
  imagePrompt: string;
  wordCount: number;
  characterName?: string; // Nome do personagem principal nesta cena
}

// Função para dividir texto em partes
function splitTextIntoChunks(text: string, wordsPerScene: number, scenesPerBatch: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const wordsPerBatch = wordsPerScene * scenesPerBatch;
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += wordsPerBatch) {
    chunks.push(words.slice(i, i + wordsPerBatch).join(' '));
  }
  
  return chunks;
}

// Função para detectar personagens no roteiro
async function detectCharacters(
  script: string,
  apiUrl: string,
  apiKey: string,
  apiModel: string
): Promise<CharacterDescription[]> {
  const systemPrompt = `Você é um especialista em análise de roteiros. Analise o texto e identifique PERSONAGENS RECORRENTES que aparecem em múltiplas partes do roteiro.

REGRAS:
1. Identifique APENAS personagens que são mencionados/aparecem em diferentes momentos
2. Ignore menções genéricas como "pessoas", "você", "a gente"
3. Para cada personagem, crie uma descrição visual DETALHADA e CONSISTENTE em INGLÊS
4. A descrição deve incluir: idade aproximada, gênero, características físicas marcantes, estilo de roupa típico
5. Seja específico o suficiente para manter consistência visual em IA de imagem

Retorne APENAS JSON:
{"characters":[{"name":"Nome","description":"detailed english description of physical appearance, clothing style, distinctive features"}]}

Se não houver personagens recorrentes, retorne: {"characters":[]}`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analise este roteiro e identifique personagens recorrentes:\n\n${script.substring(0, 8000)}` }
        ],
        max_tokens: 2000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      console.error('[Detect Characters] API error:', response.status);
      return [];
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim() || "";

    // Parse JSON
    if (content.startsWith("```json")) content = content.slice(7);
    if (content.startsWith("```")) content = content.slice(3);
    if (content.endsWith("```")) content = content.slice(0, -3);
    content = content.trim();

    const parsed = JSON.parse(content);
    const characters = parsed.characters || [];

    // Gerar seed fixa para cada personagem (baseado no nome para consistência)
    return characters.map((char: any) => ({
      name: char.name,
      description: char.description,
      seed: Math.abs(hashCode(char.name)) % 2147483647
    }));
  } catch (e) {
    console.error('[Detect Characters] Error:', e);
    return [];
  }
}

// Função simples de hash para gerar seed consistente
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

// Função para gerar prompts de um lote
async function generateBatchPrompts(
  chunk: string,
  batchNumber: number,
  startSceneNumber: number,
  scenesInBatch: number,
  style: string,
  characters: CharacterDescription[],
  apiUrl: string,
  apiKey: string,
  apiModel: string
): Promise<SceneResult[]> {
  const characterContext = characters.length > 0
    ? `\n\nPERSONAGENS RECORRENTES (use descrições EXATAS quando aparecerem):
${characters.map(c => `- ${c.name}: ${c.description}`).join('\n')}`
    : '';

  const characterInstruction = characters.length > 0
    ? `
5. Quando um personagem recorrente aparecer, use sua descrição EXATA no prompt
6. Adicione "characterName" com o nome do personagem principal da cena (ou null se não houver)`
    : '';

  const systemPrompt = `Você é um especialista em produção audiovisual. Analise o texto e divida em ${scenesInBatch} cenas, gerando prompts de imagem para cada.${characterContext}

Regras:
1. Divida em EXATAMENTE ${scenesInBatch} cenas (ou menos se o texto for curto)
2. Prompts de imagem CONCISOS em INGLÊS (40-60 palavras)
3. Inclua: composição visual, elementos, iluminação, estilo ${style}
4. Numere as cenas a partir de ${startSceneNumber}${characterInstruction}

Retorne APENAS JSON:
{"scenes":[{"number":${startSceneNumber},"text":"resumo curto","imagePrompt":"english prompt with exact character description if applicable","wordCount":100${characters.length > 0 ? ',"characterName":"Nome ou null"' : ''}}]}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: apiModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `LOTE ${batchNumber} - Gere prompts:\n\n${chunk}` }
      ],
      max_tokens: 4000,
      temperature: 0.5
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Batch ${batchNumber}] API error:`, errorText);
    throw new Error(`Erro no lote ${batchNumber}: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || "";

  // Parse JSON
  let jsonContent = content;
  if (jsonContent.startsWith("```json")) jsonContent = jsonContent.slice(7);
  if (jsonContent.startsWith("```")) jsonContent = jsonContent.slice(3);
  if (jsonContent.endsWith("```")) jsonContent = jsonContent.slice(0, -3);
  jsonContent = jsonContent.trim();

  try {
    const parsed = JSON.parse(jsonContent);
    return parsed.scenes || [];
  } catch (e) {
    console.error(`[Batch ${batchNumber}] Parse error:`, jsonContent.substring(0, 200));
    return [];
  }
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
      wordsPerScene = 80,
      maxScenes = 500
    } = body;

    if (!script) {
      throw new Error("script is required");
    }

    const wordCount = script.split(/\s+/).filter(Boolean).length;
    const estimatedScenes = Math.min(Math.ceil(wordCount / wordsPerScene), maxScenes);
    const scenesPerBatch = 10; // Processar 10 cenas por vez
    const totalBatches = Math.ceil(estimatedScenes / scenesPerBatch);

    console.log(`[Generate Scenes] ${wordCount} words -> ${estimatedScenes} scenes in ${totalBatches} batches`);

    // Calcular créditos (por lote de 10)
    let modelKey: 'base' | 'gemini' | 'claude' = 'base';
    if (model?.includes('gemini')) modelKey = 'gemini';
    else if (model?.includes('claude') || model?.includes('gpt')) modelKey = 'claude';

    const creditsNeeded = Math.ceil(totalBatches * CREDIT_PRICING[modelKey]);

    // Get admin API keys
    const { data: adminData } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'api_keys')
      .maybeSingle();

    const adminApiKeys = adminData?.value as AdminApiKeys | null;

    // Determine API config
    let apiUrl: string;
    let apiKey: string;
    let apiModel: string;

    if (adminApiKeys?.laozhang && adminApiKeys.laozhang_validated) {
      apiUrl = "https://api.laozhang.ai/v1/chat/completions";
      apiKey = adminApiKeys.laozhang;
      
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
    } else if (OPENAI_API_KEY) {
      apiUrl = "https://api.openai.com/v1/chat/completions";
      apiKey = OPENAI_API_KEY;
      apiModel = "gpt-4o";
    } else {
      return new Response(
        JSON.stringify({ error: "Nenhuma chave de API configurada." }),
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
        details: { word_count: wordCount, total_batches: totalBatches, estimated_scenes: estimatedScenes }
      });

      await supabaseAdmin.from("credit_transactions").insert({
        user_id: userId,
        amount: -creditsNeeded,
        transaction_type: "debit",
        description: `Geração de ${estimatedScenes} prompts de cenas`
      });
    }

    // Detectar personagens no roteiro primeiro
    console.log(`[Generate Scenes] Detecting characters...`);
    const characters = await detectCharacters(script, apiUrl, apiKey, apiModel);
    console.log(`[Generate Scenes] Found ${characters.length} recurring characters:`, characters.map(c => c.name));

    // Dividir script em chunks
    const chunks = splitTextIntoChunks(script, wordsPerScene, scenesPerBatch);
    console.log(`[Generate Scenes] Split into ${chunks.length} chunks`);

    // Processar cada chunk
    const allScenes: SceneResult[] = [];
    let currentSceneNumber = 1;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkWords = chunk.split(/\s+/).filter(Boolean).length;
      const scenesInBatch = Math.min(Math.ceil(chunkWords / wordsPerScene), scenesPerBatch);

      console.log(`[Generate Scenes] Processing batch ${i + 1}/${chunks.length} (${scenesInBatch} scenes)`);

      try {
        const batchScenes = await generateBatchPrompts(
          chunk,
          i + 1,
          currentSceneNumber,
          scenesInBatch,
          style,
          characters,
          apiUrl,
          apiKey,
          apiModel
        );

        // Renumerar cenas corretamente
        for (const scene of batchScenes) {
          allScenes.push({
            ...scene,
            number: currentSceneNumber++
          });
        }

        console.log(`[Generate Scenes] Batch ${i + 1} completed: ${batchScenes.length} scenes`);

        // Pequena pausa entre lotes para evitar rate limit
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (batchError) {
        console.error(`[Generate Scenes] Batch ${i + 1} failed:`, batchError);
        // Continuar com próximo lote em caso de erro
      }
    }

    // Se nenhuma cena foi gerada, reembolsar
    if (allScenes.length === 0) {
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
            description: "Reembolso - Falha na geração de prompts"
          });
        }
      }

      return new Response(
        JSON.stringify({ error: "Não foi possível gerar os prompts. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Generate Scenes] Completed: ${allScenes.length} total scenes`);

    return new Response(
      JSON.stringify({
        success: true,
        scenes: allScenes,
        totalScenes: allScenes.length,
        totalBatches: chunks.length,
        creditsUsed: creditsNeeded,
        characters: characters // Retornar personagens detectados
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
