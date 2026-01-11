import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const n8nWebhookUrl = Deno.env.get('N8N_VIRAL_WEBHOOK_URL');
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[trigger-viral-detection] User:', user.id);

    // Get user's viral monitoring config
    const { data: config } = await supabase
      .from('viral_monitoring_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get user's YouTube API key
    const { data: apiSettings } = await supabase
      .from('user_api_settings')
      .select('youtube_api_key')
      .eq('user_id', user.id)
      .single();

    // If n8n webhook is configured, call it directly
    if (n8nWebhookUrl) {
      console.log('[trigger-viral-detection] Calling n8n webhook:', n8nWebhookUrl);

      const payload = {
        user_id: user.id,
        niches: config?.niches || ['dark psychology', 'stoicism', 'self improvement'],
        viral_threshold: config?.viral_threshold || 1000,
        video_types: config?.video_types || ['long', 'short'],
        country: config?.country || 'US',
        youtube_api_key: apiSettings?.youtube_api_key || null,
        triggered_at: new Date().toISOString()
      };

      console.log('[trigger-viral-detection] Payload:', JSON.stringify(payload));

      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await n8nResponse.text();
      console.log(`[trigger-viral-detection] n8n response: ${n8nResponse.status} - ${responseText}`);

      if (!n8nResponse.ok) {
        console.error('[trigger-viral-detection] n8n webhook failed:', responseText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Falha ao chamar workflow n8n',
            details: responseText 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update last_checked in config
      if (config) {
        await supabase
          .from('viral_monitoring_config')
          .update({ last_checked: new Date().toISOString() })
          .eq('user_id', user.id);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Busca de vídeos virais iniciada!',
          n8n_response: responseText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: call check-new-videos edge function
    console.log('[trigger-viral-detection] No n8n webhook, falling back to check-new-videos');
    
    const { data, error } = await supabase.functions.invoke("check-new-videos");
    
    if (error) {
      console.error('[trigger-viral-detection] check-new-videos error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Falha na verificação',
          details: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verificação iniciada!',
        result: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[trigger-viral-detection] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
