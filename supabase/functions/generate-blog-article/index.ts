import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, category, language = "pt-BR" } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Tópico é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Blog Article] Generating for:", topic, "category:", category);

    // Get API keys from environment
    const LAOZHANG_API_KEY = Deno.env.get("LAOZHANG_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!LAOZHANG_API_KEY && !OPENAI_API_KEY) {
      throw new Error("Nenhuma chave de API disponível. Configure LAOZHANG_API_KEY ou OPENAI_API_KEY.");
    }

    const systemPrompt = `Você é um especialista em marketing digital e criação de conteúdo para YouTube. 
Escreva artigos de blog completos, profissionais e otimizados para SEO.
O conteúdo deve ser informativo, envolvente e prático.
Use uma linguagem acessível mas profissional.
Sempre inclua exemplos práticos e dicas acionáveis.`;

    const userPrompt = `Escreva um artigo de blog completo sobre: "${topic}"
Categoria: ${category || "YouTube"}
Idioma: ${language}

O artigo deve ter a seguinte estrutura (responda APENAS com JSON válido):

{
  "title": "Título do artigo (máximo 60 caracteres, otimizado para SEO)",
  "slug": "slug-do-artigo-em-kebab-case",
  "excerpt": "Resumo do artigo em 2-3 frases (máximo 160 caracteres)",
  "content": "Conteúdo completo do artigo em HTML com headings (h2, h3), parágrafos, listas e destaques. Mínimo 1500 palavras.",
  "meta_description": "Meta description para SEO (máximo 160 caracteres)",
  "meta_keywords": ["palavra-chave-1", "palavra-chave-2", "palavra-chave-3"],
  "read_time": "X min"
}

IMPORTANTE:
- O conteúdo deve ser em HTML válido
- Use h2 para seções principais, h3 para subseções
- Inclua listas (ul/li) quando apropriado
- Destaque termos importantes com <strong>
- O artigo deve ter no mínimo 1500 palavras
- Responda APENAS com o JSON, sem markdown ou explicações`;

    let data;
    
    // Priority: Laozhang > OpenAI
    if (LAOZHANG_API_KEY) {
      console.log("[Blog Article] Using Laozhang API");
      
      const response = await fetch("https://api.laozhang.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LAOZHANG_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 8000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Blog Article] Laozhang error:", response.status, errorText);
        throw new Error(`Laozhang API error: ${response.status}`);
      }

      data = await response.json();
    } else {
      console.log("[Blog Article] Using OpenAI API");
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 8000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Blog Article] OpenAI error:", response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      data = await response.json();
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    console.log("[Blog Article] Parsing JSON response...");

    let articleData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        articleData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[Blog Article] Parse error:", parseError);
      throw new Error("Failed to parse article data");
    }

    console.log("[Blog Article] Success:", articleData.title);

    return new Response(
      JSON.stringify({ success: true, article: articleData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Blog Article] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
