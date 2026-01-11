import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ViralVideoPayload {
  user_id?: string;
  video_id: string;
  video_url: string;
  title?: string;
  thumbnail_url?: string;
  channel_name?: string;
  channel_url?: string;
  views?: number;
  likes?: number;
  comments?: number;
  published_at?: string;
  viral_score?: number;
  niche?: string;
  keywords?: string[];
  video_type?: string;
  duration?: string;
  hours_ago?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await req.json();
    console.log('[viral-webhook] Received payload:', JSON.stringify(body, null, 2));

    // Extract user_id from the root level (for n8n workflow)
    const rootUserId = body.user_id;

    // Support both single video and array of videos
    let videos: ViralVideoPayload[] = [];
    
    if (Array.isArray(body.videos)) {
      videos = body.videos;
    } else if (body.video) {
      videos = [body.video];
    } else if (body.video_id && body.video_url) {
      videos = [body];
    }

    if (!videos.length) {
      return new Response(
        JSON.stringify({ error: 'No videos provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    const errors = [];

    for (const video of videos) {
      // Use user_id from video if present, otherwise use root user_id
      const userId = video.user_id || rootUserId;
      
      if (!userId || !video.video_id || !video.video_url) {
        errors.push({ 
          video_id: video.video_id, 
          error: `Missing required fields: ${!userId ? 'user_id, ' : ''}${!video.video_id ? 'video_id, ' : ''}${!video.video_url ? 'video_url' : ''}`.replace(/, $/, '')
        });
        continue;
      }

      // Calculate viral score if not provided
      let viralScore = video.viral_score;
      if (!viralScore && video.views && video.published_at) {
        const publishedDate = new Date(video.published_at);
        const hoursOld = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);
        viralScore = hoursOld > 0 ? Math.round(video.views / hoursOld) : video.views;
      }

      // Determine video type based on duration or title hints
      let videoType = video.video_type || 'long';
      if (!video.video_type) {
        const titleLower = (video.title || '').toLowerCase();
        if (titleLower.includes('#shorts') || titleLower.includes('#short')) {
          videoType = 'short';
        }
      }

      // Upsert the viral video (update if exists, insert if not)
      const { data, error } = await supabaseAdmin
        .from('viral_videos')
        .upsert({
          user_id: userId,
          video_id: video.video_id,
          video_url: video.video_url,
          title: video.title,
          thumbnail_url: video.thumbnail_url,
          channel_name: video.channel_name,
          channel_url: video.channel_url,
          views: video.views || 0,
          likes: video.likes || 0,
          comments: video.comments || 0,
          published_at: video.published_at,
          viral_score: viralScore || 0,
          niche: video.niche,
          keywords: video.keywords,
          video_type: videoType,
          duration: video.duration,
          detected_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,video_id',
        })
        .select()
        .single();

      if (error) {
        console.error('[viral-webhook] Error inserting video:', error);
        errors.push({ video_id: video.video_id, error: error.message });
      } else {
        console.log('[viral-webhook] Inserted viral video:', data.id);
        results.push({ video_id: video.video_id, id: data.id });

        // Send push notification to user
        try {
          const { data: subscriptions } = await supabaseAdmin
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId);

          if (subscriptions && subscriptions.length > 0) {
            console.log(`[viral-webhook] Found ${subscriptions.length} push subscriptions for user`);
            // Push notification logic can be implemented here
          }
        } catch (pushError) {
          console.error('[viral-webhook] Error sending push:', pushError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: results.length,
        errorsCount: errors.length,
        results,
        errorDetails: errors.length > 0 ? errors : undefined,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('[viral-webhook] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
