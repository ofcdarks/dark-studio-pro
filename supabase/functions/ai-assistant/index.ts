import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Inicializar Supabase client para operações de créditos
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Tabela oficial de preços conforme documentação
const CREDIT_PRICING = {
  // 🧠 TÍTULOS & ANÁLISES
  TITLE_ANALYSIS: { base: 6, gemini: 7, claude: 9 },
  TITLE_ANALYSIS_MULTIMODAL: { base: 15, gemini: 18, claude: 21 },
  EXPLORE_NICHE: { base: 6, gemini: 7, claude: 9 },
  ANALYZE_COMPETITOR: { base: 6, gemini: 7, claude: 9 },
  CHANNEL_ANALYSIS: { base: 5, gemini: 6, claude: 7 },
  
  // 🎬 VÍDEO & ROTEIRO
  READY_VIDEO: { base: 10, gemini: 12, claude: 15 },
  SCRIPT_PER_MINUTE: { base: 2, gemini: 2.4, claude: 2.8 }, // Por minuto de vídeo
  
  // 🖼️ IMAGENS & CENAS
  IMAGE_PROMPT: { base: 1, gemini: 2, claude: 3 }, // Por imagem
  IMAGE_BATCH_10: { base: 10, gemini: 20, claude: 30 }, // Lote de 10
  
  // 🧩 OUTROS RECURSOS
  TRANSCRIPTION_BASE: { base: 2, gemini: 3, claude: 4 }, // Até 10 min
  FORMULA_ANALYSIS_AGENT: { base: 10, gemini: 12, claude: 14 }
};

// Função para calcular créditos por operação conforme documentação (seção 4.3)
function calculateCreditsForOperation(
  operationType: string, 
  model: string, 
  details?: { duration?: number; scenes?: number }
): number {
  // Determinar chave do modelo conforme documentação (seção 4.2)
  let modelKey: 'base' | 'gemini' | 'claude' = 'base';
  if (model?.includes('gemini')) modelKey = 'gemini';
  else if (model?.includes('claude') || model?.includes('gpt-5')) modelKey = 'claude';

  switch (operationType) {
    case 'analyze_video_titles':
    case 'TITLE_ANALYSIS':
      return CREDIT_PRICING.TITLE_ANALYSIS[modelKey];
    
    case 'analyze_script_formula':
    case 'FORMULA_ANALYSIS_AGENT':
      return CREDIT_PRICING.FORMULA_ANALYSIS_AGENT[modelKey];
    
    case 'generate_script_with_formula':
    case 'SCRIPT_PER_MINUTE':
      const duration = details?.duration || 5;
      return Math.ceil(CREDIT_PRICING.SCRIPT_PER_MINUTE[modelKey] * duration);
    
    case 'explore_niche':
    case 'EXPLORE_NICHE':
      return CREDIT_PRICING.EXPLORE_NICHE[modelKey];
    
    case 'batch_images':
    case 'IMAGE_BATCH_10':
      const scenes = details?.scenes || 1;
      if (scenes >= 10) {
        return Math.ceil((scenes / 10) * CREDIT_PRICING.IMAGE_BATCH_10[modelKey]);
      }
      return Math.ceil(scenes * CREDIT_PRICING.IMAGE_PROMPT[modelKey]);
    
    case 'viral_analysis':
    case 'CHANNEL_ANALYSIS':
      return CREDIT_PRICING.CHANNEL_ANALYSIS[modelKey];
    
    default:
      // Fallback: preço base de 5 créditos com multiplicador (seção 4.3)
      const multipliers = { base: 1, gemini: 1.2, claude: 1.5 };
      return Math.ceil(5 * multipliers[modelKey]);
  }
}

// Função checkAndDebitCredits conforme documentação (seção 4.4)
async function checkAndDebitCredits(
  userId: string,
  creditsNeeded: number,
  operationType: string,
  details?: { model?: string }
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    // Passo 3: Verificar saldo
    const { data: creditData, error: creditError } = await supabaseAdmin
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (creditError) {
      console.error('[Credits] Error fetching balance:', creditError);
      return { success: false, error: 'Erro ao verificar saldo de créditos' };
    }

    // Se não existir registro, criar com balance = 50 (FREE plan)
    let currentBalance = creditData?.balance ?? 0;
    
    if (!creditData) {
      const { error: insertError } = await supabaseAdmin
        .from('user_credits')
        .insert({ user_id: userId, balance: 50 });
      
      if (insertError && !insertError.message.includes('duplicate')) {
        console.error('[Credits] Error creating initial credits:', insertError);
      }
      currentBalance = 50;
    }

    // Arredondar saldo atual para cima conforme documentação
    currentBalance = Math.ceil(currentBalance);

    // Comparar com créditos necessários
    if (currentBalance < creditsNeeded) {
      console.log(`[Credits] Insufficient: needed ${creditsNeeded}, available ${currentBalance}`);
      return { 
        success: false, 
        error: `Créditos insuficientes. Necessário: ${creditsNeeded}, Disponível: ${currentBalance}` 
      };
    }

    // Passo 4: Debitar créditos
    const newBalance = Math.ceil(currentBalance - creditsNeeded);
    
    const { error: updateError } = await supabaseAdmin
      .from('user_credits')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[Credits] Error updating balance:', updateError);
      return { success: false, error: 'Erro ao debitar créditos' };
    }

    // Registrar uso na tabela credit_usage
    await supabaseAdmin
      .from('credit_usage')
      .insert({
        user_id: userId,
        operation_type: operationType,
        credits_used: creditsNeeded,
        model_used: details?.model,
        details: { timestamp: new Date().toISOString() }
      });

    // Registrar transação
    await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -creditsNeeded,
        transaction_type: 'debit',
        description: `Operação: ${operationType}`
      });

    console.log(`[Credits] Debited ${creditsNeeded} from user ${userId}. New balance: ${newBalance}`);
    
    return { success: true, newBalance };
  } catch (error) {
    console.error('[Credits] Unexpected error:', error);
    return { success: false, error: 'Erro interno ao processar créditos' };
  }
}

