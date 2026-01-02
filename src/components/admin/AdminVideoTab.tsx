import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Video, ExternalLink, Youtube, Play } from "lucide-react";

export const AdminVideoTab = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVideoSettings();
  }, []);

  const fetchVideoSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .eq("key", "landing_video_url")
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setYoutubeUrl((data.value as { url: string })?.url || "");
      }
    } catch (error) {
      console.error("Error fetching video settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSave = async () => {
    if (!youtubeUrl.trim()) {
      toast.error("Por favor, insira um link do YouTube");
      return;
    }

    const videoId = extractVideoId(youtubeUrl.trim());
    if (!videoId) {
      toast.error("Link do YouTube inválido");
      return;
    }

    setSaving(true);
    try {
      const { data: existingData } = await supabase
        .from("admin_settings")
        .select("id")
        .eq("key", "landing_video_url")
        .maybeSingle();

      if (existingData) {
        const { error } = await supabase
          .from("admin_settings")
          .update({ 
            value: { url: youtubeUrl.trim(), videoId },
            updated_at: new Date().toISOString(),
          })
          .eq("key", "landing_video_url");

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_settings")
          .insert({
            key: "landing_video_url",
            value: { url: youtubeUrl.trim(), videoId },
          });

        if (error) throw error;
      }

      toast.success("Vídeo da landing page atualizado!");
    } catch (error) {
      console.error("Error saving video settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const videoId = extractVideoId(youtubeUrl);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Youtube className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Vídeo da Landing Page</h3>
            <p className="text-sm text-muted-foreground">
              Configure o vídeo de demonstração exibido na página inicial
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="youtube-url" className="text-sm font-medium mb-2 flex items-center gap-2">
              <Video className="w-4 h-4 text-muted-foreground" />
              Link do YouTube
            </Label>
            <Input
              id="youtube-url"
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formatos aceitos: youtube.com/watch?v=ID, youtu.be/ID, ou apenas o ID do vídeo
            </p>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full gradient-button"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </Card>

      {/* Preview */}
      {videoId && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-success/10">
              <Play className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Preview do Vídeo</h3>
              <p className="text-sm text-muted-foreground">
                Este é o vídeo que será exibido na landing page
              </p>
            </div>
          </div>

          <div className="aspect-video rounded-lg overflow-hidden bg-black border border-border">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="Preview do vídeo"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Abrir no YouTube
            </a>
          </div>
        </Card>
      )}
    </div>
  );
};
