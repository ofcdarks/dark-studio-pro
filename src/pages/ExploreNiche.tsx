import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Compass, Search, TrendingUp, Video, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Niche {
  name: string;
  videos: string;
  growth: string;
  description?: string;
  keywords?: string[];
  topChannels?: string[];
}

const defaultNiches: Niche[] = [
  { name: "Mistérios e Conspirações", videos: "2.3M", growth: "+45%" },
  { name: "História Antiga", videos: "1.8M", growth: "+32%" },
  { name: "True Crime", videos: "3.1M", growth: "+28%" },
  { name: "Ciência e Espaço", videos: "1.5M", growth: "+52%" },
  { name: "Biografias", videos: "890K", growth: "+18%" },
  { name: "Documentários", videos: "2.1M", growth: "+25%" },
];

const ExploreNiche = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [niches, setNiches] = useState<Niche[]>(defaultNiches);
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [nicheDetails, setNicheDetails] = useState<Niche | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setNiches(defaultNiches);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'explore_niche',
          query: searchTerm
        }
      });

      if (error) throw error;

      if (data.niches) {
        setNiches(data.niches);
        toast.success(`${data.niches.length} nichos encontrados!`);
      }
    } catch (error) {
      console.error('Error searching niches:', error);
      toast.error('Erro ao buscar nichos');
    } finally {
      setLoading(false);
    }
  };

  const handleExplore = async (niche: Niche) => {
    setSelectedNiche(niche);
    setLoadingDetails(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'niche_details',
          nicheName: niche.name
        }
      });

      if (error) throw error;

      if (data.details) {
        setNicheDetails(data.details);
      } else {
        setNicheDetails({
          ...niche,
          description: `O nicho "${niche.name}" está em alta com crescimento de ${niche.growth}. É uma excelente oportunidade para criadores de conteúdo.`,
          keywords: ['viral', 'trending', 'engagement', 'youtube'],
          topChannels: ['Canal Exemplo 1', 'Canal Exemplo 2', 'Canal Exemplo 3']
        });
      }
    } catch (error) {
      console.error('Error fetching niche details:', error);
      setNicheDetails({
        ...niche,
        description: `O nicho "${niche.name}" está em alta com crescimento de ${niche.growth}.`,
        keywords: ['viral', 'trending'],
        topChannels: ['Canal Exemplo']
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredNiches = niches.filter(n => 
    n.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  placeholder="Buscar nichos ou descreva seu interesse..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-secondary border-border"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Buscar
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNiches.map((niche, index) => (
              <Card key={index} className="p-5 hover:border-primary/50 transition-colors">
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
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-border text-foreground hover:bg-secondary"
                  onClick={() => handleExplore(niche)}
                >
                  Explorar
                </Button>
              </Card>
            ))}
          </div>

          <Dialog open={!!selectedNiche} onOpenChange={() => setSelectedNiche(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-primary" />
                  {selectedNiche?.name}
                </DialogTitle>
              </DialogHeader>
              
              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : nicheDetails && (
                <div className="space-y-4 mt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-success">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium">{nicheDetails.growth}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Video className="w-4 h-4" />
                      <span>{nicheDetails.videos} vídeos</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-2">Descrição</h4>
                    <p className="text-sm text-muted-foreground">{nicheDetails.description}</p>
                  </div>

                  {nicheDetails.keywords && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Palavras-chave</h4>
                      <div className="flex flex-wrap gap-2">
                        {nicheDetails.keywords.map((kw, i) => (
                          <span key={i} className="px-2 py-1 bg-secondary text-sm rounded-md text-foreground">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {nicheDetails.topChannels && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Canais de Referência</h4>
                      <ul className="space-y-1">
                        {nicheDetails.topChannels.map((channel, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {channel}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button className="w-full bg-primary text-primary-foreground">
                    Gerar Ideias de Conteúdo
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </MainLayout>
  );
};

export default ExploreNiche;
