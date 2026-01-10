import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

/**
 * n8n Video Callback Endpoint
 * 
 * Este endpoint é chamado pelo n8n quando a geração do vídeo é concluída.
 * O n8n deve enviar um POST com:
 * - job_id: ID do job no banco de dados
 * - status: 'completed' | 'failed'
 * - video_url: URL do vídeo gerado (se sucesso)
 * - error: Mensagem de erro (se falhou)
 */

interface CallbackPayload {
  job_id?: string;
  task_id?: string;
  status: "completed" | "failed" | "processing";
  video_url?: string;
  videoUrl?: string;
  error?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`[n8n-callback] Request received: ${req.method}`);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Usar service role para atualizar jobs de qualquer usuário
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar webhook secret (opcional, mas recomendado)
    const webhookSecret = req.headers.get("x-webhook-secret");
    const { data: secretSetting } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "n8n_webhook_secret")
      .maybeSingle();

    const configuredSecret = (secretSetting?.value as Record<string, string>)?.secret;
    
    if (configuredSecret && webhookSecret !== configuredSecret) {
      console.warn("[n8n-callback] Invalid webhook secret");
      return new Response(JSON.stringify({ error: "Invalid webhook secret" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse payload
    let payload: CallbackPayload;
    
    if (req.method === "GET") {
      // Suporte a GET para testes simples
      const url = new URL(req.url);
      payload = {
        job_id: url.searchParams.get("job_id") || undefined,
        task_id: url.searchParams.get("task_id") || undefined,
        status: (url.searchParams.get("status") as CallbackPayload["status"]) || "completed",
        video_url: url.searchParams.get("video_url") || undefined,
        error: url.searchParams.get("error") || undefined,
      };
    } else {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        payload = await req.json();
      } else {
        // Form data fallback
        const formData = await req.formData();
        payload = {
          job_id: formData.get("job_id") as string,
          task_id: formData.get("task_id") as string,
          status: (formData.get("status") as CallbackPayload["status"]) || "completed",
          video_url: formData.get("video_url") as string,
          error: formData.get("error") as string,
        };
      }
    }

    console.log("[n8n-callback] Payload:", JSON.stringify(payload));

    const jobId = payload.job_id || payload.task_id;
    
    if (!jobId) {
      return new Response(JSON.stringify({ 
        error: "job_id ou task_id é obrigatório" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar o job
    const { data: job, error: fetchError } = await supabase
      .from("video_generation_jobs")
      .select("*")
      .or(`id.eq.${jobId},n8n_task_id.eq.${jobId}`)
      .maybeSingle();

    if (fetchError || !job) {
      console.error("[n8n-callback] Job not found:", jobId, fetchError);
      return new Response(JSON.stringify({ 
        error: "Job não encontrado",
        job_id: jobId 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Preparar dados de atualização
    const videoUrl = payload.video_url || payload.videoUrl;
    const errorMessage = payload.error || payload.error_message;

    const updateData: Record<string, unknown> = {
      status: payload.status,
      webhook_response: payload,
      updated_at: new Date().toISOString(),
    };

    if (payload.status === "completed" && videoUrl) {
      updateData.video_url = videoUrl;
      updateData.completed_at = new Date().toISOString();
      console.log("[n8n-callback] Video completed:", videoUrl);
    }

    if (payload.status === "failed") {
      updateData.error_message = errorMessage || "Erro desconhecido";
      console.log("[n8n-callback] Video failed:", errorMessage);
    }

    // Atualizar job
    const { error: updateError } = await supabase
      .from("video_generation_jobs")
      .update(updateData)
      .eq("id", job.id);

    if (updateError) {
      console.error("[n8n-callback] Update error:", updateError);
      return new Response(JSON.stringify({ 
        error: "Erro ao atualizar job",
        details: updateError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[n8n-callback] Success in ${duration}ms - Job ${job.id} -> ${payload.status}`);

    return new Response(JSON.stringify({
      success: true,
      job_id: job.id,
      status: payload.status,
      video_url: videoUrl,
      processing_time_ms: duration,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[n8n-callback] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro interno" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
