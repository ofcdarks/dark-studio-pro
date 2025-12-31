import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Search, BarChart3, TrendingUp, Eye, ThumbsUp, MessageSquare } from "lucide-react";
import { useState } from "react";

const VideoAnalyzer = () => {
  const [videoUrl, setVideoUrl] = useState("");

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
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Search className="w-4 h-4 mr-2" />
                Analisar
              </Button>
            </div>
          </Card>

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
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum vídeo analisado ainda</p>
              <p className="text-sm">Cole uma URL acima para começar</p>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default VideoAnalyzer;
