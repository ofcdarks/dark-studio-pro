import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    console.log("Generating cover image for:", title, "with style:", style);

    // Style-specific prompt modifiers
    const stylePrompts: Record<string, string> = {
      cinematic: "Cinematic lighting with dramatic shadows, film-quality aesthetic, rich contrast, depth of field blur, professional movie poster feel.",
      minimalist: "Clean minimalist design with lots of negative space, simple geometric shapes, muted color palette, elegant and sophisticated.",
      colorful: "Vibrant and bold colors, playful gradients, energetic and dynamic composition, bright and cheerful mood.",
      tech: "Futuristic technology aesthetic, circuit patterns, holographic elements, blue and cyan tones, digital matrix feel, sci-fi inspired.",
      gradient: "Abstract flowing gradients, smooth color transitions, aurora-like effects, dreamy and ethereal atmosphere.",
      neon: "Neon lights and glowing effects, cyberpunk aesthetic, dark background with bright neon accents in pink, purple and cyan.",
      professional: "Corporate professional look, clean and structured, business-oriented, trustworthy blue and gray tones, subtle geometric patterns.",
      creative: "Artistic and expressive, painterly brushstrokes, mixed media collage feel, creative and unique visual elements.",
    };

    const selectedStyle = stylePrompts[style || "cinematic"] || stylePrompts.cinematic;

    // Create a detailed prompt for blog cover image
    const imagePrompt = `Professional blog cover image for an article about: "${title}". 
Category: ${category || "YouTube content creation"}.
Visual Style: ${selectedStyle}
Composition: 16:9 aspect ratio, suitable for blog hero image.
No text or words in the image. High quality, ultra detailed.`;

    // Generate image using Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: imagePrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image generated, response:", JSON.stringify(data));
      throw new Error("Nenhuma imagem foi gerada");
    }

    console.log("Image generated successfully");

    // If articleId is provided, upload to storage and update the article
    if (articleId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Convert base64 to blob
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

      const fileName = `blog-covers/${articleId}-${Date.now()}.png`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(fileName, imageBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        // Return the base64 image if upload fails
        return new Response(
          JSON.stringify({ success: true, image_url: imageUrl, uploaded: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update article with image URL
      const { error: updateError } = await supabase
        .from("blog_articles")
        .update({ image_url: publicUrl })
        .eq("id", articleId);

      if (updateError) {
        console.error("Update error:", updateError);
      }

      console.log("Image uploaded and article updated:", publicUrl);

      return new Response(
        JSON.stringify({ success: true, image_url: publicUrl, uploaded: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return base64 image if no articleId
    return new Response(
      JSON.stringify({ success: true, image_url: imageUrl, uploaded: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating blog cover:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
