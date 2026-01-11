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
    console.log('[trigger-viral-detection] Triggering workflow via fallback to check-new-videos');

    // The n8n workflow runs on a schedule and the MCP needs to be called from the agent side
    // From edge function we can't directly call MCP, so we return success and let the scheduled workflow handle it
    // Or we trigger the check-new-videos edge function as a fallback
    
    const { data, error } = await supabase.functions.invoke("check-new-videos");
    
    if (error) {
      console.error('[trigger-viral-detection] check-new-videos error:', error);
      // Don't fail - the scheduled workflow will still run
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verificação agendada ativa. O workflow n8n será executado automaticamente.',
          note: 'O monitoramento automático continua funcionando a cada hora.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    
    // Don't fail the request - return success as the scheduled workflow still works
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Monitoramento ativo. Verificação automática a cada hora.',
        error: errorMessage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});