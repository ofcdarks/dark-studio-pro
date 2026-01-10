import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VideoRequest {
  prompt: string;
  model: "sora2" | "sora2-15s" | "veo31" | "veo31-fast";
  aspect_ratio: "16:9" | "9:16" | "1:1";
  resolution: "720p" | "1080p";
}

// Veo3 API endpoint (similar ao ImageFX)
const VEO3_API_URL = "https://aisandbox-pa.googleapis.com/v1:runInference";

async function generateWithVeo3Cookies(
  prompt: string,
  cookies: string[],
  aspectRatio: string
): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
  const validCookies = cookies.filter(c => c && c.trim().length > 0);
  
  if (validCookies.length === 0) {
    return { success: false, error: "Nenhum cookie Veo3 configurado" };
  }

  // Tentar cada cookie em sequência
  for (let i = 0; i < validCookies.length; i++) {
    const cookie = validCookies[i];
    console.log(`[Veo3] Tentando cookie ${i + 1}/${validCookies.length}`);
    
    try {
      // Mapear aspect ratio para dimensões
      let width = 1280;
      let height = 720;
      
      if (aspectRatio === "9:16") {
        width = 720;
        height = 1280;
      } else if (aspectRatio === "1:1") {
        width = 720;
        height = 720;
      }

      // Request body para Veo3 (formato similar ao ImageFX)
      const requestBody = {
        input: {
          text: {
            text: prompt
          }
        },
        model: "models/veo-3.0-generate-preview",
        config: {
          generateVideoRequest: {
            aspectRatio: aspectRatio,
            durationSeconds: 8,
            numberOfVideos: 1,
            personGeneration: "dont_allow"
          }
        }
      };

      const response = await fetch(VEO3_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": cookie,
          "Origin": "https://aisandbox.google.com",
          "Referer": "https://aisandbox.google.com/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "X-Goog-Api-Key": "AIzaSyAbmLjPpdJdPXxGBdMITWNJ0ORMFBG4pFY"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Veo3] Cookie ${i + 1} falhou:`, response.status, errorText.substring(0, 200));
        
        // Se for rate limit ou auth error, tentar próximo cookie
        if (response.status === 401 || response.status === 403 || response.status === 429) {
          continue;
        }
        
        // Para outros erros, retornar
        return { success: false, error: `Erro Veo3: ${response.status}` };
      }

      const data = await response.json();
      console.log("[Veo3] Response:", JSON.stringify(data).substring(0, 500));

      // Extrair URL do vídeo da resposta
      // A estrutura pode variar, verificar diferentes paths
      const videoUrl = 
        data?.output?.video?.uri ||
        data?.output?.videoUri ||
        data?.videos?.[0]?.uri ||
        data?.generatedVideos?.[0]?.video?.uri ||
        data?.result?.video?.uri;

      if (videoUrl) {
        console.log("[Veo3] Video URL encontrada:", videoUrl);
        return { success: true, videoUrl };
      }

      // Verificar se está em processamento
      if (data?.status === "PROCESSING" || data?.operationName) {
        console.log("[Veo3] Vídeo em processamento");
        return { 
          success: true, 
          videoUrl: undefined,
          error: "processing"
        };
      }

      console.log("[Veo3] Nenhuma URL encontrada na resposta");
      continue;

    } catch (error) {
      console.error(`[Veo3] Erro com cookie ${i + 1}:`, error);
      continue;
    }
  }

  return { success: false, error: "Todos os cookies Veo3 falharam" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, model, aspect_ratio } = await req.json() as VideoRequest;

    if (!prompt || !model) {
      return new Response(JSON.stringify({ error: 'Prompt e modelo são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Video Generation] Model: ${model}, Aspect: ${aspect_ratio}`);
    console.log(`[Video Generation] Prompt: ${prompt.substring(0, 100)}...`);

    // Para modelos Veo3, usar cookies do admin_settings
    if (model === 'veo31' || model === 'veo31-fast') {
      // Buscar cookies Veo3 do admin_settings
      const { data: veo3Settings } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'global_veo3_cookies')
        .maybeSingle();

      const cookiesValue = veo3Settings?.value as Record<string, string> | null;
      const cookies = [
        cookiesValue?.cookie1 || '',
        cookiesValue?.cookie2 || '',
        cookiesValue?.cookie3 || ''
      ].filter(c => c.trim().length > 0);

      if (cookies.length === 0) {
        console.error('[Video Generation] Nenhum cookie Veo3 configurado');
        return new Response(JSON.stringify({ 
          error: 'Cookies Veo3 não configurados. Configure no Painel Admin → APIs.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[Video Generation] Usando ${cookies.length} cookie(s) Veo3`);

      const result = await generateWithVeo3Cookies(prompt, cookies, aspect_ratio);

      if (!result.success) {
        return new Response(JSON.stringify({ 
          error: result.error || 'Erro ao gerar vídeo com Veo3' 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (result.error === "processing") {
        return new Response(JSON.stringify({
          success: true,
          status: 'processing',
          message: 'Vídeo em processamento. Pode levar alguns minutos.',
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        status: 'completed',
        video_url: result.videoUrl,
        model: model,
        aspect_ratio: aspect_ratio,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Para Sora e outros modelos, usar Laozhang API
    const { data: adminSettings } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'api_keys')
      .maybeSingle();

    const apiKeysValue = adminSettings?.value as Record<string, string> | null;
    const laozhangApiKey = apiKeysValue?.laozhang || Deno.env.get('LAOZHANG_API_KEY');

    if (!laozhangApiKey) {
      console.error('[Video Generation] Laozhang API key not found');
      return new Response(JSON.stringify({ error: 'API Laozhang não configurada' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mapear modelo para nome da API Laozhang
    let modelName = '';
    
    if (model === 'sora2') {
      modelName = aspect_ratio === '9:16' ? 'sora_video2' : 'sora_video2-landscape';
    } else if (model === 'sora2-15s') {
      modelName = aspect_ratio === '9:16' ? 'sora_video2-15s' : 'sora_video2-landscape-15s';
    } else {
      modelName = 'sora_video2-landscape';
    }

    console.log(`[Video Generation] Using Laozhang model: ${modelName}`);

    const requestBody = {
      model: modelName,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            }
          ]
        }
      ],
      stream: true,
    };

    const laozhangResponse = await fetch('https://api.laozhang.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${laozhangApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!laozhangResponse.ok) {
      const errorText = await laozhangResponse.text();
      console.error('[Video Generation] Laozhang API error:', laozhangResponse.status, errorText);
      
      if (laozhangResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit atingido. Tente novamente em alguns minutos.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        error: 'Erro ao gerar vídeo.',
        details: errorText.substring(0, 200)
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Processar resposta streaming
    const reader = laozhangResponse.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let videoUrl = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const jsonStr = line.slice(6);
              if (jsonStr.trim()) {
                const data = JSON.parse(jsonStr);
                const content = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content;
                
                if (content) {
                  const urlMatch = content.match(/https?:\/\/[^\s"']+\.(mp4|webm|mov)/i);
                  if (urlMatch) {
                    videoUrl = urlMatch[0];
                  }
                  if (content.startsWith('http') && (content.includes('.mp4') || content.includes('video'))) {
                    videoUrl = content.trim().split(/[\s"']/)[0];
                  }
                }
              }
            } catch {
              // Continue
            }
          }
        }
      }
    }

    console.log('[Video Generation] Extracted video URL:', videoUrl);

    if (videoUrl) {
      return new Response(JSON.stringify({
        success: true,
        status: 'completed',
        video_url: videoUrl,
        model: modelName,
        aspect_ratio: aspect_ratio,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Procurar URL no conteúdo
    const urlPattern = /https?:\/\/[^\s"'<>]+/g;
    const urls = fullContent.match(urlPattern);
    const videoUrlFromContent = urls?.find(url => 
      url.includes('video') || 
      url.includes('.mp4') || 
      url.includes('.webm')
    );

    if (videoUrlFromContent) {
      return new Response(JSON.stringify({
        success: true,
        status: 'completed',
        video_url: videoUrlFromContent,
        model: modelName,
        aspect_ratio: aspect_ratio,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      status: 'processing',
      message: 'Vídeo em processamento. Pode levar alguns minutos.',
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('[Video Generation] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
