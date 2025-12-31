import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Library, Search, Eye, ThumbsUp, Clock, Play } from "lucide-react";
import { useState } from "react";

const viralVideos = [
  { title: "Os 10 Mistérios Mais Assustadores do Egito", views: "2.3M", likes: "89K", duration: "15:23" },
  { title: "A Verdade Sobre Atlântida que Ninguém Conta", views: "1.8M", likes: "76K", duration: "18:45" },
  { title: "Civilizações Perdidas: O Que Descobrimos", views: "3.1M", likes: "124K", duration: "22:10" },
  { title: "Os Segredos das Pirâmides Revelados", views: "4.5M", likes: "198K", duration: "25:30" },
  { title: "Teorias Sobre o Triângulo das Bermudas", views: "1.2M", likes: "54K", duration: "12:18" },
  { title: "A História Oculta da Humanidade", views: "2.8M", likes: "112K", duration: "28:45" },
];

const ViralLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("");

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
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {viralVideos.map((video, index) => (
              <Card key={index} className="overflow-hidden hover:border-primary/50 transition-colors">
                <div className="aspect-video bg-secondary relative flex items-center justify-center">
                  <Play className="w-12 h-12 text-primary" />
                  <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-xs text-foreground">
                    {video.duration}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-3 line-clamp-2">{video.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {video.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {video.likes}
                    </span>
                  </div>
                  <Button variant="outline" className="w-full mt-4 border-border text-foreground hover:bg-secondary">
                    Analisar Vídeo
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ViralLibrary;
