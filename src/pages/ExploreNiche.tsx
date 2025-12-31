import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Compass, Search, TrendingUp, Users, Video } from "lucide-react";
import { useState } from "react";

const niches = [
  { name: "Mistérios e Conspirações", videos: "2.3M", growth: "+45%" },
  { name: "História Antiga", videos: "1.8M", growth: "+32%" },
  { name: "True Crime", videos: "3.1M", growth: "+28%" },
  { name: "Ciência e Espaço", videos: "1.5M", growth: "+52%" },
  { name: "Biografias", videos: "890K", growth: "+18%" },
  { name: "Documentários", videos: "2.1M", growth: "+25%" },
];

const ExploreNiche = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Explorar Nicho</h1>
            <p className="text-muted-foreground">
              Descubra nichos em alta e encontre oportunidades de conteúdo
            </p>
          </div>

          <Card className="p-6 mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar nichos..."
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
            {niches.map((niche, index) => (
              <Card key={index} className="p-5 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Compass className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-success text-sm font-medium">{niche.growth}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{niche.name}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    {niche.videos} vídeos
                  </span>
                </div>
                <Button variant="outline" className="w-full mt-4 border-border text-foreground hover:bg-secondary">
                  Explorar
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ExploreNiche;
