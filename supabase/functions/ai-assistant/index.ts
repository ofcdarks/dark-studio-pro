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
  MULTI_CHANNEL_ANALYSIS: { base: 15, gemini: 18, claude: 22 }, // Análise de múltiplos canais
  
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
    
    case 'analyze_multiple_channels':
    case 'MULTI_CHANNEL_ANALYSIS':
      return CREDIT_PRICING.MULTI_CHANNEL_ANALYSIS[modelKey];
    
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

// Interface for user API settings
interface UserApiSettings {
  openai_api_key: string | null;
  claude_api_key: string | null;
  gemini_api_key: string | null;
  openai_validated: boolean | null;
  claude_validated: boolean | null;
  gemini_validated: boolean | null;
}

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

// Function to get admin API keys from settings
async function getAdminApiKeys(): Promise<AdminApiKeys | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'api_keys')
      .maybeSingle();

    if (error || !data) {
      console.log('[AI Assistant] No admin API settings found');
      return null;
    }

    return data.value as AdminApiKeys;
  } catch (e) {
    console.error('[AI Assistant] Error fetching admin API settings:', e);
    return null;
  }
}

// Extended interface for user API settings with credit preference
interface UserApiSettingsFull extends UserApiSettings {
  use_platform_credits: boolean;
}

