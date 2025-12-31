import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Search, Eye, ThumbsUp, MessageSquare, Clock, Zap } from "lucide-react";
import { useState } from "react";

const viralFactors = [
  { name: "Título Impactante", score: 85, tip: "Adicione números e palavras de poder" },
  { name: "Thumbnail Atrativa", score: 72, tip: "Use contrastes fortes e rostos" },
  { name: "Gancho Inicial", score: 90, tip: "Os primeiros 10 segundos estão ótimos" },
  { name: "Retenção de Audiência", score: 68, tip: "Adicione mais momentos de tensão" },
  { name: "Call to Action", score: 45, tip: "Inclua mais CTAs durante o vídeo" },
];

const ViralAnalysis = () => {
  const [videoUrl, setVideoUrl] = useState("");

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Análise de Canais Virais</h1>
            <p className="text-muted-foreground">
              Descubra os fatores que fazem um vídeo se tornar viral
            </p>
          </div>

          <Card className="p-6 mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cole a URL do vídeo ou canal para análise..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analisar Viralidade
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Zap className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Fatores de Viralidade</h3>
                </div>
                <div className="space-y-4">
                  {viralFactors.map((factor, index) => (
                    <div key={index} className="p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{factor.name}</span>
                        <span className={`font-semibold ${
                          factor.score >= 80 ? "text-success" :
                          factor.score >= 60 ? "text-primary" :
                          "text-destructive"
                        }`}>{factor.score}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full mb-2">
                        <div 
                          className={`h-full rounded-full ${
                            factor.score >= 80 ? "bg-success" :
                            factor.score >= 60 ? "bg-primary" :
                            "bg-destructive"
                          }`}
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">{factor.tip}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Score de Viralidade</h3>
                <div className="text-center py-6">
                  <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-primary">72</span>
                  </div>
                  <p className="text-muted-foreground">Potencial Médio-Alto</p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Métricas Estimadas</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      Views Potenciais
                    </span>
                    <span className="font-medium text-foreground">50K - 150K</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ThumbsUp className="w-4 h-4" />
                      Engajamento
                    </span>
                    <span className="font-medium text-foreground">3.2%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Tempo de Pico
                    </span>
                    <span className="font-medium text-foreground">48-72h</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ViralAnalysis;
