import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Library, Search, Eye, ThumbsUp, Play, Plus, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ViralVideo {
  id: string;
  title: string | null;
  video_url: string;
  views: string | null;
  likes: string | null;
  duration: string | null;
  notes: string | null;
}

const ViralLibrary = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [videos, setVideos] = useState<ViralVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVideo, setNewVideo] = useState({ title: '', video_url: '', notes: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchVideos();
  }, [user]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('viral_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async () => {
    if (!user || !newVideo.video_url.trim()) {
      toast.error('URL do vídeo é obrigatória');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('viral_library')
        .insert({
          user_id: user.id,
          title: newVideo.title || 'Vídeo sem título',
          video_url: newVideo.video_url,
          notes: newVideo.notes
        });

      if (error) throw error;
      toast.success('Vídeo adicionado à biblioteca!');
      setNewVideo({ title: '', video_url: '', notes: '' });
      setDialogOpen(false);
      fetchVideos();
    } catch (error) {
      console.error('Error adding video:', error);
      toast.error('Erro ao adicionar vídeo');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('viral_library')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Vídeo removido!');
      setVideos(videos.filter(v => v.id !== id));
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Erro ao remover vídeo');
    }
  };

  const handleAnalyzeVideo = async (video: ViralVideo) => {
    toast.info('Redirecionando para análise...');
    window.location.href = `/viral-analysis?url=${encodeURIComponent(video.video_url)}`;
  };

  const filteredVideos = videos.filter(v => 
    v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Biblioteca Virais</h1>
            <p className="text-muted-foreground">
              Coleção de vídeos virais para inspiração e análise
            </p>
          </div>

          <Card className="p-6 mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar na biblioteca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <Button variant="outline" className="border-border">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Vídeo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Vídeo à Biblioteca</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Título</label>
                      <Input
                        placeholder="Título do vídeo"
                        value={newVideo.title}
                        onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">URL do Vídeo *</label>
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        value={newVideo.video_url}
                        onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Notas</label>
                      <Input
                        placeholder="Anotações sobre o vídeo"
                        value={newVideo.notes}
                        onChange={(e) => setNewVideo({ ...newVideo, notes: e.target.value })}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <Button 
                      onClick={handleAddVideo} 
                      disabled={saving}
                      className="w-full bg-primary text-primary-foreground"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Adicionar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredVideos.length === 0 ? (
            <Card className="p-12 text-center">
              <Library className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Biblioteca vazia</h3>
              <p className="text-muted-foreground">
                Adicione vídeos virais para sua coleção de inspiração
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                  <div className="aspect-video bg-secondary relative flex items-center justify-center">
                    <Play className="w-12 h-12 text-primary" />
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-xs text-foreground">
                        {video.duration}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-3 line-clamp-2">{video.title}</h3>
                    {video.notes && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{video.notes}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {video.views && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {video.views}
                        </span>
                      )}
                      {video.likes && (
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {video.likes}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-border text-foreground hover:bg-secondary"
                        onClick={() => handleAnalyzeVideo(video)}
                      >
                        Analisar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteVideo(video.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ViralLibrary;
