import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  Plus,
  Search,
  Loader2,
  Trash2,
  Pin,
  X,
  ThumbsUp,
  Play,
  Folder,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChannelVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  views: string;
  likes: string;
  publishedAt: string;
  url: string;
}

interface PinnedVideo {
  id: string;
  channel_id: string;
  video_id: string;
  video_url: string;
  title: string;
  thumbnail_url: string;
  views: string;
  likes: string;
}

const MonitoredChannels = () => {
  // Persisted states
  const [channelUrl, setChannelUrl] = usePersistedState("monitored_channelUrl", "");
  const [channelName, setChannelName] = usePersistedState("monitored_channelName", "");

  // Non-persisted states
  const [adding, setAdding] = useState(false);
  const [loadingChannelName, setLoadingChannelName] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [recentVideos, setRecentVideos] = useState<ChannelVideo[]>([]);
  const [popularVideos, setPopularVideos] = useState<ChannelVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [showVideosDialog, setShowVideosDialog] = useState(false);
  const [pinnedFilter, setPinnedFilter] = useState<string>("all");

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch monitored channels
  const { data: channels, isLoading } = useQuery({
    queryKey: ["monitored-channels", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("monitored_channels")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch pinned videos
  const { data: pinnedVideos } = useQuery({
    queryKey: ["pinned-videos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pinned_videos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PinnedVideo[];
    },
    enabled: !!user,
  });

  // Extract channel name from URL
  const extractChannelName = async (url: string) => {
    if (!url.includes("youtube.com") && !url.includes("youtu.be")) return;

    setLoadingChannelName(true);
    try {
      // Extrair handle ou ID do canal da URL
      const handleMatch = url.match(/@([a-zA-Z0-9_-]+)/);
      if (handleMatch) {
        setChannelName(handleMatch[1]);
      } else {
        // Tentar extrair nome do canal de outras formas
        const channelMatch = url.match(/\/channel\/([a-zA-Z0-9_-]+)/);
        const userMatch = url.match(/\/user\/([a-zA-Z0-9_-]+)/);
        if (channelMatch) {
          setChannelName(channelMatch[1]);
        } else if (userMatch) {
          setChannelName(userMatch[1]);
        }
      }
    } catch (error) {
      console.error("Error extracting channel name:", error);
    } finally {
      setLoadingChannelName(false);
    }
  };

  // Add channel mutation
  const addChannelMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.from("monitored_channels").insert({
        user_id: user.id,
        channel_url: channelUrl,
        channel_name: channelName || "Canal sem nome",
        subscribers: "N/A",
        growth_rate: "+0%",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitored-channels"] });
      setChannelUrl("");
      setChannelName("");
      toast({
        title: "Canal adicionado!",
        description: "O canal foi adicionado à sua lista de monitoramento",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o canal",
        variant: "destructive",
      });
    },
  });

  // Delete channel mutation
  const deleteChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const { error } = await supabase
        .from("monitored_channels")
        .delete()
        .eq("id", channelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitored-channels"] });
      queryClient.invalidateQueries({ queryKey: ["pinned-videos"] });
      toast({
        title: "Canal removido",
        description: "O canal foi removido da sua lista",
      });
    },
  });

  // Pin video mutation
  const pinVideoMutation = useMutation({
    mutationFn: async (video: ChannelVideo & { channelId: string }) => {
      if (!user) throw new Error("User not authenticated");

      // Check if already pinned 3 videos for this channel
      const channelPins = pinnedVideos?.filter((v) => v.channel_id === video.channelId) || [];
      if (channelPins.length >= 3) {
        throw new Error("Limite de 3 vídeos fixados por canal");
      }

      const { error } = await supabase.from("pinned_videos").insert({
        user_id: user.id,
        channel_id: video.channelId,
        video_id: video.videoId,
        video_url: video.url,
        title: video.title,
        thumbnail_url: video.thumbnail,
        views: video.views,
        likes: video.likes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinned-videos"] });
      toast({ title: "Vídeo fixado!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unpin video mutation
  const unpinVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from("pinned_videos")
        .delete()
        .eq("id", videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinned-videos"] });
      toast({ title: "Vídeo removido dos fixados" });
    },
  });

  const handleAddChannel = async () => {
    if (!channelUrl.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira a URL do canal",
        variant: "destructive",
      });
      return;
    }
    setAdding(true);
    await addChannelMutation.mutateAsync();
    setAdding(false);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setChannelUrl(url);
    if (url.length > 10) {
      extractChannelName(url);
    }
  };

  // Fetch user's YouTube API key
  const { data: apiSettings } = useQuery({
    queryKey: ["api-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_api_settings")
        .select("youtube_api_key, youtube_validated")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch channel videos using YouTube API
  const fetchChannelVideos = async (channelId: string, channelUrlToFetch: string) => {
    if (!apiSettings?.youtube_api_key) {
      toast({
        title: "Chave de API necessária",
        description: "Configure sua chave de API do YouTube nas configurações para buscar vídeos reais.",
        variant: "destructive",
      });
      return;
    }

    setLoadingVideos(true);
    setSelectedChannelId(channelId);
    setShowVideosDialog(true);

    try {
      const { data, error } = await supabase.functions.invoke("fetch-channel-videos", {
        body: {
          channelUrl: channelUrlToFetch,
          youtubeApiKey: apiSettings.youtube_api_key,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Set recent and popular videos separately
      setRecentVideos(data.recentVideos || []);
      setPopularVideos(data.popularVideos || []);

      // Update channel name if we got a better one
      if (data.channelName) {
        await supabase
          .from("monitored_channels")
          .update({ channel_name: data.channelName })
          .eq("id", channelId);
        queryClient.invalidateQueries({ queryKey: ["monitored-channels"] });
      }

    } catch (error: unknown) {
      console.error("Error fetching videos:", error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível buscar os vídeos do canal";
      
      // Check if it's an API key issue
      if (errorMessage.includes("API") || errorMessage.includes("key")) {
        toast({
          title: "Chave de API necessária",
          description: "Configure sua chave de API do YouTube nas configurações para buscar vídeos reais.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleAnalyzeVideo = (videoUrl: string) => {
    navigate(`/analyzer?url=${encodeURIComponent(videoUrl)}`);
  };

  const isVideoPinned = (videoId: string) => {
    return pinnedVideos?.some((v) => v.video_id === videoId);
  };

  // Filter pinned videos by channel
  const filteredPinnedVideos =
    pinnedFilter === "all"
      ? pinnedVideos
      : pinnedVideos?.filter((v) => v.channel_id === pinnedFilter);

  // Group pinned videos by channel
  const groupedPinnedVideos = channels?.reduce(
    (acc, channel) => {
      const videos = pinnedVideos?.filter((v) => v.channel_id === channel.id) || [];
      if (videos.length > 0) {
        acc[channel.id] = {
          channelName: channel.channel_name || "Canal",
          videos,
        };
      }
      return acc;
    },
    {} as Record<string, { channelName: string; videos: PinnedVideo[] }>
  );

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Canais Monitorados
            </h1>
            <p className="text-muted-foreground">
              Adicione canais do YouTube para monitorar novos vídeos.
            </p>
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Add Channel Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Adicionar Novo Canal
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">
                    Nome do Canal
                  </label>
                  <Input
                    placeholder="Ex: Canal Dark"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">
                    URL do Canal
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="https://www.youtube.com/@canal"
                      value={channelUrl}
                      onChange={handleUrlChange}
                      className="bg-secondary border-border"
                    />
                    {loadingChannelName && (
                      <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleAddChannel}
                  disabled={adding}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {adding ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Adicionar Canal
                </Button>
              </div>
            </Card>

            {/* Channels List Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Meus Canais Monitorados
              </h2>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : channels && channels.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-primary">NOME</TableHead>
                        <TableHead className="text-primary">URL</TableHead>
                        <TableHead className="text-primary text-right">
                          AÇÕES
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {channels.map((channel) => (
                        <TableRow key={channel.id} className="border-border">
                          <TableCell className="font-medium text-foreground">
                            {channel.channel_name}
                          </TableCell>
                          <TableCell>
                            <a
                              href={channel.channel_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm truncate max-w-[200px] block"
                            >
                              {channel.channel_url}
                            </a>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  fetchChannelVideos(channel.id, channel.channel_url)
                                }
                                title="Buscar Vídeos"
                                className="text-primary hover:bg-primary/10"
                              >
                                <Search className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteChannelMutation.mutate(channel.id)}
                                className="text-destructive hover:bg-destructive/10"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground text-sm">
                    Nenhum canal monitorado ainda
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Pinned Videos Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Vídeos Fixados
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Canal:</span>
                <Select value={pinnedFilter} onValueChange={setPinnedFilter}>
                  <SelectTrigger className="w-[180px] bg-secondary border-border">
                    <SelectValue placeholder="Todos os Canais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Canais</SelectItem>
                    {channels?.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.channel_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {pinnedVideos && pinnedVideos.length > 0 ? (
              <div className="space-y-6">
                {pinnedFilter === "all" ? (
                  // Grouped by channel
                  Object.entries(groupedPinnedVideos || {}).map(
                    ([channelId, { channelName, videos }]) => (
                      <div key={channelId}>
                        <div className="flex items-center gap-2 mb-4">
                          <Folder className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">
                            {channelName}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({videos.length} vídeos fixados)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {videos.map((video) => (
                            <PinnedVideoCard
                              key={video.id}
                              video={video}
                              onAnalyze={() => handleAnalyzeVideo(video.video_url)}
                              onUnpin={() => unpinVideoMutation.mutate(video.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  // Filtered by specific channel
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPinnedVideos?.map((video) => (
                      <PinnedVideoCard
                        key={video.id}
                        video={video}
                        onAnalyze={() => handleAnalyzeVideo(video.video_url)}
                        onUnpin={() => unpinVideoMutation.mutate(video.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Pin className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum vídeo fixado ainda</p>
                <p className="text-sm text-muted-foreground">
                  Busque vídeos de um canal e fixe até 3 por canal
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Videos Dialog */}
      <Dialog open={showVideosDialog} onOpenChange={setShowVideosDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vídeos do Canal</DialogTitle>
          </DialogHeader>

          {loadingVideos ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Recent Videos */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  🕐 Vídeos Recentes
                </h3>
                {recentVideos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentVideos.map((video) => (
                      <VideoCard
                        key={video.videoId}
                        video={video}
                        channelId={selectedChannelId!}
                        isPinned={isVideoPinned(video.videoId)}
                        onPin={() =>
                          pinVideoMutation.mutate({
                            ...video,
                            channelId: selectedChannelId!,
                          })
                        }
                        onAnalyze={() => handleAnalyzeVideo(video.url)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum vídeo recente encontrado</p>
                )}
              </div>

              {/* Popular Videos */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  🔥 Vídeos Mais Vistos
                </h3>
                {popularVideos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {popularVideos.map((video) => (
                      <VideoCard
                        key={video.videoId}
                        video={video}
                        channelId={selectedChannelId!}
                        isPinned={isVideoPinned(video.videoId)}
                        onPin={() =>
                          pinVideoMutation.mutate({
                            ...video,
                            channelId: selectedChannelId!,
                          })
                        }
                        onAnalyze={() => handleAnalyzeVideo(video.url)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum vídeo popular encontrado</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

// Video Card Component
interface VideoCardProps {
  video: ChannelVideo;
  channelId: string;
  isPinned: boolean;
  onPin: () => void;
  onAnalyze: () => void;
}

const VideoCard = ({ video, isPinned, onPin, onAnalyze }: VideoCardProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-12 h-12 text-white" />
        </div>
      </div>
      <div className="p-3">
        <h4 className="font-medium text-foreground text-sm line-clamp-2 mb-2">
          {video.title}
        </h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {video.views}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> {video.likes}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onAnalyze}
            size="sm"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Analisar
          </Button>
          <Button
            onClick={onPin}
            size="sm"
            variant="outline"
            disabled={isPinned}
            className="px-3"
          >
            <Pin className={`w-4 h-4 ${isPinned ? "text-primary" : ""}`} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Pinned Video Card Component
interface PinnedVideoCardProps {
  video: PinnedVideo;
  onAnalyze: () => void;
  onUnpin: () => void;
}

const PinnedVideoCard = ({ video, onAnalyze, onUnpin }: PinnedVideoCardProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video">
        <img
          src={video.thumbnail_url}
          alt={video.title || "Vídeo"}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3">
        <h4 className="font-medium text-foreground text-sm line-clamp-2 mb-2">
          {video.title}
        </h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {video.views}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> {video.likes}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onAnalyze}
            size="sm"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Analisar
          </Button>
          <Button
            onClick={onUnpin}
            size="sm"
            variant="outline"
            className="px-3 text-destructive hover:bg-destructive/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MonitoredChannels;
