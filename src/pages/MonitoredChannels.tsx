import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Plus, Search, Users, Video, TrendingUp, Bell, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const MonitoredChannels = () => {
  const [channelUrl, setChannelUrl] = useState("");
  const [channelName, setChannelName] = useState("");
  const [adding, setAdding] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      toast({
        title: "Canal removido",
        description: "O canal foi removido da sua lista",
      });
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

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Canais Monitorados</h1>
            <p className="text-muted-foreground">
              Acompanhe o desempenho dos canais concorrentes e de referência
            </p>
          </div>

          <Card className="p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Input
                  placeholder="Nome do canal"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="md:col-span-1">
                <Input
                  placeholder="URL do canal do YouTube"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <Button 
                onClick={handleAddChannel}
                disabled={adding}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
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

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : channels && channels.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {channels.map((channel) => (
                <Card key={channel.id} className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                        <Eye className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{channel.channel_name}</h3>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {channel.subscribers}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => deleteChannelMutation.mutate(channel.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Vídeos</p>
                      <p className="text-lg font-semibold text-foreground flex items-center gap-1">
                        <Video className="w-4 h-4 text-primary" />
                        {channel.videos_count}
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Crescimento</p>
                      <p className="text-lg font-semibold text-success flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {channel.growth_rate}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{channel.channel_url}</p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhum canal monitorado ainda</p>
              <p className="text-sm text-muted-foreground">Adicione canais acima para começar</p>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default MonitoredChannels;
