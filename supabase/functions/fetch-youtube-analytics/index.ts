import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelUrl, youtubeApiKey } = await req.json();

    if (!youtubeApiKey) {
      return new Response(
        JSON.stringify({ error: "YouTube API key is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!channelUrl) {
      return new Response(
        JSON.stringify({ error: "Channel URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching analytics for channel:", channelUrl);

    // Decode URL to handle encoded characters
    const decodedUrl = decodeURIComponent(channelUrl);

    // Extract channel ID from URL
    let channelId = "";
    let channelHandle = "";

    if (decodedUrl.includes("/channel/")) {
      const match = decodedUrl.match(/\/channel\/([a-zA-Z0-9_-]+)/);
      if (match) channelId = match[1];
    } else if (decodedUrl.includes("/@")) {
      const match = decodedUrl.match(/@([^\/\?]+)/);
      if (match) channelHandle = match[1];
    } else if (decodedUrl.includes("/user/")) {
      const match = decodedUrl.match(/\/user\/([^\/\?]+)/);
      if (match) channelHandle = match[1];
    } else if (decodedUrl.includes("/c/")) {
      const match = decodedUrl.match(/\/c\/([^\/\?]+)/);
      if (match) channelHandle = match[1];
    }

    // Get channel ID from handle if needed
    if (channelHandle && !channelId) {
      const handleUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(channelHandle)}&key=${youtubeApiKey}`;
      const handleResponse = await fetch(handleUrl);
      const handleData = await handleResponse.json();

      if (handleData.items && handleData.items.length > 0) {
        channelId = handleData.items[0].id;
      } else {
        // Fallback to search
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelHandle)}&maxResults=1&key=${youtubeApiKey}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (searchData.items && searchData.items.length > 0) {
          channelId = searchData.items[0].snippet.channelId;
        }
      }
    }

    if (!channelId) {
      return new Response(
        JSON.stringify({ error: "Could not find channel ID" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Found channel ID:", channelId);

    // Fetch channel statistics
    const channelStatsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,brandingSettings&id=${channelId}&key=${youtubeApiKey}`;
    const channelStatsResponse = await fetch(channelStatsUrl);
    const channelStatsData = await channelStatsResponse.json();

    if (!channelStatsData.items || channelStatsData.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Channel not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const channel = channelStatsData.items[0];
    const stats = channel.statistics;

    // Get channel's uploads playlist
    const uploadsPlaylistId = `UU${channelId.substring(2)}`; // Convert channel ID to uploads playlist ID

    // Fetch recent videos for engagement analysis
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${youtubeApiKey}`;
    const playlistResponse = await fetch(playlistUrl);
    const playlistData = await playlistResponse.json();

    let recentVideos: any[] = [];
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let videoStats: any[] = [];

    if (playlistData.items && playlistData.items.length > 0) {
      const videoIds = playlistData.items
        .map((item: any) => item.snippet.resourceId.videoId)
        .join(",");

      // Fetch video statistics
      const videosStatsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${youtubeApiKey}`;
      const videosStatsResponse = await fetch(videosStatsUrl);
      const videosStatsData = await videosStatsResponse.json();

      if (videosStatsData.items) {
        videoStats = videosStatsData.items.map((video: any) => {
          const views = parseInt(video.statistics.viewCount || "0", 10);
          const likes = parseInt(video.statistics.likeCount || "0", 10);
          const comments = parseInt(video.statistics.commentCount || "0", 10);

          totalViews += views;
          totalLikes += likes;
          totalComments += comments;

          return {
            videoId: video.id,
            title: video.snippet.title,
            thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
            publishedAt: video.snippet.publishedAt,
            views,
            likes,
            comments,
            duration: video.contentDetails?.duration,
            engagementRate: views > 0 ? ((likes + comments) / views * 100).toFixed(2) : "0",
          };
        });

        // Sort by views for top videos
        recentVideos = [...videoStats].sort((a, b) => b.views - a.views);
      }
    }

    // Calculate averages
    const videoCount = videoStats.length || 1;
    const avgViewsPerVideo = Math.round(totalViews / videoCount);
    const avgLikesPerVideo = Math.round(totalLikes / videoCount);
    const avgCommentsPerVideo = Math.round(totalComments / videoCount);
    const avgEngagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2) : "0";

    // Group videos by month for trends
    const monthlyData: Record<string, { views: number; videos: number; likes: number }> = {};
    videoStats.forEach((video) => {
      const date = new Date(video.publishedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { views: 0, videos: 0, likes: 0 };
      }
      monthlyData[monthKey].views += video.views;
      monthlyData[monthKey].videos += 1;
      monthlyData[monthKey].likes += video.likes;
    });

    // Convert to array for charts
    const trendsData = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        views: data.views,
        videos: data.videos,
        likes: data.likes,
        avgViews: Math.round(data.views / data.videos),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const result = {
      channel: {
        id: channelId,
        name: channel.snippet.title,
        description: channel.snippet.description,
        customUrl: channel.snippet.customUrl,
        thumbnail: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
        banner: channel.brandingSettings?.image?.bannerExternalUrl,
        country: channel.snippet.country,
        publishedAt: channel.snippet.publishedAt,
      },
      statistics: {
        subscribers: parseInt(stats.subscriberCount || "0", 10),
        totalViews: parseInt(stats.viewCount || "0", 10),
        totalVideos: parseInt(stats.videoCount || "0", 10),
        hiddenSubscriberCount: stats.hiddenSubscriberCount || false,
      },
      recentMetrics: {
        analyzedVideos: videoCount,
        totalViewsRecent: totalViews,
        avgViewsPerVideo,
        avgLikesPerVideo,
        avgCommentsPerVideo,
        avgEngagementRate: parseFloat(avgEngagementRate),
      },
      topVideos: recentVideos.slice(0, 10),
      trendsData,
      allVideos: videoStats,
    };

    console.log("Analytics fetched successfully");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching YouTube analytics:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
