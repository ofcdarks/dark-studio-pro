import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Fetch YouTube page and extract caption tracks
async function fetchYouTubeTranscript(videoId: string): Promise<{ transcription: string; language: string }> {
  console.log("Fetching YouTube page for video:", videoId);
  
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube page: ${response.status}`);
  }
  
  const html = await response.text();
  
  // Extract captions data from ytInitialPlayerResponse
  const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
  if (!playerResponseMatch) {
    throw new Error("Could not find player response in YouTube page");
  }
  
  let playerResponse;
  try {
    playerResponse = JSON.parse(playerResponseMatch[1]);
  } catch (e) {
    throw new Error("Failed to parse player response JSON");
  }
  
  const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  
  if (!captions || captions.length === 0) {
    throw new Error("No captions available for this video. The video might not have subtitles enabled.");
  }
  
  console.log("Found caption tracks:", captions.length);
  
  // Prefer Portuguese, then English, then first available
  let selectedCaption = captions.find((c: any) => c.languageCode === 'pt' || c.languageCode === 'pt-BR');
  if (!selectedCaption) {
    selectedCaption = captions.find((c: any) => c.languageCode === 'en');
  }
  if (!selectedCaption) {
    selectedCaption = captions[0];
  }
  
  console.log("Selected caption language:", selectedCaption.languageCode);
  
  // Fetch the caption content
  const captionUrl = selectedCaption.baseUrl;
  const captionResponse = await fetch(captionUrl);
  
  if (!captionResponse.ok) {
    throw new Error(`Failed to fetch captions: ${captionResponse.status}`);
  }
  
  const captionXml = await captionResponse.text();
  
  // Parse XML to extract text
  const textMatches = captionXml.matchAll(/<text[^>]*>([^<]*)<\/text>/g);
  const texts: string[] = [];
  
  for (const match of textMatches) {
    // Decode HTML entities
    let text = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/\n/g, ' ')
      .trim();
    
    if (text) {
      texts.push(text);
    }
  }
  
  const transcription = texts.join(' ');
  console.log("Transcription extracted, length:", transcription.length);
  
  return {
    transcription,
    language: selectedCaption.languageCode
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      throw new Error("Video URL is required");
    }

    console.log("Processing video URL:", videoUrl);
    
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error("Invalid YouTube URL. Could not extract video ID.");
    }
    
    console.log("Extracted video ID:", videoId);

    const { transcription, language } = await fetchYouTubeTranscript(videoId);

    return new Response(
      JSON.stringify({
        transcription,
        language,
        videoId,
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
