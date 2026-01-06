import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VideoRequest {
  prompt: string;
  model: "sora2" | "sora2-landscape" | "kling";
  aspect_ratio: "16:9" | "9:16" | "1:1";
  resolution: "720p" | "1080p";
}

// Modelos disponíveis na Laozhang API para vídeo
// sora_video2: 704×1280 (vertical)
// sora_video2-landscape: 1280×704 (horizontal)
// kling-video: API Kling para vídeo

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

    const { prompt, model, aspect_ratio, resolution } = await req.json() as VideoRequest;

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
    // Sora 2: sora_video2 (vertical 704x1280), sora_video2-landscape (horizontal 1280x704)
    let modelName = 'sora_video2-landscape'; // default horizontal
    
    if (model === 'sora2') {
      // Baseado no aspect_ratio escolhido
      if (aspect_ratio === '9:16') {
        modelName = 'sora_video2'; // Vertical
      } else {
        modelName = 'sora_video2-landscape'; // Horizontal (16:9 ou 1:1)
      }
    } else if (model === 'sora2-landscape') {
      modelName = 'sora_video2-landscape';
    } else if (model === 'kling') {
      modelName = 'kling-video';
    }

    console.log(`[Video Generation] Model: ${modelName}, Aspect: ${aspect_ratio}, Resolution: ${resolution}`);
    console.log(`[Video Generation] Prompt: ${prompt.substring(0, 100)}...`);

    // Chamar a API Laozhang usando o endpoint de chat completions (formato OpenAI)
    const laozhangResponse = await fetch('https://api.laozhang.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${laozhangApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        stream: false,
      }),
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

      return new Response(JSON.stringify({ 
        error: 'Erro ao gerar vídeo. Tente novamente.',
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseData = await laozhangResponse.json();
    console.log('[Video Generation] Response:', JSON.stringify(responseData).substring(0, 500));

    // Extrair URL do vídeo da resposta
    // O formato pode variar: pode estar em choices[0].message.content ou em um campo video_url
    const content = responseData.choices?.[0]?.message?.content;
    
    // Verificar se é uma URL de vídeo
    let videoUrl = null;
    
    if (typeof content === 'string') {
      // Tentar extrair URL de vídeo do conteúdo
      const urlMatch = content.match(/https?:\/\/[^\s]+\.(mp4|webm|mov)/i);
      if (urlMatch) {
        videoUrl = urlMatch[0];
      } else if (content.startsWith('http')) {
        videoUrl = content.trim();
      }
    }

    // Verificar campos alternativos de resposta
    if (!videoUrl) {
      videoUrl = responseData.video_url || 
                 responseData.data?.[0]?.url || 
                 responseData.url ||
                 responseData.choices?.[0]?.message?.video_url;
    }

    if (videoUrl) {
      return new Response(JSON.stringify({
        success: true,
        status: 'completed',
        video_url: videoUrl,
        model: modelName,
        resolution: resolution,
        aspect_ratio: aspect_ratio,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se não tiver URL direta, pode ser um processo assíncrono
    const taskId = responseData.id || responseData.task_id;
    
    if (taskId) {
      return new Response(JSON.stringify({
        success: true,
        status: 'processing',
        task_id: taskId,
        message: 'Vídeo está sendo gerado. Pode levar alguns minutos.',
        response: content,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Retornar a resposta completa para debugging
    return new Response(JSON.stringify({
      success: true,
      status: 'processing',
      message: 'Vídeo em processamento.',
      response: content || responseData,
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
