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
  
  const payload: any = {
    userInput: {
      candidatesCount: options.numberOfImages || 1,
      prompts: [options.prompt],
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

  if (options.negativePrompt?.trim()) {
    payload.userInput.negativePrompts = [options.negativePrompt.trim()];
  }

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
  retries = 2
): Promise<any[]> {
  const headers = await getAuthHeaders(cookie, userId);
  const payload = buildPromptPayload(options);

  console.log('[ImageFX] Generating image with prompt:', options.prompt.substring(0, 100) + '...');
  console.log('[ImageFX] Aspect ratio:', options.aspectRatio);
  console.log('[ImageFX] Model:', options.model || 'IMAGEN_3_5');

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
      model: img.modelNameType || options.model || 'IMAGEN_3_5'
    }));

  } catch (err) {
    if (retries > 0 && !(err as Error).message.includes('autenticação')) {
      console.warn(`[ImageFX] Failed, retrying... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return generateWithImageFX(cookie, userId, options, retries - 1);
    }
    throw err;
  }
}

// Get user's ImageFX cookies from settings
async function getUserImageFXCookies(userId: string): Promise<string | null> {
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

    return (data as any).imagefx_cookies || null;
  } catch (e) {
    console.error('[ImageFX] Error fetching user cookies:', e);
    return null;
  }
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
      userId: bodyUserId 
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

    // Get user's ImageFX cookies
    const cookies = await getUserImageFXCookies(userId);
    
    if (!cookies) {
      return new Response(
        JSON.stringify({ 
          error: "Cookies do ImageFX não configurados ou inválidos. Configure em Configurações > ImageFX." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map aspect ratio
    let aspectRatioValue: string = AspectRatio.LANDSCAPE;
    if (aspectRatio === "SQUARE" || aspectRatio === "1:1") {
      aspectRatioValue = AspectRatio.SQUARE;
    } else if (aspectRatio === "PORTRAIT" || aspectRatio === "9:16") {
      aspectRatioValue = AspectRatio.PORTRAIT;
    } else if (aspectRatio === "LANDSCAPE" || aspectRatio === "16:9") {
      aspectRatioValue = AspectRatio.LANDSCAPE;
    }

    // Generate images
    const images = await generateWithImageFX(cookies, userId, {
      prompt,
      negativePrompt,
      numberOfImages: Math.min(numberOfImages, 4), // Max 4 images
      aspectRatio: aspectRatioValue,
      seed,
      model
    });

    console.log(`[ImageFX] Returning ${images.length} image(s)`);

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