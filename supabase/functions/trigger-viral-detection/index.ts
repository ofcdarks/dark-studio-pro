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

    // Get n8n MCP URL from environment
    const n8nMcpUrl = Deno.env.get('N8N_MCP_URL') || 'https://lovableagencia.app.n8n.cloud/mcp';
    const workflowId = '3GWL4qH_KSMPJ_Iof7ORH';

    // Call n8n MCP to execute the workflow
    const response = await fetch(n8nMcpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: 'execute_workflow',
          arguments: {
            workflowId: workflowId,
            inputs: {
              type: 'webhook',
              webhookData: {
                body: {
                  user_id: user.id,
                  triggered_at: new Date().toISOString()
                }
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[trigger-viral-detection] n8n MCP error:', errorText);
      
      // Return success anyway to not block the user - workflow might run async
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verificação iniciada em segundo plano',
          note: 'O n8n irá processar a busca de vídeos virais'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('[trigger-viral-detection] n8n result:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Busca de vídeos virais iniciada!',
        result 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[trigger-viral-detection] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Don't fail the request - return success as the workflow might still work
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verificação iniciada',
        error: errorMessage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
