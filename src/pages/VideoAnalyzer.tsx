import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Search, BarChart3, TrendingUp, Eye, ThumbsUp, MessageSquare, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const VideoAnalyzer = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: recentAnalyses, refetch } = useQuery({
    queryKey: ["video-analyses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("video_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleAnalyze = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma URL de vídeo",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "analyze_video",
          videoData: { url: videoUrl },
        },
      });

      if (response.error) throw response.error;

      const result = response.data.result;
      setAnalysisResult(result);

      // Save to database
      await supabase.from("video_analyses").insert({
        user_id: user?.id,
        video_url: videoUrl,
        video_title: `Análise - ${new Date().toLocaleDateString()}`,
        analysis_data: { result },
      });

      refetch();

      toast({
        title: "Análise concluída!",
        description: "O vídeo foi analisado com sucesso",
      });
    } catch (error) {
      console.error("Error analyzing video:", error);
      toast({
        title: "Erro",
        description: "Não foi possível analisar o vídeo",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Analisador de Vídeos</h1>
            <p className="text-muted-foreground">
              Analise vídeos virais e descubra os segredos por trás do sucesso
            </p>
          </div>

          <Card className="p-6 mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cole a URL do vídeo do YouTube..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <Button 
                onClick={handleAnalyze}
                disabled={analyzing}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {analyzing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Analisar
              </Button>
            </div>
          </Card>

          {analysisResult && (
            <Card className="p-6 mb-8">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Resultado da Análise
              </h3>
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-foreground bg-secondary/50 p-4 rounded-lg">
                  {analysisResult}
                </pre>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Eye className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">Views</span>
              </div>
              <p className="text-2xl font-bold text-foreground">--</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <ThumbsUp className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">Likes</span>
              </div>
              <p className="text-2xl font-bold text-foreground">--</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">Comentários</span>
              </div>
              <p className="text-2xl font-bold text-foreground">--</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">Engajamento</span>
              </div>
              <p className="text-2xl font-bold text-foreground">--</p>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Vídeos Analisados Recentemente</h3>
            </div>
            {recentAnalyses && recentAnalyses.length > 0 ? (
              <div className="space-y-3">
                {recentAnalyses.map((analysis) => (
                  <div key={analysis.id} className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-foreground font-medium truncate">{analysis.video_url}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(analysis.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum vídeo analisado ainda</p>
                <p className="text-sm">Cole uma URL acima para começar</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default VideoAnalyzer;