// Function to get user's API keys from settings
async function getUserApiKeys(userId: string): Promise<UserApiSettingsFull | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_api_settings')
      .select('openai_api_key, claude_api_key, gemini_api_key, openai_validated, claude_validated, gemini_validated, use_platform_credits')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      console.log('[AI Assistant] No user API settings found');
      return null;
    }

    return {
      ...data,
      use_platform_credits: (data as any).use_platform_credits ?? true
    } as UserApiSettingsFull;
  } catch (e) {
    console.error('[AI Assistant] Error fetching user API settings:', e);
    return null;
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
      subNiche,
      microNiche,
      text, 
      voiceId, 
      language,
      model,
      duration,
      agentData,
      userId: bodyUserId
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

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

    // Get admin API keys
    const adminApiKeys = await getAdminApiKeys();

    // Get user's API settings
    let userApiKeys: UserApiSettingsFull | null = null;
    let useUserApiKey = false;
    let userApiKeyToUse: string | null = null;
    let apiProvider: 'openai' | 'gemini' | 'laozhang' | 'lovable' = 'lovable';
    let laozhangModel: string | null = null;
    let shouldDebitCredits = true;

    if (userId) {
      userApiKeys = await getUserApiKeys(userId);
    }

    // Check if user wants to use platform credits (default: true)
    const usePlatformCredits = userApiKeys?.use_platform_credits ?? true;
    console.log(`[AI Assistant] User preference - Use platform credits: ${usePlatformCredits}`);

    if (usePlatformCredits) {
      // USER WANTS TO USE PLATFORM CREDITS
      // Priority: Admin Laozhang > Admin OpenAI > Admin Gemini > System OpenAI > Lovable AI
      
      if (adminApiKeys?.laozhang && adminApiKeys.laozhang_validated) {
        userApiKeyToUse = adminApiKeys.laozhang;
        apiProvider = 'laozhang';
        
        // Laozhang supports many models - map the UI model ID to a Laozhang model name
        const laozhangModelMap: Record<string, string> = {
          // GPT Models
          "gpt-4o": "gpt-4o",
          "gpt-4o-2025": "gpt-4o",
          "openai/gpt-5": "gpt-4o",
          "openai/gpt-5-mini": "gpt-4o-mini",
          "gpt-5": "gpt-4o",
          "gpt-4o-mini": "gpt-4o-mini",
          "gpt-4-turbo": "gpt-4-turbo",

          // Claude Models - claude-sonnet-4-20250514 is the latest supported
          "claude-4-sonnet": "claude-sonnet-4-20250514",
          "claude": "claude-sonnet-4-20250514",
          "claude-3-5-sonnet": "claude-3-5-sonnet-20241022",
          "claude-3-opus": "claude-3-opus-20240229",
          "claude-sonnet": "claude-sonnet-4-20250514",

          // Gemini Models - Laozhang supports gemini-2.5-pro and gemini-2.5-flash
          "gemini": "gemini-2.5-flash",
          "gemini-flash": "gemini-2.5-flash",
          "gemini-pro": "gemini-2.5-pro",
          "gemini-2.5-flash": "gemini-2.5-flash",
          "gemini-2.5-pro": "gemini-2.5-pro",
          "google/gemini-2.5-flash": "gemini-2.5-flash",
          "google/gemini-2.5-pro": "gemini-2.5-pro",
        };
        
        // Try exact match first, then partial match, then default
        if (model && laozhangModelMap[model]) {
          laozhangModel = laozhangModelMap[model];
        } else if (model?.includes("gpt-4o")) {
          laozhangModel = "gpt-4o";
        } else if (model?.includes("gpt-5") || model?.includes("gpt")) {
          laozhangModel = "gpt-4o";
        } else if (model?.includes("claude-4") || model?.includes("claude-sonnet-4")) {
          laozhangModel = "claude-sonnet-4-20250514";
        } else if (model?.includes("claude")) {
          laozhangModel = "claude-sonnet-4-20250514";
        } else if (model?.includes("gemini-pro") || model?.includes("gemini-2.5-pro")) {
          laozhangModel = "gemini-2.5-pro";
        } else if (model?.includes("gemini")) {
          laozhangModel = "gemini-2.5-flash";
        } else {
          laozhangModel = "gpt-4o-mini"; // Default cost-effective model
        }
        console.log(`[AI Assistant] Using Laozhang AI (platform credits) - Requested: ${model}, Using: ${laozhangModel}`);
      } else if (adminApiKeys?.openai && adminApiKeys.openai_validated) {
        userApiKeyToUse = adminApiKeys.openai ?? null;
        apiProvider = 'openai';
        console.log('[AI Assistant] Using admin OpenAI API key (platform credits)');
      } else if (adminApiKeys?.gemini && adminApiKeys.gemini_validated) {
        userApiKeyToUse = adminApiKeys.gemini ?? null;
        apiProvider = 'gemini';
        console.log('[AI Assistant] Using admin Gemini API key (platform credits)');
      } else if (OPENAI_API_KEY) {
        userApiKeyToUse = OPENAI_API_KEY;
        apiProvider = 'openai';
        console.log('[AI Assistant] Using system OpenAI API key (platform credits)');
      } else if (LOVABLE_API_KEY) {
        apiProvider = 'lovable';
        console.log('[AI Assistant] Using Lovable AI gateway (platform credits)');
      }
      
      // Platform credits mode = debit credits
      shouldDebitCredits = true;
      
    } else {
      // USER WANTS TO USE THEIR OWN API KEYS (no credits deducted)
      console.log('[AI Assistant] User opted to use own API keys');
      shouldDebitCredits = false;
      
      if (userApiKeys) {
        if ((model === "gpt-4o" || model === "gpt-5" || model?.includes("gpt")) && userApiKeys.openai_api_key && userApiKeys.openai_validated) {
          userApiKeyToUse = userApiKeys.openai_api_key;
          apiProvider = 'openai';
          useUserApiKey = true;
          console.log('[AI Assistant] Using user OpenAI API key');
        } else if ((model === "gemini-pro" || model?.includes("gemini")) && userApiKeys.gemini_api_key && userApiKeys.gemini_validated) {
          userApiKeyToUse = userApiKeys.gemini_api_key;
          apiProvider = 'gemini';
          useUserApiKey = true;
          console.log('[AI Assistant] Using user Gemini API key');
        } else if (userApiKeys.openai_api_key && userApiKeys.openai_validated) {
          userApiKeyToUse = userApiKeys.openai_api_key;
          apiProvider = 'openai';
          useUserApiKey = true;
          console.log('[AI Assistant] Using user OpenAI API key (fallback)');
        } else if (userApiKeys.gemini_api_key && userApiKeys.gemini_validated) {
          userApiKeyToUse = userApiKeys.gemini_api_key;
          apiProvider = 'gemini';
          useUserApiKey = true;
          console.log('[AI Assistant] Using user Gemini API key (fallback)');
        } else {
          // No valid user API key found - fall back to platform with credits
          console.log('[AI Assistant] No valid user API keys found, falling back to platform credits');
          shouldDebitCredits = true;
          
          if (adminApiKeys?.laozhang && adminApiKeys.laozhang_validated) {
            userApiKeyToUse = adminApiKeys.laozhang;
            apiProvider = 'laozhang';
            laozhangModel = "gpt-4o-mini";
            console.log('[AI Assistant] Fallback to Laozhang AI');
          } else if (LOVABLE_API_KEY) {
            apiProvider = 'lovable';
            console.log('[AI Assistant] Fallback to Lovable AI');
          }
        }
      } else {
        // No user settings at all - use platform with credits
        console.log('[AI Assistant] No user API settings, using platform credits');
        shouldDebitCredits = true;
        
        if (adminApiKeys?.laozhang && adminApiKeys.laozhang_validated) {
          userApiKeyToUse = adminApiKeys.laozhang;
          apiProvider = 'laozhang';
          laozhangModel = "gpt-4o-mini";
        } else if (LOVABLE_API_KEY) {
          apiProvider = 'lovable';
        }
      }
    }

    // Final check - ensure we have an API provider
    if (apiProvider === 'lovable' && !LOVABLE_API_KEY) {
      throw new Error("Nenhuma chave de API disponível. Configure suas chaves em Configurações.");
    }

    // Calcular créditos necessários para esta operação
    const creditsNeeded = calculateCreditsForOperation(type, model || 'gemini', { 
      duration: duration ? parseInt(duration) : 5 
    });
    
    console.log(`[AI Assistant] Operation: ${type}, Model: ${model || 'gemini'}, Provider: ${apiProvider}, Credits needed: ${creditsNeeded}, User: ${userId}, Debit credits: ${shouldDebitCredits}`);

    // Verificar e debitar créditos se shouldDebitCredits for true
    if (userId && shouldDebitCredits) {
      const creditResult = await checkAndDebitCredits(userId, creditsNeeded, type, { model });
      
      if (!creditResult.success) {
        return new Response(
          JSON.stringify({ error: creditResult.error }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log(`[AI Assistant] Credits debited. New balance: ${creditResult.newBalance}`);
    } else if (!shouldDebitCredits) {
      console.log('[AI Assistant] Using own API keys - no credits debited');
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
        1. Identifique a fórmula/estrutura EXATA do título original e por que ele funciona
        2. Gere 5 novos títulos que OBRIGATORIAMENTE usem a mesma fórmula viral identificada, mas MELHORADOS
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
              "title": "Título gerado em ${lang}",
              "formula": "A mesma fórmula do original + elementos adicionais que melhoram",
              "formulaSurpresa": "Elementos extras adicionados para potencializar (ex: + Gatilho de exclusividade + Número específico)",
              "quality": score de 1-10,
              "impact": score de 1-10,
              "isBest": true apenas para o melhor título
            }
          ]
        }
        
        ⚠️ REGRAS OBRIGATÓRIAS PARA GERAÇÃO DE TÍTULOS:
        
        1. FÓRMULA ORIGINAL SEMPRE PRESENTE: Cada título DEVE conter a fórmula viral extraída do título original. Não gere títulos que ignorem a fórmula.
        
        2. MELHORIAS OBRIGATÓRIAS: Adicione elementos extras para potencializar a fórmula:
           - Misture com outras fórmulas virais (Mistério + Revelação, Proibido + Exclusivo)
           - Adicione gatilhos mentais: Urgência, Escassez, Prova Social, Curiosidade, Medo, Exclusividade
           - Use números específicos quando relevante (ex: "3 SEGREDOS", "A VERDADE sobre os 7")
           - Adicione palavras de poder: REVELADO, EXPOSTO, PROIBIDO, SECRETO, CHOCANTE, REAL
        
        3. NICHO INTOCÁVEL: NUNCA mude o nicho ou tema central. Se é sobre Incas, todos títulos são sobre Incas.
           - PODE mudar: personagens específicos, situações, povos similares do mesmo nicho, detalhes
           - NÃO PODE mudar: o assunto central, a categoria temática, o universo do conteúdo
           
        4. VARIAÇÃO CRIATIVA PERMITIDA:
           - Troque civilizações/povos por outros do mesmo nicho (Incas → Maias → Astecas)
           - Mude situações específicas mantendo a estrutura
           - Varie os elementos dramáticos mas mantenha o tom
           - Explore ângulos diferentes do mesmo tema
        
        5. FORMATO TÉCNICO:
           - Máximo 60 caracteres
           - Use CAIXA ALTA estrategicamente como no original
           - Todos os títulos em ${lang}
           - Um título deve ter isBest: true
        
        EXEMPLO DE APLICAÇÃO:
        Original: "O SEGREDO dos Incas que Arqueólogos Escondem"
        Fórmula: Segredo + Sujeito + Autoridade esconde
        
        Título 1: "A TÉCNICA Maia que Cientistas NÃO Conseguem Explicar" (Fórmula + Mistério técnico)
        Título 2: "O RITUAL Asteca PROIBIDO que a História Escondeu de Você" (Fórmula + Proibido + Personalização)
        Título 3: "3 SEGREDOS Egípcios que Museus se Recusam a Expor" (Fórmula + Número + Exclusividade)`;
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

      case "find_subniches":
        // Busca de subnichos com análise de demanda e concorrência
        const mainNicheInput = niche || prompt;
        const competitorSubnicheInput = text || "";
        systemPrompt = `Você é um analista estratégico ESPECIALISTA em nichos virais do YouTube com milhões de visualizações.
        
        Analise o nicho principal "${mainNicheInput}" e encontre subnichos promissores com ALTA DEMANDA e BAIXA CONCORRÊNCIA.
        
        ${competitorSubnicheInput ? `O usuário também considerou o subnicho "${competitorSubnicheInput}" que provavelmente é concorrido. Use isso como referência para encontrar alternativas melhores.` : ""}
        
        Para cada subnicho, avalie:
        1. DEMANDA: Volume de buscas, interesse do público, tendências de crescimento
        2. CONCORRÊNCIA: Número de canais, qualidade do conteúdo existente, saturação
        3. OPORTUNIDADE: Potencial de monetização, crescimento projetado, facilidade de entrada
        4. DIFERENCIAÇÃO: Como se destacar neste subnicho
        5. MICRO-NICHO: Um segmento ainda mais específico dentro do subnicho
        6. TÍTULOS VIRAIS: 3 exemplos de títulos REAIS e ESPECÍFICOS que funcionariam bem
        7. PAÍSES ALVO: Países ideais para começar com menor concorrência
        
        ⚠️ REGRA CRÍTICA PARA TÍTULOS DE EXEMPLO:
        Os títulos NÃO podem ser genéricos! Devem ser ULTRA-ESPECÍFICOS e parecer títulos de vídeos REAIS.
        
        ❌ ERRADO (genérico): "A história incrível que ninguém conhece"
        ✅ CERTO (específico): "O piloto que salvou 155 vidas pousando no Rio Hudson"
        
        ❌ ERRADO (genérico): "O herói esquecido que mudou tudo"  
        ✅ CERTO (específico): "Irena Sendler: a mulher que salvou 2.500 crianças dos nazistas"
        
        ❌ ERRADO (genérico): "A invenção proibida que mudaria o mundo"
        ✅ CERTO (específico): "Nikola Tesla e o carro elétrico de 1931 que funcionava sem bateria"
        
        Os títulos devem mencionar NOMES, NÚMEROS, DATAS, LUGARES ESPECÍFICOS!
        
        Retorne EXATAMENTE 5 subnichos promissores em formato JSON:
        {
          "mainNiche": "${mainNicheInput}",
          "analysis": "Breve análise do mercado do nicho principal",
          "subniches": [
            {
              "name": "Nome do subnicho específico",
              "potential": "Muito Alto" | "Alto" | "Médio" | "Baixo",
              "competition": "Muito Baixa" | "Baixa" | "Média" | "Alta",
              "demandScore": número de 1-10,
              "competitionScore": número de 1-10,
              "opportunityScore": número de 1-10,
              "description": "Descrição detalhada do subnicho e por que é uma boa oportunidade",
              "microNiche": "Um segmento ultra-específico dentro deste subnicho para dominar mais rápido",
              "exampleTitles": [
                "Título ESPECÍFICO com nome/número/data real - ex: 'John Harrison: o carpinteiro que resolveu o maior problema da navegação'",
                "Título ESPECÍFICO com fato concreto - ex: 'A bomba de 1,4 megatons que os EUA perderam na costa da Espanha em 1966'",
                "Título ESPECÍFICO com gancho emocional - ex: 'Por que a Kodak inventou a câmera digital em 1975 e escondeu por 20 anos?'"
              ],
              "targetCountries": ["BR Brasil", "PT Portugal", "etc - países com melhor oportunidade"],
              "contentIdeas": ["ideia 1", "ideia 2", "ideia 3"],
              "keywords": ["palavra-chave 1", "palavra-chave 2"],
              "monetizationPotential": "Alto" | "Médio" | "Baixo",
              "growthTrend": "Crescendo" | "Estável" | "Declinando",
              "entryDifficulty": "Fácil" | "Moderada" | "Difícil"
            }
          ],
          "recommendations": "Recomendações gerais para o usuário",
          "bestChoice": "Nome do subnicho mais recomendado e por quê"
        }
        
        IMPORTANTE:
        - Priorize subnichos com ALTA demanda e BAIXA concorrência
        - Seja específico e prático nos subnichos sugeridos
        - O microNiche deve ser MUITO específico (ex: "Histórias de sobrevivência na Antártida" ao invés de apenas "Histórias de sobrevivência")
        - Os 3 títulos de exemplo DEVEM ser específicos com nomes, números e fatos reais - NUNCA genéricos!
        - Os países alvo devem ter código de 2 letras antes do nome (ex: "BR Brasil", "PT Portugal", "AR Argentina")
        - Considere tendências atuais de 2025/2026
        - Foque em oportunidades reais e acionáveis
        - Os subnichos devem ser diferentes o suficiente para diversificar
        Responda APENAS com o JSON válido, sem texto adicional.`;
        userPrompt = `Encontre subnichos promissores para o nicho: ${mainNicheInput}`;
        break;

      case "analyze_competitor_channel":
        // Análise de canal concorrente e plano estratégico
        const channelUrlInput = channelUrl || prompt;
        systemPrompt = `Você é um estrategista de conteúdo especializado em análise competitiva de canais do YouTube.
        
        Analise o canal concorrente fornecido e crie um PLANO ESTRATÉGICO COMPLETO para um novo canal competir neste nicho.
        
        Baseado na URL/nome do canal "${channelUrlInput}", faça:
        
        1. ANÁLISE DO CONCORRENTE:
           - Identifique o nicho e subnicho exato do canal
           - Analise a estratégia de conteúdo atual
           - Identifique pontos fortes e fracos
           - Detecte padrões de sucesso nos vídeos
        
        2. OPORTUNIDADES:
           - Gaps de conteúdo não explorados
           - Formatos que funcionam mas são pouco usados
           - Tendências emergentes no nicho
        
        3. PLANO ESTRATÉGICO:
           - Como se diferenciar do concorrente
           - Estratégia de conteúdo recomendada
           - Frequência ideal de postagem
           - Tipos de vídeos prioritários
        
        Retorne em formato JSON:
        {
          "channelAnalysis": {
            "name": "Nome do canal (ou estimado pela URL)",
            "niche": "Nicho principal identificado",
            "subNiche": "Subnicho específico",
            "estimatedSubscribers": "Faixa estimada de inscritos",
            "strengths": ["ponto forte 1", "ponto forte 2"],
            "weaknesses": ["fraqueza 1", "fraqueza 2"],
            "contentPatterns": ["padrão 1", "padrão 2"],
            "postingFrequency": "Frequência estimada"
          },
          "opportunities": [
            {
              "type": "Gap de conteúdo" | "Formato" | "Tendência",
              "description": "Descrição da oportunidade",
              "priority": "Alta" | "Média" | "Baixa"
            }
          ],
          "strategicPlan": {
            "positioning": "Como se posicionar para competir",
            "uniqueValue": "Proposta de valor única recomendada",
            "contentStrategy": "Estratégia de conteúdo detalhada",
            "contentIdeas": ["ideia de vídeo 1", "ideia 2", "ideia 3", "ideia 4", "ideia 5"],
            "differentials": ["diferencial 1", "diferencial 2", "diferencial 3"],
            "recommendations": ["recomendação 1", "recomendação 2", "recomendação 3"],
            "postingSchedule": "Frequência e dias recomendados",
            "growthTimeline": "Expectativa de crescimento em 3, 6 e 12 meses"
          },
          "quickWins": ["ação imediata 1", "ação imediata 2", "ação imediata 3"],
          "summary": "Resumo executivo do plano estratégico"
        }
        
        IMPORTANTE:
        - Seja específico e acionável nas recomendações
        - Baseie-se em estratégias comprovadas do YouTube
        - Considere tendências atuais de 2025/2026
        - Foque em diferenciação real, não apenas cópia
        Responda APENAS com o JSON válido, sem texto adicional.`;
        userPrompt = `Analise este canal e crie um plano estratégico: ${channelUrlInput}`;
        break;

      case "regenerate_titles":
        // Regenerar apenas títulos de exemplo para um subnicho específico
        const regenNiche = niche || "";
        const regenSubNiche = subNiche || "";
        const regenMicroNiche = microNiche || "";
        systemPrompt = `Você é um especialista em títulos VIRAIS do YouTube.
        
        Gere 3 títulos ULTRA-ESPECÍFICOS e VIRAIS para o seguinte contexto:
        - Nicho: ${regenNiche}
        - Subnicho: ${regenSubNiche}
        ${regenMicroNiche ? `- Micro-nicho: ${regenMicroNiche}` : ""}
        
        ⚠️ REGRA CRÍTICA:
        Os títulos DEVEM ser ULTRA-ESPECÍFICOS com NOMES, NÚMEROS, DATAS, LUGARES REAIS.
        
        ❌ ERRADO (genérico): "A história incrível que ninguém conhece"
        ✅ CERTO (específico): "O piloto Sully que salvou 155 vidas pousando no Rio Hudson em 2009"
        
        ❌ ERRADO (genérico): "O herói esquecido que mudou tudo"  
        ✅ CERTO (específico): "Irena Sendler: a mulher que salvou 2.500 crianças dos nazistas"
        
        ❌ ERRADO (genérico): "A invenção proibida que mudaria o mundo"
        ✅ CERTO (específico): "Por que a Kodak inventou a câmera digital em 1975 e escondeu por 20 anos?"
        
        Retorne APENAS um JSON válido:
        {
          "titles": [
            "Título específico 1 com nome/número/data real",
            "Título específico 2 com fato concreto e impactante",
            "Título específico 3 com gancho emocional forte"
          ]
        }
        
        Responda APENAS com o JSON, sem texto adicional.`;
        userPrompt = `Gere 3 títulos virais específicos para o subnicho: ${regenSubNiche}`;
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

      case "analyze_multiple_channels":
        // Análise de múltiplos canais para identificar lacunas, padrões e oportunidades
        const channelsData = agentData?.channels || [];
        const channelsList = channelsData.map((ch: any) => 
          `- ${ch.name || 'Canal'}: ${ch.niche || 'Nicho desconhecido'} / ${ch.subniche || 'Subnicho desconhecido'} (${ch.subscribers || 'N/A'} inscritos)
           Vídeos populares: ${ch.topVideos?.map((v: any) => v.title).join(', ') || 'N/A'}`
        ).join('\n');
        
        systemPrompt = `Você é um estrategista de conteúdo ESPECIALISTA em análise competitiva do YouTube.
        
        Analise os seguintes ${channelsData.length} canais simultaneamente e forneça uma análise profunda:
        
        ${channelsList}
        
        Sua análise deve incluir:
        
        1. ANÁLISE DE LACUNAS (gaps):
           - Identifique temas que NENHUM dos canais está cobrindo adequadamente
           - Identifique formatos de vídeo ausentes
           - Identifique públicos sub-atendidos
        
        2. OPORTUNIDADES:
           - Baseado nos gaps, liste oportunidades de conteúdo
           - Identifique tendências que eles não estão aproveitando
           - Sugira combinações únicas de nichos
        
        3. PADRÕES IDENTIFICADOS:
           - Quais fórmulas de título funcionam para todos?
           - Quais elementos visuais são comuns?
           - Qual frequência de postagem funciona?
        
        4. TÍTULOS OTIMIZADOS (15 títulos):
           - Misture as fórmulas de TODOS os canais analisados
           - Crie títulos que preencham as lacunas identificadas
           - Use gatilhos mentais: Urgência, Escassez, Curiosidade, Exclusividade
           - Cada título deve ter score de potencial viral (0-100)
        
        5. IDEIAS DE CANAL (3 ideias):
           - Sugira conceitos de novos canais baseados nas lacunas
           - Para cada canal, sugira os 5 primeiros vídeos
           - Foque em diferenciação e público sub-atendido
        
        Retorne em formato JSON:
        {
          "gapAnalysis": {
            "gaps": ["lacuna 1", "lacuna 2", "lacuna 3", "lacuna 4", "lacuna 5"],
            "opportunities": ["oportunidade 1", "oportunidade 2", "oportunidade 3", "oportunidade 4", "oportunidade 5"]
          },
          "patternsMixed": ["padrão comum 1", "padrão comum 2", "padrão comum 3", "fórmula identificada 1", "fórmula identificada 2"],
          "optimizedTitles": [
            {
              "title": "Título otimizado que mistura fórmulas dos canais",
              "formula": "Fórmula utilizada (ex: Curiosidade + Número + Exclusividade)",
              "explanation": "Por que este título funciona e preenche lacunas",
              "score": 85
            }
          ],
          "channelIdeas": [
            {
              "name": "Nome sugerido para o canal",
              "concept": "Conceito e proposta de valor única",
              "niche": "Nicho específico combinando elementos dos analisados",
              "firstVideos": [
                "Título do vídeo 1 - gancho forte",
                "Título do vídeo 2 - estabelece autoridade",
                "Título do vídeo 3 - viralização",
                "Título do vídeo 4 - engajamento",
                "Título do vídeo 5 - consolidação"
              ]
            }
          ]
        }
        
        IMPORTANTE:
        - Gere exatamente 15 títulos otimizados
        - Gere exatamente 3 ideias de canal
        - Cada ideia de canal deve ter exatamente 5 vídeos sugeridos
        - Todos os títulos em português brasileiro
        - Foque em diferenciação real baseada nos gaps identificados
        
        Responda APENAS com o JSON válido, sem texto adicional.`;
        userPrompt = `Analise estes ${channelsData.length} canais e gere uma estratégia completa baseada nas lacunas e oportunidades identificadas.`;
        break;

      case "agent_chat":
        // Chat with a custom agent
        if (agentData?.systemPrompt) {
          systemPrompt = agentData.systemPrompt;
        } else {
          systemPrompt = `Você é "${agentData?.name || 'um assistente'}", um agente de IA especializado em criar conteúdo viral para YouTube.`;
          if (agentData?.niche) {
            systemPrompt += ` Seu nicho é: ${agentData.niche}`;
          }
          if (agentData?.formula) {
            systemPrompt += ` Instruções: ${agentData.formula}`;
          }
          if (agentData?.memory) {
            systemPrompt += ` Memória: ${agentData.memory}`;
          }
          if (agentData?.mentalTriggers?.length) {
            systemPrompt += ` Gatilhos mentais: ${agentData.mentalTriggers.join(", ")}`;
          }
        }
        
        // Build the conversation context
        if (agentData?.conversationHistory?.length) {
          // The messages will be appended in the API call
          userPrompt = prompt;
        } else {
          userPrompt = prompt;
        }
        break;

      default:
        systemPrompt = "Você é um assistente especializado em criação de conteúdo para YouTube. Responda em português brasileiro de forma clara e útil.";
    }

    console.log("[AI Assistant] Request type:", type);
    console.log("[AI Assistant] System prompt length:", systemPrompt.length);

    // Determine API endpoint and model based on provider
    let apiUrl: string;
    let apiKey: string;
    let selectedModel: string;
    let requestHeaders: Record<string, string>;

    // Use external provider when we have a key (user or admin), otherwise use Lovable AI Gateway
    if (userApiKeyToUse && apiProvider !== 'lovable') {
      if (apiProvider === 'laozhang') {
        // Laozhang AI Gateway - OpenAI compatible
        apiUrl = "https://api.laozhang.ai/v1/chat/completions";
        apiKey = userApiKeyToUse;
        selectedModel = laozhangModel || "gpt-4o-mini";
        requestHeaders = {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };
        console.log(`[AI Assistant] Using Laozhang AI API with model: ${selectedModel}`);
      } else if (apiProvider === 'openai') {
        apiUrl = "https://api.openai.com/v1/chat/completions";
        apiKey = userApiKeyToUse;
        selectedModel = "gpt-4o-mini"; // default cost-effective
        if (model === "gpt-4o" || model === "gpt-5" || model?.includes("gpt")) {
          selectedModel = "gpt-4o";
        }
        requestHeaders = {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };
        console.log(`[AI Assistant] Using OpenAI API directly with model: ${selectedModel}`);
      } else if (apiProvider === 'gemini') {
        apiKey = userApiKeyToUse;
        selectedModel = "gemini-1.5-flash";
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        if (model === "gemini-pro" || model?.includes("pro")) {
          selectedModel = "gemini-1.5-pro";
          apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
        }
        requestHeaders = {
          "Content-Type": "application/json",
        };
        console.log(`[AI Assistant] Using Gemini API directly with model: ${selectedModel}`);
      } else {
        throw new Error("Provider não suportado");
      }
    } else {
      // Use Lovable AI Gateway
      apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = LOVABLE_API_KEY!;
      selectedModel = "google/gemini-2.5-flash";
      if (model === "gpt-5" || model === "gpt-4o") {
        selectedModel = "openai/gpt-5";
      } else if (model === "claude" || model?.includes("claude")) {
        selectedModel = "google/gemini-2.5-pro";
      } else if (model === "gemini-pro" || model?.includes("pro")) {
        selectedModel = "google/gemini-2.5-pro";
      }
      requestHeaders = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };
      console.log(`[AI Assistant] Using Lovable AI Gateway with model: ${selectedModel}`);
    }

    let response: Response;

    if (apiProvider === 'gemini' && userApiKeyToUse) {
      // Gemini API has a different request format
      response = await fetch(apiUrl, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      });
    } else {
      // OpenAI-compatible format (OpenAI, Laozhang AI, and Lovable AI Gateway)
      response = await fetch(apiUrl, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Assistant] AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Configure suas chaves de API em Configurações ou adicione mais créditos." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Chave de API inválida. Verifique suas configurações." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract content based on provider
    let content: string;
    if (apiProvider === 'gemini' && useUserApiKey) {
      // Gemini response format
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      // OpenAI-compatible response format
      content = data.choices?.[0]?.message?.content || "";
    }

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

    // For agent_chat, return simple response format
    if (type === "agent_chat") {
      return new Response(
        JSON.stringify({ 
          response: content,
          text: content,
          creditsUsed: useUserApiKey ? 0 : creditsNeeded,
          model: selectedModel,
          provider: apiProvider
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        result,
        creditsUsed: useUserApiKey ? 0 : creditsNeeded,
        model: selectedModel,
        provider: apiProvider
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
