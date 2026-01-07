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
    const { title, category, articleId, style } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Título é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating cover for:", title);

    let styleDesc = "cinematic dramatic lighting";
    if (style === "minimalist") styleDesc = "minimalist with negative space";
    else if (style === "colorful") styleDesc = "vibrant bold colors";
    else if (style === "tech") styleDesc = "futuristic technology";
    else if (style === "neon") styleDesc = "neon cyberpunk style";

    const imagePrompt = `Professional blog cover 16:9 about "${title}". ${styleDesc}. Category: ${category || "YouTube"}. No text. Ultra detailed.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("Nenhuma imagem gerada");
    }

    // If articleId provided, upload to storage
    if (articleId) {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileName = `blog-covers/${articleId}-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(fileName, imageBuffer, { contentType: "image/png", upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return new Response(
          JSON.stringify({ success: true, image_url: imageUrl, uploaded: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(fileName);
      
      await supabase.from("blog_articles").update({ image_url: urlData.publicUrl }).eq("id", articleId);

      return new Response(
        JSON.stringify({ success: true, image_url: urlData.publicUrl, uploaded: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, image_url: imageUrl, uploaded: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
