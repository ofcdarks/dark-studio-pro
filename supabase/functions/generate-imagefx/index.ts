import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Lovable AI Gateway for prompt rewriting
const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const DefaultHeader = {
  "Origin": "https://labs.google",
  "Content-Type": "application/json",
  "Referer": "https://labs.google/fx/tools/image-fx"
};

const Model = {
  IMAGEN_3: "IMAGEN_3",
  IMAGEN_3_5: "IMAGEN_3_5"
} as const;

const AspectRatio = {
  SQUARE: "IMAGE_ASPECT_RATIO_SQUARE",
  PORTRAIT: "IMAGE_ASPECT_RATIO_PORTRAIT",
  LANDSCAPE: "IMAGE_ASPECT_RATIO_LANDSCAPE",
  THUMBNAIL: "IMAGE_ASPECT_RATIO_LANDSCAPE" // 16:9 for thumbnails
} as const;

// Rewrite prompt using AI to make it safe - rápido e contextual
async function rewritePromptForSafety(originalPrompt: string, attemptNumber: number = 1): Promise<string> {
  if (!LOVABLE_API_KEY) {
    console.log('[ImageFX] No Lovable API key, cannot rewrite prompt');
    throw new Error("Não foi possível reescrever o prompt bloqueado.");
  }

  console.log(`[ImageFX] Rewriting blocked prompt (attempt ${attemptNumber})...`);

  // Estratégia única e eficaz que mantém o contexto do roteiro
  const systemPrompt = attemptNumber === 1 
    ? `You are an expert at rewriting image prompts to pass AI safety filters while keeping the EXACT same visual context.

CRITICAL RULES:
1. Keep the SAME scene, setting, and visual composition
2. Replace sensitive elements with safe alternatives:
   - Violence/weapons → peaceful objects or symbolic representations
   - Blood → red fabric, flowers, or sunset lighting
   - People in danger → people in neutral poses
   - Scary content → mysterious atmospheric scenes
3. Keep all visual descriptions: lighting, colors, camera angles, style
4. Add: "professional cinematography, cinematic lighting, 8K quality"
5. Keep: "1280x720, 16:9 aspect ratio, full frame"
6. Output ONLY the rewritten prompt, nothing else

The goal is to create the SAME visual scene but described in a safe way.`
    : `You are creating an ABSTRACT representation of a visual concept that will NEVER be blocked.

MANDATORY RULES:
1. Transform the scene into pure visual elements: colors, textures, light, atmosphere
2. NO people, NO actions, NO specific objects that could be flagged
3. Focus on: moods, color palettes, lighting effects, abstract compositions
4. Use terms like: "ethereal", "atmospheric", "cinematic mood", "artistic composition"
5. Add: "abstract digital art, 1280x720, 16:9, full frame, professional photography"
6. Output ONLY the abstract visual prompt

Create a beautiful, safe image that captures the ESSENCE of the original scene.`;

  try {
    const response = await fetch(LOVABLE_AI_GATEWAY, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Rewrite this blocked prompt:\n\n${originalPrompt}` }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.error('[ImageFX] AI rewrite failed:', response.status);
      throw new Error("Falha ao reescrever prompt");
    }

    const data = await response.json();
    const rewrittenPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!rewrittenPrompt) {
      throw new Error("AI não retornou prompt reescrito");
    }

    // Garantir que inclui requisitos de formato
    const finalPrompt = rewrittenPrompt.includes("1280x720") 
      ? rewrittenPrompt 
      : `${rewrittenPrompt}, 1280x720 resolution, 16:9 aspect ratio, full frame composition, no black bars`;

    console.log('[ImageFX] Prompt rewritten successfully');
    console.log('[ImageFX] New prompt:', finalPrompt.substring(0, 150) + '...');

    return finalPrompt;
  } catch (error) {
    console.error('[ImageFX] Error rewriting prompt:', error);
    throw new Error("Não foi possível reescrever o prompt bloqueado.");
  }
}

// Session cache to avoid re-fetching every request
const sessionCache = new Map<string, { token: string; expires: Date; user: any }>();

async function fetchSession(cookie: string): Promise<{ access_token: string; expires: string; user: any }> {
  console.log('[ImageFX] Fetching session...');
  
  const res = await fetch("https://labs.google/fx/api/auth/session", {
    headers: {
      "Origin": "https://labs.google",
      "Referer": "https://labs.google/fx/tools/image-fx",
      "Cookie": cookie
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[ImageFX] Session error ${res.status}:`, errorText);
    
    if ([401, 403].includes(res.status)) {
      throw new Error(`Falha de autenticação (${res.status}). Verifique os cookies do ImageFX.`);
    }
    throw new Error(`Erro ao obter sessão: ${res.status}`);
  }

  const data = await res.json();
  
  if (!data.access_token || !data.expires || !data.user) {
    console.error('[ImageFX] Invalid session response:', data);
    throw new Error("Resposta de sessão inválida. Atualize os cookies do ImageFX.");
  }

  console.log('[ImageFX] Session obtained successfully');
  return data;
}

