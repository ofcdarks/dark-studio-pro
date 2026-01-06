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

// Modelos disponíveis na Laozhang API para vídeo
// Sora 2:
//   - sora_video2: 704×1280 (vertical) 10s - $0.15
//   - sora_video2-landscape: 1280×704 (horizontal) 10s - $0.15
//   - sora_video2-15s: 704×1280 (vertical) 15s - $0.15
//   - sora_video2-landscape-15s: 1280×704 (horizontal) 15s - $0.15
// Veo 3.1:
//   - veo-3.1: Standard - $0.25
//   - veo-3.1-fast: Fast - $0.15
//   - veo-3.1-landscape: Landscape - $0.25
//   - veo-3.1-landscape-fast: Landscape Fast - $0.15

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

    // Buscar chave da Laozhang API do admin_settings (formato: api_keys.laozhang)
    const { data: adminSettings } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'api_keys')
      .maybeSingle();

    const apiKeysValue = adminSettings?.value as Record<string, string> | null;
    const laozhangApiKey = apiKeysValue?.laozhang || Deno.env.get('LAOZHANG_API_KEY');

    if (!laozhangApiKey) {
      console.error('[Video Generation] Laozhang API key not found in admin_settings or env');
      return new Response(JSON.stringify({ error: 'API Laozhang não configurada' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mapear modelo para nome correto da API Laozhang
    let modelName = '';
    
    if (model === 'sora2') {
      // Sora 2 - 10 segundos
      modelName = aspect_ratio === '9:16' ? 'sora_video2' : 'sora_video2-landscape';
    } else if (model === 'sora2-15s') {
      // Sora 2 - 15 segundos
      modelName = aspect_ratio === '9:16' ? 'sora_video2-15s' : 'sora_video2-landscape-15s';
    } else if (model === 'veo31') {
      // Veo 3.1 Standard
      modelName = aspect_ratio === '9:16' ? 'veo-3.1' : 'veo-3.1-landscape';
    } else if (model === 'veo31-fast') {
      // Veo 3.1 Fast
      modelName = aspect_ratio === '9:16' ? 'veo-3.1-fast' : 'veo-3.1-landscape-fast';
    } else {
      // Default to Sora 2 landscape
      modelName = 'sora_video2-landscape';
    }

    console.log(`[Video Generation] Model: ${modelName}, Aspect: ${aspect_ratio}`);
    console.log(`[Video Generation] Prompt: ${prompt.substring(0, 100)}...`);

    // Construir o corpo da requisição conforme documentação
    // Usa formato OpenAI Chat Completions
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
      stream: true, // Streaming para obter progresso
    };

    // Chamar a API Laozhang
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

      if (laozhangResponse.status === 503) {
        return new Response(JSON.stringify({ 
          error: 'Modelo temporariamente indisponível. Tente outro modelo ou aguarde.' 
        }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Parse error details
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.error?.message || errorText;
      } catch {
        // Keep original text
      }

      return new Response(JSON.stringify({ 
        error: 'Erro ao gerar vídeo.',
        details: errorDetails
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Processar resposta de streaming
    // Para vídeos, a API retorna chunks SSE com o progresso e URL final
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
        
        // Procurar por URLs de vídeo no streaming
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const jsonStr = line.slice(6);
              if (jsonStr.trim()) {
                const data = JSON.parse(jsonStr);
                const content = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content;
                
                if (content) {
                  // Procurar URL de vídeo
                  const urlMatch = content.match(/https?:\/\/[^\s"']+\.(mp4|webm|mov)/i);
                  if (urlMatch) {
                    videoUrl = urlMatch[0];
                  }
                  // Também verificar se é uma URL direta
                  if (content.startsWith('http') && (content.includes('.mp4') || content.includes('video'))) {
                    videoUrl = content.trim().split(/[\s"']/)[0];
                  }
                }
              }
            } catch {
              // Continue processing
            }
          }
        }
      }
    }

    console.log('[Video Generation] Full response length:', fullContent.length);
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

    // Se não encontrou URL direta, verificar se há link no conteúdo
    const urlPattern = /https?:\/\/[^\s"'<>]+/g;
    const urls = fullContent.match(urlPattern);
    const videoUrlFromContent = urls?.find(url => 
      url.includes('video') || 
      url.includes('.mp4') || 
      url.includes('.webm') ||
      url.includes('sora') ||
      url.includes('veo')
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

    // Se ainda não tiver URL, retornar status de processamento
    return new Response(JSON.stringify({
      success: true,
      status: 'processing',
      message: 'Vídeo em processamento. Pode levar alguns minutos.',
      raw_response: fullContent.substring(0, 500),
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
