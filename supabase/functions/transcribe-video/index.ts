import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      throw new Error("Video URL is required");
    }

    const DOWNSUB_API_KEY = Deno.env.get("DOWNSUB_API_KEY");

    if (!DOWNSUB_API_KEY) {
      throw new Error("DOWNSUB_API_KEY is not configured");
    }

    console.log("Fetching transcription for:", videoUrl);

    // Call DownSub API to get transcription
    const response = await fetch("https://api.downsub.com/v1/transcribe", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DOWNSUB_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: videoUrl,
        language: "auto",
        format: "text",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DownSub API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Chave de API inválida. Verifique a configuração." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`DownSub API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log("Transcription received, length:", data.transcription?.length || 0);

    return new Response(
      JSON.stringify({
        transcription: data.transcription || data.text || "",
        language: data.language || "unknown",
        duration: data.duration || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in transcribe-video:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
