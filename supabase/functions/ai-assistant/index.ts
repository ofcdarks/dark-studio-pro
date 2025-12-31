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
    const { type, prompt, videoData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = prompt || "";

    switch (type) {
      case "analyze_video":
        systemPrompt = `Você é um especialista em análise de vídeos virais do YouTube. 
        Analise o conteúdo fornecido e forneça insights sobre:
        - Potencial de viralização (score de 0-100)
        - Pontos fortes do título
        - Sugestões de melhoria
        - Análise de thumbnail ideal
        - Ganchos sugeridos para os primeiros 10 segundos
        Responda em português brasileiro de forma estruturada.`;
        userPrompt = `Analise este vídeo: ${JSON.stringify(videoData)}`;
        break;

      case "generate_script":
        systemPrompt = `Você é um roteirista especializado em vídeos dark/documentários para YouTube.
        Crie roteiros envolventes com:
        - Gancho impactante nos primeiros 10 segundos
        - Estrutura narrativa com tensão crescente
        - Pausas dramáticas indicadas
        - Calls-to-action naturais
        Responda em português brasileiro.`;
        break;

      case "generate_titles":
        systemPrompt = `Você é um especialista em títulos virais para YouTube.
        Gere 5 títulos otimizados para CTR que:
        - Usem números quando apropriado
        - Criem curiosidade
        - Tenham no máximo 60 caracteres
        - Usem palavras de poder
        Responda em português brasileiro em formato de lista.`;
        break;

      case "analyze_niche":
        systemPrompt = `Você é um analista de mercado especializado em nichos do YouTube.
        Forneça análise detalhada sobre:
        - Tendências atuais
        - Oportunidades de conteúdo
        - Competição estimada
        - Palavras-chave sugeridas
        - Formatos que funcionam melhor
        Responda em português brasileiro.`;
        break;

      default:
        systemPrompt = "Você é um assistente especializado em criação de conteúdo para YouTube. Responda em português brasileiro.";
    }

    console.log("AI request type:", type);
    console.log("System prompt length:", systemPrompt.length);

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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione mais créditos para continuar." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("AI response received, length:", content?.length);

    return new Response(
      JSON.stringify({ result: content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in ai-assistant:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
