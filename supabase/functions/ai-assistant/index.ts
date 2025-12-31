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
    const { type, prompt, videoData, channelUrl, niche, text, voiceId, language } = await req.json();
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
        Responda em português brasileiro de forma estruturada em JSON com as chaves:
        {
          "viral_score": number,
          "title_analysis": string,
          "suggestions": string[],
          "thumbnail_tips": string,
          "hooks": string[],
          "overall_analysis": string
        }`;
        userPrompt = `Analise este vídeo: ${JSON.stringify(videoData)}`;
        break;

      case "analyze_video_titles":
        const lang = language === "pt-BR" ? "Português Brasileiro" : language === "es" ? "Espanhol" : "Inglês";
        systemPrompt = `Você é um especialista em análise de títulos virais do YouTube.
        Analise a URL do vídeo fornecida e:
        1. Identifique a fórmula/estrutura do título original e por que ele funciona
        2. Gere 5 novos títulos OTIMIZADOS seguindo e MELHORANDO a mesma fórmula
        3. Detecte o nicho, subnicho e micro-nicho do vídeo
        
        Responda SEMPRE em formato JSON válido com esta estrutura exata:
        {
          "videoInfo": {
            "title": "título original do vídeo",
            "thumbnail": "",
            "views": número estimado de views,
            "daysAgo": dias desde publicação (número),
            "comments": número estimado de comentários,
            "estimatedRevenue": { "usd": número, "brl": número },
            "rpm": { "usd": número, "brl": número },
            "niche": "nicho principal",
            "subNiche": "subnicho",
            "microNiche": "micro-nicho específico",
            "originalTitleAnalysis": {
              "motivoSucesso": "Explicação detalhada de por que o título original funciona e gera curiosidade",
              "formula": "Fórmula identificada (ex: Promessa central + benefício + termos em CAIXA ALTA + loop mental)"
            }
          },
          "titles": [
            {
              "title": "Título OTIMIZADO gerado em ${lang}",
              "formula": "Descrição da fórmula usada (mesma do original)",
              "formulaSurpresa": "Variação otimizada da fórmula (ex: Mistério + revelação + gatilho)",
              "quality": score de 1-10,
              "impact": score de 1-10,
              "isBest": true apenas para o melhor título
            }
          ]
        }
        
        IMPORTANTE: 
        - Gere exatamente 5 títulos OTIMIZADOS baseados na fórmula identificada
        - O melhor título deve ter isBest: true
        - Todos os títulos devem estar em ${lang}
        - Use CAIXA ALTA estrategicamente nos títulos como no original
        - Mantenha títulos com no máximo 60 caracteres
        - Na análise do título original, explique claramente o MOTIVO DO SUCESSO
        - Identifique a FÓRMULA exata usada (promessa + curiosidade + etc)`;
        userPrompt = prompt || `Analise este vídeo: ${JSON.stringify(videoData)}`;
        break;

      case "analyze_script_formula":
        systemPrompt = `Você é um especialista em análise de roteiros virais do YouTube.
        Analise a transcrição/roteiro fornecido e identifique a fórmula de sucesso.
        
        Responda SEMPRE em formato JSON válido com esta estrutura:
        {
          "motivoSucesso": "Explicação detalhada de por que este roteiro funciona e viraliza",
          "formula": "Fórmula identificada (ex: Hook emocional + Promessa de revelação + Desenvolvimento com tensão + Clímax + CTA)",
          "estrutura": {
            "hook": "Descrição do gancho usado nos primeiros segundos",
            "desenvolvimento": "Como o conteúdo é desenvolvido",
            "climax": "Onde está o momento de maior impacto",
            "cta": "Como a chamada para ação é feita"
          },
          "tempoTotal": "Tempo estimado ideal para este tipo de roteiro",
          "gatilhosMentais": ["lista", "de", "gatilhos", "mentais", "usados"]
        }
        
        IMPORTANTE:
        - Identifique TODOS os gatilhos mentais usados (Curiosidade, Urgência, Escassez, Prova Social, etc)
        - Explique em detalhes a estrutura do roteiro
        - Seja específico sobre o que faz este roteiro funcionar`;
        userPrompt = text || prompt;
        break;

      case "generate_script_with_formula":
        systemPrompt = `Você é um roteirista profissional especializado em vídeos virais para YouTube.
        Crie um roteiro COMPLETO seguindo a fórmula viral fornecida.
        
        O roteiro deve incluir:
        - Hook impactante nos primeiros 10 segundos
        - Estrutura narrativa com tensão crescente
        - Marcações de tempo para cada seção
        - Pausas dramáticas indicadas com [PAUSA]
        - Calls-to-action nos momentos solicitados
        - Notas de produção entre [colchetes]
        
        Formate o roteiro em markdown com:
        # Título
        ## PARTE X - NOME DA SEÇÃO (TIMESTAMP)
        [Instruções de produção]
        "Texto de narração"
        
        Responda em português brasileiro.`;
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
        Responda em português brasileiro em formato JSON:
        { "titles": ["título1", "título2", ...] }`;
        break;

      case "analyze_niche":
      case "explore_niche":
        systemPrompt = `Você é um analista de mercado especializado em nichos do YouTube.
        Forneça análise detalhada sobre o nicho "${niche || prompt}" incluindo:
        - Tendências atuais do nicho
        - Oportunidades de conteúdo inexploradas
        - Nível de competição (baixo/médio/alto)
        - Palavras-chave com potencial
        - Formatos de vídeo que funcionam melhor
        - Exemplos de canais de sucesso
        - Estratégias de crescimento
        Responda em português brasileiro em formato JSON:
        {
          "niche": string,
          "trends": string[],
          "opportunities": string[],
          "competition_level": string,
          "keywords": string[],
          "best_formats": string[],
          "example_channels": string[],
          "growth_strategies": string[],
          "summary": string
        }`;
        userPrompt = niche || prompt;
        break;

      case "search_channels":
        systemPrompt = `Você é um especialista em descoberta de canais do YouTube.
        Baseado na URL do canal ou tema "${channelUrl || prompt}", sugira canais similares com:
        - Nome do canal sugerido
        - Nicho específico
        - Tamanho estimado (pequeno/médio/grande)
        - Por que é relevante
        Responda em português brasileiro em formato JSON:
        {
          "reference_channel": string,
          "similar_channels": [
            {
              "name": string,
              "niche": string,
              "size": string,
              "relevance": string,
              "url_suggestion": string
            }
          ],
          "search_tips": string[]
        }`;
        userPrompt = channelUrl || prompt;
        break;

      case "viral_analysis":
        systemPrompt = `Você é um especialista em análise de viralidade de vídeos do YouTube.
        Analise o potencial viral do conteúdo fornecido e retorne:
        - Score de viralidade (0-100)
        - Fatores positivos
        - Fatores negativos
        - Recomendações de melhoria
        - Previsão de performance
        Responda em português brasileiro em formato JSON:
        {
          "viral_score": number,
          "positive_factors": string[],
          "negative_factors": string[],
          "recommendations": string[],
          "performance_prediction": string,
          "best_posting_time": string,
          "target_audience": string
        }`;
        userPrompt = JSON.stringify(videoData) || prompt;
        break;

      case "generate_voice":
        // For voice generation, we'll return a structured response
        // The actual audio generation would need ElevenLabs or similar
        systemPrompt = `Você é um assistente de geração de voz. 
        O usuário quer converter o seguinte texto em áudio.
        Analise o texto e sugira:
        - Melhorias de entonação
        - Pausas sugeridas (marque com ...)
        - Tom recomendado (neutro/dramático/alegre/sério)
        Retorne o texto otimizado para narração.
        Responda em formato JSON:
        {
          "original_text": string,
          "optimized_text": string,
          "suggested_tone": string,
          "duration_estimate": string,
          "tips": string[]
        }`;
        userPrompt = text || prompt;
        break;

      case "batch_images":
        systemPrompt = `Você é um especialista em criação de prompts para geração de imagens.
        Baseado no tema fornecido, crie prompts detalhados para geração de imagens.
        Cada prompt deve ter:
        - Descrição visual detalhada
        - Estilo artístico sugerido
        - Cores predominantes
        - Composição da cena
        Responda em formato JSON:
        {
          "theme": string,
          "prompts": [
            {
              "prompt": string,
              "style": string,
              "colors": string[],
              "composition": string
            }
          ]
        }`;
        break;

      case "video_script":
        systemPrompt = `Você é um roteirista profissional especializado em vídeos curtos virais.
        Crie um roteiro completo incluindo:
        - Hook inicial (0-3 segundos)
        - Introdução (3-10 segundos)
        - Desenvolvimento (corpo principal)
        - Clímax
        - CTA (call-to-action)
        Responda em formato JSON:
        {
          "title": string,
          "duration_estimate": string,
          "sections": [
            {
              "name": string,
              "timestamp": string,
              "content": string,
              "visual_notes": string
            }
          ],
          "voiceover_text": string,
          "music_suggestion": string
        }`;
        break;

      default:
        systemPrompt = "Você é um assistente especializado em criação de conteúdo para YouTube. Responda em português brasileiro de forma clara e útil.";
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

    // Try to parse as JSON if expected
    let result = content;
    if (content && (content.includes('{') || content.includes('['))) {
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[1].trim());
        } else {
          result = JSON.parse(content);
        }
      } catch {
        // If JSON parsing fails, return as string
        result = content;
      }
    }

    return new Response(
      JSON.stringify({ result }),
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
