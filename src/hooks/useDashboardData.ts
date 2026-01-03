import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface DashboardStats {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  viralVideos: number;
  avgCTR: number;
  scriptsGenerated: number;
  imagesGenerated: number;
  audiosGenerated: number;
  titlesGenerated: number;
}

interface RecentVideo {
  id: string;
  title: string;
  views: number | null;
  comments: number | null;
  channel: string;
  thumbnail_url: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
}

export function useDashboardData() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    viralVideos: 0,
    avgCTR: 0,
    scriptsGenerated: 0,
    imagesGenerated: 0,
    audiosGenerated: 0,
    titlesGenerated: 0,
  });
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch analyzed videos
      const { data: videos, error: videosError } = await supabase
        .from("analyzed_videos")
        .select("*")
        .eq("user_id", user.id);

      if (videosError) throw videosError;

      // Calculate video stats
      const totalVideos = videos?.length || 0;
      const totalViews = videos?.reduce((sum, v) => sum + (v.original_views || 0), 0) || 0;
      const totalComments = videos?.reduce((sum, v) => sum + (v.original_comments || 0), 0) || 0;
      
      // Viral videos = videos with 100k+ views
      const viralVideos = videos?.filter(v => (v.original_views || 0) >= 100000).length || 0;

      // Fetch recent videos (last 5)
      const recentVids: RecentVideo[] = (videos || [])
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
        .slice(0, 5)
        .map(v => ({
          id: v.id,
          title: v.original_title || v.translated_title || "Sem título",
          views: v.original_views ?? null,
          comments: v.original_comments ?? null,
          channel: v.detected_niche || "Canal",
          thumbnail_url: v.original_thumbnail_url || "",
          created_at: v.created_at || "",
        }));

      // Fetch generated scripts count
      const { count: scriptsCount } = await supabase
        .from("generated_scripts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch generated images count
      const { count: imagesCount } = await supabase
        .from("generated_images")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch generated audios count
      const { count: audiosCount } = await supabase
        .from("generated_audios")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch generated titles count
      const { count: titlesCount } = await supabase
        .from("generated_titles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch activity logs
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setStats({
        totalVideos,
        totalViews,
        totalLikes: 0, // Not tracked in current schema
        totalComments,
        viralVideos,
        avgCTR: 0, // Would need more data
        scriptsGenerated: scriptsCount || 0,
        imagesGenerated: imagesCount || 0,
        audiosGenerated: audiosCount || 0,
        titlesGenerated: titlesCount || 0,
      });

      setRecentVideos(recentVids);
      setActivityLogs((logs || []).map(l => ({
        id: l.id,
        action: l.action,
        description: l.description || "",
        created_at: l.created_at || "",
      })));

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    recentVideos,
    activityLogs,
    loading,
    refetch: fetchDashboardData,
  };
}