async function getAuthHeaders(cookie: string, userId: string): Promise<Record<string, string>> {
  // Check cache first
  const cached = sessionCache.get(userId);
  const now = new Date();
  
  if (cached && cached.expires > new Date(now.getTime() + 30000)) {
    console.log('[ImageFX] Using cached session');
    return {
      ...DefaultHeader,
      "Cookie": cookie,
      "Authorization": `Bearer ${cached.token}`
    };
  }

  // Fetch new session
  const session = await fetchSession(cookie);
  
  // Cache the session
  sessionCache.set(userId, {
    token: session.access_token,
    expires: new Date(session.expires),
    user: session.user
  });

  return {
    ...DefaultHeader,
    "Cookie": cookie,
    "Authorization": `Bearer ${session.access_token}`
  };
}

function generateSessionId(): string {
  const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${Date.now()}-${randomHex}`;
}

function buildPromptPayload(options: {
  prompt: string;
  negativePrompt?: string;
  numberOfImages?: number;
  aspectRatio?: string;
  seed?: number;
  model?: string;
}): string {
  const seed = options.seed ?? Math.floor(Math.random() * 2147483647);
  const model = options.model === "IMAGEN_3" ? Model.IMAGEN_3 : Model.IMAGEN_3_5;
  
  // CRÍTICO: Instruções rigorosas para resolução 1280x720 e preenchimento total do quadro
  const enhancedPrompt = `${options.prompt}. MANDATORY TECHNICAL REQUIREMENTS: Exact 1280x720 pixel resolution, 16:9 widescreen aspect ratio, the entire image canvas must be filled edge-to-edge with visual content, ABSOLUTELY NO black bars on any side, NO letterbox, NO pillarbox, NO borders, NO empty margins, the subject and background MUST extend to fill 100% of the frame horizontally and vertically, ultra-wide angle composition that fills the complete canvas with no gaps`;

  // IMPORTANTE: a API do ImageFX pode rejeitar campos de "negative prompt".
  // Para manter compatibilidade, aplicamos as restrições (sem bordas/faixas) diretamente no prompt acima.

  const payload: any = {
    userInput: {
      candidatesCount: options.numberOfImages || 1,
      prompts: [enhancedPrompt],
      seed: seed
    },
    clientContext: {
      sessionId: generateSessionId(),
      tool: "IMAGE_FX"
    },
    modelInput: {
      modelNameType: model
    },
    aspectRatio: options.aspectRatio || AspectRatio.LANDSCAPE
  };

  return JSON.stringify(payload);
}

function parseImageFXError(text: string, status: number): string {
  try {
    const json = JSON.parse(text);
    const reason = json?.error?.details?.[0]?.reason;
    const fallback = json?.error?.message || `Erro ${status}`;

    switch (reason) {
      case "PUBLIC_ERROR_UNSAFE_GENERATION":
        return "Prompt bloqueado: conteúdo considerado inseguro pelo ImageFX.";
      case "PUBLIC_ERROR_PROMINENT_PEOPLE_FILTER_FAILED":
        return "Prompt bloqueado: não é permitido gerar imagens de pessoas famosas.";
      case "PUBLIC_ERROR_QUALITY_FILTER_FAILED":
      case "PUBLIC_ERROR_AESTHETIC_FILTER_FAILED":
        return "Prompt bloqueado: qualidade ou estética considerada baixa.";
      case "PUBLIC_ERROR_USER_REQUESTS_THROTTLED":
        return "Limite de requisições atingido. Aguarde alguns segundos e tente novamente.";
      default:
        return reason ? `Erro ImageFX: ${reason}` : fallback;
    }
  } catch {
    return status === 429 
      ? "Limite de requisições atingido. Aguarde alguns segundos." 
      : `Erro ${status}: ${text.substring(0, 200)}`;
  }
}

async function generateWithImageFX(
  cookie: string,
  userId: string,
  options: {
    prompt: string;
    negativePrompt?: string;
    numberOfImages?: number;
    aspectRatio?: string;
    seed?: number;
    model?: string;
  },
  retries = 3,
  allowPromptRewrite = true,
  rewriteAttempts = 0
): Promise<any[]> {
  const headers = await getAuthHeaders(cookie, userId);
  const payload = buildPromptPayload(options);

  console.log('[ImageFX] Generating image with prompt:', options.prompt.substring(0, 100) + '...');
  console.log('[ImageFX] Aspect ratio:', options.aspectRatio);
  console.log('[ImageFX] Model:', options.model || 'IMAGEN_3_5');
  console.log('[ImageFX] Retries left:', retries, '| Rewrite attempts:', rewriteAttempts);

  try {
    const res = await fetch("https://aisandbox-pa.googleapis.com/v1:runImageFx", {
      method: "POST",
      body: payload,
      headers
    });

    if (!res.ok) {
      const errText = await res.text();
      const msg = parseImageFXError(errText, res.status);
      
      // If auth error, clear cache and throw
      if ([401, 403].includes(res.status)) {
        sessionCache.delete(userId);
        throw new Error(`Erro de autenticação: ${msg}. Atualize os cookies do ImageFX nas configurações.`);
      }
      
      // Check if rate limited - wait longer and retry
      const isRateLimited = msg.includes("Limite de requisições") || res.status === 429;
      if (isRateLimited && retries > 0) {
        const waitTime = 3000 + (3 - retries) * 2000; // 3s, 5s, 7s
        console.log(`[ImageFX] Rate limited, waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return generateWithImageFX(cookie, userId, options, retries - 1, allowPromptRewrite, rewriteAttempts);
      }
      
      // Check if prompt was blocked for safety - try rewriting up to 3 times with increasingly aggressive strategies
      const isUnsafeContent = msg.includes("inseguro") || msg.includes("bloqueado") || msg.includes("blocked") || msg.includes("safety") || msg.includes("violates");
      
      if (isUnsafeContent && allowPromptRewrite && rewriteAttempts < 3) {
        console.log(`[ImageFX] Prompt blocked (attempt ${rewriteAttempts + 1}/3), attempting to rewrite...`);
        
        try {
          const rewrittenPrompt = await rewritePromptForSafety(options.prompt, rewriteAttempts + 1);
          
          // Add a small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Retry with rewritten prompt
          return await generateWithImageFX(
            cookie,
            userId,
            { ...options, prompt: rewrittenPrompt },
            retries,
            rewriteAttempts < 2, // Allow more rewrites
            rewriteAttempts + 1
          );
        } catch (rewriteError) {
          console.error('[ImageFX] Failed to rewrite prompt:', rewriteError);
          // Continue to retry logic below
        }
      }
      
      throw new Error(msg);
    }

    const json = await res.json();
    const images = json?.imagePanels?.[0]?.generatedImages;
    
    if (!images?.length) {
      throw new Error("A API ImageFX não retornou imagens.");
    }

    console.log(`[ImageFX] Generated ${images.length} image(s) successfully`);

    // Transform to standard format
    return images.map((img: any) => ({
      url: `data:image/png;base64,${img.encodedImage}`,
      prompt: options.prompt,
      seed: img.seed,
      mediaId: img.mediaGenerationId,
      model: img.modelNameType || options.model || 'IMAGEN_3_5',
      wasRewritten: rewriteAttempts > 0
    }));

  } catch (err) {
    const errorMsg = (err as Error).message;
    
    // Don't retry auth errors
    if (errorMsg.includes('autenticação')) {
      throw err;
    }
    
    // Check if it's a rate limit that slipped through
    if (errorMsg.includes('Limite de requisições') && retries > 0) {
      const waitTime = 3000 + (3 - retries) * 2000;
      console.log(`[ImageFX] Rate limit error, waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return generateWithImageFX(cookie, userId, options, retries - 1, allowPromptRewrite, rewriteAttempts);
    }
    
    // General retry with delay
    if (retries > 0) {
      const waitTime = 2000 + (3 - retries) * 1000;
      console.warn(`[ImageFX] Failed, waiting ${waitTime}ms before retry... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return generateWithImageFX(cookie, userId, options, retries - 1, allowPromptRewrite, rewriteAttempts);
    }
    
    throw err;
  }
}

