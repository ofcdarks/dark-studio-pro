import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { webhook_url, google_email, google_password, browserless_token } = await req.json();

    if (!webhook_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'webhook_url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Test n8n] Testing webhook:', webhook_url);

    const testPayload = {
      prompt: 'Test video generation from admin panel - a beautiful sunset over the ocean',
      model: 'veo3',
      aspect_ratio: '16:9',
      duration: 8,
      job_id: `test-${Date.now()}`,
      callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/n8n-video-callback`,
      test: true,
      // Pass credentials for the n8n workflow
      google_email: google_email || '',
      google_password: google_password || '',
      browserless_token: browserless_token || ''
    };

    console.log('[Test n8n] Sending test payload...');

    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const status = response.status;
    const responseText = await response.text();

    console.log('[Test n8n] Response status:', status);
    console.log('[Test n8n] Response:', responseText.substring(0, 500));

    let parsedResponse = null;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      // Not JSON
    }

    if (response.ok) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          status,
          data: parsedResponse || responseText.substring(0, 200)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          status,
          error: parsedResponse?.message || responseText.substring(0, 200)
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[Test n8n] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
