import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Credit pricing according to documentation
const CREDIT_PRICING = {
  THUMBNAIL_GENERATION: { base: 8, gemini: 10, claude: 12 },
};

interface ThumbnailRequest {
  videoTitle: string;
  niche?: string;
  subNiche?: string;
  style?: string;
  includeHeadline?: boolean;
  referenceThumbnailUrl?: string;
  language?: string;
}

interface ThumbnailVariation {
  variationNumber: number;
  imageBase64: string;
  headline: string | null;
  seoDescription: string;
  seoTags: string;
  prompt: string;
  style: string;
}

const VARIATION_STYLES = [
  { name: "Close-up emocional", description: "Extreme close-up of a person showing intense emotion (surprise, shock, excitement), dramatic lighting, cinematic feel" },
  { name: "Cena de ação", description: "Dynamic action scene with movement, energy, dramatic composition, vibrant colors" },
  { name: "Mistério/Suspense", description: "Dark and mysterious atmosphere, shadows, silhouettes, intriguing elements, moody lighting" },
  { name: "Impacto visual", description: "Bold visual impact with contrasting colors, eye-catching elements, professional composition" },
];

async function generateHeadlines(title: string, niche: string, language: string, apiKey: string): Promise<string[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Você é um especialista em criar headlines impactantes para thumbnails do YouTube. 
Gere headlines curtas (máximo 4 palavras), impactantes e que geram curiosidade.
Responda APENAS com um JSON array de 3 strings, sem explicações.`
        },
        {
          role: "user",
          content: `Título do vídeo: "${title}"
Nicho: ${niche || "Geral"}
Idioma: ${language}

Gere 3 headlines curtas e impactantes para thumbnails.
Formato: ["HEADLINE1", "HEADLINE2", "HEADLINE3"]`
        }
      ],
    }),
  });

  if (!response.ok) {
    console.error("Error generating headlines:", await response.text());
    return ["INCRÍVEL!", "VOCÊ PRECISA VER", "CHOCANTE!"];
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Error parsing headlines:", e);
  }
  
  return ["INCRÍVEL!", "VOCÊ PRECISA VER", "CHOCANTE!"];
}

async function generateSEOContent(title: string, niche: string, variation: string, language: string, apiKey: string): Promise<{ description: string; tags: string }> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Você é um especialista em SEO para YouTube. Gere descrições e tags otimizadas.
Responda APENAS com JSON no formato: {"description": "texto 400-500 chars", "tags": "tag1, tag2, tag3..."}`
        },
        {
          role: "user",
          content: `Título: "${title}"
Nicho: ${niche || "Geral"}
Estilo visual: ${variation}
Idioma: ${language}

Gere descrição SEO (400-500 caracteres) e tags separadas por vírgula.`
        }
      ],
    }),
  });

  if (!response.ok) {
    console.error("Error generating SEO:", await response.text());
    return {
      description: `Vídeo sobre ${title}. Conteúdo de qualidade no nicho ${niche || "geral"}.`,
      tags: `${niche}, youtube, viral, conteúdo`
    };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Error parsing SEO content:", e);
  }
  
  return {
    description: `Vídeo incrível sobre ${title}. Não perca esse conteúdo exclusivo!`,
    tags: `${niche}, youtube, viral`
  };
}

async function generateImage(prompt: string, apiKey: string): Promise<string | null> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [
        { role: "user", content: prompt }
      ],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Image generation error:", response.status, errorText);
    return null;
  }

  const data = await response.json();
  const images = data.choices?.[0]?.message?.images;
  
  if (images && images.length > 0) {
    return images[0].image_url?.url || null;
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const body: ThumbnailRequest = await req.json();
    const { 
      videoTitle, 
      niche = "Geral", 
      subNiche, 
      style = "photorealistic",
      includeHeadline = true,
      referenceThumbnailUrl,
      language = "Português"
    } = body;

    if (!videoTitle) {
      throw new Error("videoTitle is required");
    }

    console.log("Generating thumbnails for:", videoTitle);

    // Generate headlines if needed
    let headlines: string[] = [];
    if (includeHeadline) {
      headlines = await generateHeadlines(videoTitle, niche, language, LOVABLE_API_KEY);
      console.log("Generated headlines:", headlines);
    }

    // Generate 4 thumbnail variations
    const variations: ThumbnailVariation[] = [];
    
    for (let i = 0; i < 4; i++) {
      const variationStyle = VARIATION_STYLES[i];
      const headline = includeHeadline ? headlines[i % headlines.length] : null;
      
      // Build the image generation prompt
      let imagePrompt = `Create a YouTube thumbnail image (16:9 aspect ratio, 1280x720 resolution). 
Style: ${style}, ${variationStyle.description}
Topic: ${videoTitle}
Niche: ${niche}${subNiche ? `, Sub-niche: ${subNiche}` : ""}
${headline ? `The image should convey the message: "${headline}"` : ""}
${referenceThumbnailUrl ? `Reference style from: ${referenceThumbnailUrl}` : ""}

Requirements:
- High contrast and vibrant colors
- Professional YouTube thumbnail quality
- Eye-catching composition
- Clear focal point
- ${style} style
- DO NOT include any text in the image`;

      console.log(`Generating variation ${i + 1} with style: ${variationStyle.name}`);
      
      const imageBase64 = await generateImage(imagePrompt, LOVABLE_API_KEY);
      
      if (!imageBase64) {
        console.error(`Failed to generate variation ${i + 1}`);
        continue;
      }

      // Generate SEO content for this variation
      const seoContent = await generateSEOContent(videoTitle, niche, variationStyle.name, language, LOVABLE_API_KEY);

      variations.push({
        variationNumber: i + 1,
        imageBase64,
        headline,
        seoDescription: seoContent.description,
        seoTags: seoContent.tags,
        prompt: imagePrompt,
        style: variationStyle.name
      });

      console.log(`Variation ${i + 1} generated successfully`);
    }

    // Debit credits if user is authenticated
    if (userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const creditsUsed = CREDIT_PRICING.THUMBNAIL_GENERATION.gemini * variations.length;
      
      // Get current balance and update
      const { data: currentCredits } = await supabaseAdmin
        .from('user_credits')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (currentCredits) {
        await supabaseAdmin
          .from('user_credits')
          .update({ balance: currentCredits.balance - creditsUsed })
          .eq('user_id', userId);
      }

      // Log usage
      await supabaseAdmin.from('credit_usage').insert({
        user_id: userId,
        operation_type: 'thumbnail_generation',
        credits_used: creditsUsed,
        model_used: 'gemini-2.5-flash-image',
        details: { variations_count: variations.length, video_title: videoTitle }
      });
    }

    console.log(`Generated ${variations.length} thumbnail variations`);

    return new Response(
      JSON.stringify({
        success: true,
        variations,
        headlines,
        videoTitle,
        niche,
        subNiche
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in generate-thumbnail:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
