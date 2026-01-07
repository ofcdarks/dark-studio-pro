import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function transcribeYouTubeVideo(videoUrl: string): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Transcribing YouTube video:", videoUrl);

  const { data, error } = await supabase.functions.invoke("transcribe-video", {
    body: { url: videoUrl },
  });

  if (error) {
    console.error("Transcription error:", error);
    throw new Error("Falha ao transcrever o vídeo");
  }

  if (!data?.transcript) {
    throw new Error("Nenhuma transcrição encontrada para este vídeo");
  }

  return data.transcript;
}

async function searchNews(topic: string): Promise<string> {
  // Use Lovable AI to generate a summary of current news about the topic
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Você é um pesquisador de notícias especializado em YouTube e marketing digital.
Pesquise e compile as últimas tendências e notícias sobre o tópico fornecido.
Retorne um resumo detalhado das principais informações e tendências atuais.`,
        },
        {
          role: "user",
          content: `Pesquise as últimas notícias, tendências e informações sobre: "${topic}"
          
Compile um resumo abrangente que inclua:
- Principais acontecimentos recentes
- Tendências atuais do mercado
- Dados e estatísticas relevantes
- Previsões de especialistas
- Impacto no mercado de YouTube e criação de conteúdo

Seja específico e inclua dados concretos quando possível.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Falha ao pesquisar notícias");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      topic, 
      category, 
      language = "pt-BR",
      mode = "keyword", // "keyword" | "youtube" | "news"
      youtubeUrl,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let baseContent = "";
    let articleTopic = topic;

    // Process based on mode
    if (mode === "youtube") {
      if (!youtubeUrl) {
        return new Response(
          JSON.stringify({ error: "URL do YouTube é obrigatória" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Mode: YouTube transcription");
      baseContent = await transcribeYouTubeVideo(youtubeUrl);
      articleTopic = topic || "Análise do vídeo";
      console.log("Transcription length:", baseContent.length);
    } else if (mode === "news") {
      if (!topic) {
        return new Response(
          JSON.stringify({ error: "Tópico é obrigatório para modo notícias" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Mode: News research");
      baseContent = await searchNews(topic);
      console.log("News research length:", baseContent.length);
    } else {
      // keyword mode
      if (!topic) {
        return new Response(
          JSON.stringify({ error: "Tópico é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Mode: Keyword");
    }

    console.log("Generating blog article for topic:", articleTopic, "category:", category, "mode:", mode);

    const systemPrompt = `Você é um especialista em marketing digital e criação de conteúdo para YouTube. 
Escreva artigos de blog completos, profissionais e otimizados para SEO.
O conteúdo deve ser informativo, envolvente e prático.
Use uma linguagem acessível mas profissional.
Sempre inclua exemplos práticos e dicas acionáveis.`;

    let userPrompt = "";

    if (mode === "youtube") {
      userPrompt = `Com base na transcrição de um vídeo do YouTube abaixo, escreva um artigo de blog completo.

TRANSCRIÇÃO DO VÍDEO:
"""
${baseContent.slice(0, 15000)}
"""

${topic ? `Foco do artigo: ${topic}` : ""}
Categoria: ${category || "YouTube"}
Idioma: ${language}

Transforme o conteúdo do vídeo em um artigo de blog bem estruturado. Mantenha as principais ideias e insights, mas adapte para formato de texto.`;
    } else if (mode === "news") {
      userPrompt = `Com base na pesquisa de notícias e tendências abaixo, escreva um artigo de blog completo.

PESQUISA DE NOTÍCIAS:
"""
${baseContent.slice(0, 15000)}
"""

Tópico principal: ${topic}
Categoria: ${category || "YouTube"}
Idioma: ${language}

Crie um artigo informativo e atualizado sobre as últimas tendências e notícias do tema.`;
    } else {
      userPrompt = `Escreva um artigo de blog completo sobre: "${topic}"
Categoria: ${category || "YouTube"}
Idioma: ${language}`;
    }

    userPrompt += `

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    console.log("Raw AI response received, parsing JSON...");

    // Parse the JSON response
    let articleData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        articleData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Raw content:", content);
      throw new Error("Failed to parse article data");
    }

    console.log("Article generated successfully:", articleData.title);

    return new Response(
      JSON.stringify({ success: true, article: articleData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating blog article:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
