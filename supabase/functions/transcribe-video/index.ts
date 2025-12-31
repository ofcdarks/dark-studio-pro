import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

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

// Fetch video details from YouTube Data API
async function fetchVideoDetailsFromYouTube(videoId: string, apiKey: string) {
  console.log("Fetching video details from YouTube API for:", videoId);
  
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("YouTube API error:", response.status, errorText);
    throw new Error(`YouTube API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error("Video not found");
  }
  
  const video = data.items[0];
  const snippet = video.snippet;
  const statistics = video.statistics;
  const contentDetails = video.contentDetails;
  
  // Parse duration (ISO 8601 format: PT1H2M3S)
  const durationMatch = contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  let durationSeconds = 0;
  if (durationMatch) {
    durationSeconds += parseInt(durationMatch[1] || '0') * 3600;
    durationSeconds += parseInt(durationMatch[2] || '0') * 60;
    durationSeconds += parseInt(durationMatch[3] || '0');
  }
  
  // Calculate days since published
  const publishedAt = new Date(snippet.publishedAt);
  const now = new Date();
  const daysAgo = Math.floor((now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    title: snippet.title,
    description: snippet.description,
    channelTitle: snippet.channelTitle,
    channelId: snippet.channelId,
    publishedAt: snippet.publishedAt,
    daysAgo,
    thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
    tags: snippet.tags || [],
    categoryId: snippet.categoryId,
    views: parseInt(statistics.viewCount || '0'),
    likes: parseInt(statistics.likeCount || '0'),
    comments: parseInt(statistics.commentCount || '0'),
    duration: durationSeconds,
    durationFormatted: contentDetails.duration,
  };
}

// Fetch YouTube page and extract caption tracks
async function fetchYouTubeTranscript(videoId: string): Promise<{ transcription: string; language: string }> {
  console.log("Fetching YouTube page for captions:", videoId);
  
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
    console.log("No captions available for this video");
    return { transcription: "", language: "none" };
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

// Get user's YouTube API key from database
async function getUserYouTubeApiKey(userId: string): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from('user_api_settings')
    .select('youtube_api_key')
    .eq('user_id', userId)
    .single();
  
  if (error || !data?.youtube_api_key) {
    return null;
  }
  
  return data.youtube_api_key;
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

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    let videoDetails = null;
    
    // Try to fetch video details using YouTube API if user has API key
    if (userId) {
      const youtubeApiKey = await getUserYouTubeApiKey(userId);
      
      if (youtubeApiKey) {
        try {
          videoDetails = await fetchVideoDetailsFromYouTube(videoId, youtubeApiKey);
          console.log("Video details fetched successfully:", videoDetails.title);
        } catch (apiError) {
          console.error("YouTube API error, falling back to scraping:", apiError);
        }
      } else {
        console.log("No YouTube API key found for user, using scraping method");
      }
    }

    // Fetch transcription
    const { transcription, language } = await fetchYouTubeTranscript(videoId);

    return new Response(
      JSON.stringify({
        transcription,
        language,
        videoId,
        videoDetails,
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