// Get user's ImageFX cookies from settings - supports multiple cookies separated by |||
async function getUserImageFXCookies(userId: string): Promise<string[] | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_api_settings')
      .select('imagefx_cookies, imagefx_validated')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      console.log('[ImageFX] No user settings found');
      return null;
    }

    if (!data.imagefx_validated) {
      console.log('[ImageFX] Cookies not validated');
      return null;
    }

    const rawCookies = (data as any).imagefx_cookies || null;
    if (!rawCookies) return null;
    
    // Split by ||| for multiple cookies support
    const cookieList = rawCookies.split('|||').map((c: string) => c.trim()).filter((c: string) => c.length > 0);
    
    if (cookieList.length === 0) return null;
    
    console.log(`[ImageFX] Found ${cookieList.length} cookie(s) configured`);
    return cookieList;
  } catch (e) {
    console.error('[ImageFX] Error fetching user cookies:', e);
    return null;
  }
}

// Deterministic cookie selector based on scene index for ordered distribution
function getCookieForScene(sceneIndex: number, cookies: string[]): { cookie: string; cookieIndex: number } {
  const cookieIndex = sceneIndex % cookies.length;
  return { cookie: cookies[cookieIndex], cookieIndex };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      prompt, 
      negativePrompt,
      numberOfImages = 1,
      aspectRatio = "LANDSCAPE",
      seed,
      model = "IMAGEN_3_5",
      userId: bodyUserId,
      sceneIndex = 0 // Index for deterministic cookie distribution
    } = await req.json();

    if (!prompt?.trim()) {
      return new Response(
        JSON.stringify({ error: "Prompt é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract userId from JWT or body
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
        console.log('[ImageFX] Could not extract user from token');
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's ImageFX cookies (now returns array)
    const cookieList = await getUserImageFXCookies(userId);
    
    if (!cookieList || cookieList.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Cookies do ImageFX não configurados ou inválidos. Configure em Configurações > ImageFX." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Select cookie based on scene index for ordered distribution
    const { cookie: selectedCookie, cookieIndex } = getCookieForScene(sceneIndex, cookieList);
    console.log(`[ImageFX] Scene ${sceneIndex} -> Cookie ${cookieIndex + 1}/${cookieList.length}`);

    // Map aspect ratio
    let aspectRatioValue: string = AspectRatio.LANDSCAPE;
    if (aspectRatio === "SQUARE" || aspectRatio === "1:1") {
      aspectRatioValue = AspectRatio.SQUARE;
    } else if (aspectRatio === "PORTRAIT" || aspectRatio === "9:16") {
      aspectRatioValue = AspectRatio.PORTRAIT;
    } else if (aspectRatio === "LANDSCAPE" || aspectRatio === "16:9") {
      aspectRatioValue = AspectRatio.LANDSCAPE;
    }

    // Generate images using selected cookie
    const images = await generateWithImageFX(selectedCookie, userId, {
      prompt,
      negativePrompt,
      numberOfImages: Math.min(numberOfImages, 4), // Max 4 images
      aspectRatio: aspectRatioValue,
      seed,
      model
    });

    console.log(`[ImageFX] Returning ${images.length} image(s) from cookie ${cookieIndex + 1}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        images,
        count: images.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('[ImageFX] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro inesperado ao gerar imagem" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});