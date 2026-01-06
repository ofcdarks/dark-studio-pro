import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VideoRequest {
  prompt: string;
  model: "vo3" | "sora2";
  aspect_ratio: "16:9" | "9:16" | "1:1";
  resolution: "720p" | "1080p";
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

    const { prompt, model, aspect_ratio, resolution } = await req.json() as VideoRequest;

    if (!prompt || !model) {
      return new Response(JSON.stringify({ error: 'Prompt e modelo são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar chave da Laozhang API
    const { data: adminSettings } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'laozhang_api_key')
      .maybeSingle();

    const laozhangApiKey = adminSettings?.value?.api_key || Deno.env.get('LAOZHANG_API_KEY');

    if (!laozhangApiKey) {
      return new Response(JSON.stringify({ error: 'API Laozhang não configurada' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mapear modelo para o endpoint correto da Laozhang
    const modelEndpoint = model === 'vo3' 
      ? 'video/generations' 
      : 'video/generations';

    // Mapear resolução
    const resolutionMap: Record<string, { width: number; height: number }> = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
    };

    const { width, height } = resolutionMap[resolution] || resolutionMap['1080p'];

    // Ajustar dimensões baseado no aspect ratio
    let finalWidth = width;
    let finalHeight = height;
    
    if (aspect_ratio === '9:16') {
      finalWidth = resolution === '1080p' ? 1080 : 720;
      finalHeight = resolution === '1080p' ? 1920 : 1280;
    } else if (aspect_ratio === '1:1') {
      finalWidth = resolution === '1080p' ? 1080 : 720;
      finalHeight = resolution === '1080p' ? 1080 : 720;
    }

    console.log(`[Video Generation] Model: ${model}, Resolution: ${resolution}, Aspect: ${aspect_ratio}`);
    console.log(`[Video Generation] Dimensions: ${finalWidth}x${finalHeight}`);
    console.log(`[Video Generation] Prompt: ${prompt.substring(0, 100)}...`);

    // Chamar a API Laozhang para geração de vídeo
    const laozhangResponse = await fetch('https://api.laozhang.ai/v1/video/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${laozhangApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model === 'vo3' ? 'veo3' : 'sora-2',
        prompt: prompt,
        size: `${finalWidth}x${finalHeight}`,
        duration: 5, // duração padrão em segundos
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

      return new Response(JSON.stringify({ 
        error: 'Erro ao gerar vídeo. Tente novamente.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseData = await laozhangResponse.json();
    console.log('[Video Generation] Response:', JSON.stringify(responseData).substring(0, 200));

    // A resposta pode conter um task_id para polling ou o vídeo diretamente
    if (responseData.task_id) {
      return new Response(JSON.stringify({
        success: true,
        status: 'processing',
        task_id: responseData.task_id,
        message: 'Vídeo está sendo gerado. Use o task_id para verificar o status.',
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se tiver o vídeo diretamente
    const videoUrl = responseData.data?.[0]?.url || responseData.video_url || responseData.url;

    if (videoUrl) {
      return new Response(JSON.stringify({
        success: true,
        status: 'completed',
        video_url: videoUrl,
        model: model,
        resolution: resolution,
        aspect_ratio: aspect_ratio,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      status: 'processing',
      data: responseData,
      message: 'Vídeo em processamento.',
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