// Função refundCredits conforme documentação (seção 4.5)
async function refundCredits(
  userId: string,
  creditsToRefund: number,
  reason: string,
  operationType: string
): Promise<{ success: boolean; newBalance?: number }> {
  try {
    const { data: creditData } = await supabaseAdmin
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single();

    const currentBalance = creditData?.balance ?? 0;
    const newBalance = Math.ceil(currentBalance + creditsToRefund);

    await supabaseAdmin
      .from('user_credits')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: creditsToRefund,
        transaction_type: 'refund',
        description: `Reembolso: ${reason} (${operationType})`
      });

    console.log(`[Credits] Refunded ${creditsToRefund} to user ${userId}. New balance: ${newBalance}`);
    
    return { success: true, newBalance };
  } catch (error) {
    console.error('[Credits] Refund error:', error);
    return { success: false };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      type, 
      prompt, 
      videoData, 
      channelUrl, 
      niche, 
      text, 
      voiceId, 
      language,
      model,
      duration,
      agentData,
      userId: bodyUserId
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Extrair userId do token JWT ou do body
    let userId = bodyUserId;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      } catch (authError) {
        console.log('[AI Assistant] Could not extract user from token, using bodyUserId');
      }
    }

    // Calcular créditos necessários para esta operação
    const creditsNeeded = calculateCreditsForOperation(type, model || 'gemini', { 
      duration: duration ? parseInt(duration) : 5 
    });
    
    console.log(`[AI Assistant] Operation: ${type}, Model: ${model || 'gemini'}, Credits needed: ${creditsNeeded}, User: ${userId}`);

    // Verificar e debitar créditos se userId disponível
    if (userId) {
      const creditResult = await checkAndDebitCredits(userId, creditsNeeded, type, { model });
      
      if (!creditResult.success) {
        return new Response(
          JSON.stringify({ error: creditResult.error }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log(`[AI Assistant] Credits debited. New balance: ${creditResult.newBalance}`);
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
        // Conforme documentação: Geração de roteiros usando fórmula do agente
        const agentFormula = agentData?.formula || "Hook + Desenvolvimento + Clímax + CTA";
        const agentStructure = agentData?.formula_structure ? JSON.stringify(agentData.formula_structure) : "Usar estrutura padrão de vídeo viral";
        const agentTriggers = agentData?.mental_triggers?.join(", ") || "Curiosidade, Urgência, Prova Social";
        
        systemPrompt = `Você é um roteirista profissional especializado em vídeos virais para YouTube.
        Crie um roteiro COMPLETO seguindo a fórmula viral fornecida pelo agente.
        
        FÓRMULA DO AGENTE A SEGUIR:
        ${agentFormula}
        
        ESTRUTURA BASE DO AGENTE:
        ${agentStructure}
        
        GATILHOS MENTAIS OBRIGATÓRIOS:
        ${agentTriggers}
        
        O roteiro DEVE incluir:
        - Hook impactante nos primeiros 10 segundos que capture atenção imediata
        - Estrutura narrativa com tensão crescente conforme a fórmula
        - Marcações de tempo para cada seção [00:00 - 00:30]
        - Pausas dramáticas indicadas com [PAUSA]
        - Calls-to-action posicionados conforme solicitado
        - Notas de produção entre [colchetes]
        - Uso estratégico dos gatilhos mentais especificados
        
        FORMATO DO ROTEIRO:
        
        # TÍTULO DO VÍDEO
        
        ## PARTE 1 - HOOK [00:00 - 00:30]
        [Instruções de produção e tom de voz]
        "Texto de narração exato"
        
        ## PARTE 2 - DESENVOLVIMENTO [00:30 - XX:XX]
        [Instruções]
        "Narração"
        
        ## PARTE 3 - CLÍMAX [XX:XX - XX:XX]
        [Instruções]
        "Narração"
        
        ## PARTE 4 - CTA [XX:XX - FIM]
        [Instruções]
        "Narração com call-to-action"
        
        ---
        
        IMPORTANTE:
        - Siga a fórmula do agente RIGOROSAMENTE
        - Use os gatilhos mentais especificados de forma natural
        - O roteiro deve estar 100% pronto para narração
        - Responda em português brasileiro`;
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

    console.log("[AI Assistant] Request type:", type);
    console.log("[AI Assistant] System prompt length:", systemPrompt.length);

    // Selecionar modelo conforme documentação
    // Modelos suportados: gpt-4o, claude-sonnet, gemini-2.0-flash, gemini-2.5-flash
    let selectedModel = "google/gemini-2.5-flash"; // Default conforme documentação
    if (model === "gpt-5" || model === "gpt-4o") {
      selectedModel = "openai/gpt-5";
    } else if (model === "claude" || model?.includes("claude")) {
      selectedModel = "google/gemini-2.5-pro"; // Usar pro para qualidade similar ao Claude
    } else if (model === "gemini-pro" || model?.includes("pro")) {
      selectedModel = "google/gemini-2.5-pro";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Assistant] AI Gateway error:", response.status, errorText);
      
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

    console.log("[AI Assistant] AI response received, length:", content?.length);

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
      JSON.stringify({ 
        result,
        creditsUsed: creditsNeeded,
        model: selectedModel
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[AI Assistant] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
