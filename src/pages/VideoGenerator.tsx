import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Film, Upload, Play, Settings, Clock, Download } from "lucide-react";
import { useState } from "react";

const VideoGenerator = () => {
  const [script, setScript] = useState("");
  const [style, setStyle] = useState("");

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Gerador de Vídeo</h1>
            <p className="text-muted-foreground">
              Crie vídeos automaticamente a partir de roteiros
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Film className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Configuração do Vídeo</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Título do Vídeo</label>
                    <Input 
                      placeholder="Digite o título do seu vídeo..."
                      className="bg-secondary border-border"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Roteiro</label>
                    <Textarea
                      placeholder="Cole ou digite o roteiro do vídeo..."
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      className="bg-secondary border-border min-h-40"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Estilo Visual</label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Selecione o estilo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="documentary">Documentário</SelectItem>
                          <SelectItem value="cinematic">Cinemático</SelectItem>
                          <SelectItem value="dark">Dark/Mistério</SelectItem>
                          <SelectItem value="educational">Educacional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Duração Alvo</label>
                      <Select>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Selecione a duração" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Curto (5-10 min)</SelectItem>
                          <SelectItem value="medium">Médio (10-20 min)</SelectItem>
                          <SelectItem value="long">Longo (20-30 min)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                      <Film className="w-4 h-4 mr-2" />
                      Gerar Vídeo
                    </Button>
                    <Button variant="outline" className="border-border text-muted-foreground hover:bg-secondary">
                      <Upload className="w-4 h-4 mr-2" />
                      Importar Mídia
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Fila de Renderização</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Vídeo #1</span>
                      <span className="text-xs text-primary">Renderizando...</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full">
                      <div className="h-full w-2/3 bg-primary rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Play className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Vídeos Recentes</h3>
                </div>
                <div className="space-y-3">
                  {[1, 2].map((_, index) => (
                    <div key={index} className="p-3 bg-secondary/50 rounded-lg">
                      <div className="aspect-video bg-secondary rounded mb-2 flex items-center justify-center">
                        <Play className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Vídeo #{index + 1}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default VideoGenerator;
