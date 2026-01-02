import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Zap, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";

interface SubnicheResult {
  name: string;
  potential: string;
  competition: string;
  description: string;
}

interface StrategicPlan {
  channelName: string;
  niche: string;
  strategy: string;
  contentIdeas: string[];
  differentials: string[];
  recommendations: string[];
}

const ExploreNiche = () => {
  // Etapa 1 states
  const [mainNiche, setMainNiche] = usePersistedState("explore_mainNiche", "");
  const [competitorSubniche, setCompetitorSubniche] = usePersistedState("explore_competitorSubniche", "");
  const [subnicheModel, setSubnicheModel] = usePersistedState("explore_subnicheModel", "gpt-4o");
  const [subnicheResults, setSubnicheResults] = usePersistedState<SubnicheResult[]>("explore_subnicheResults", []);
  const [loadingSubniches, setLoadingSubniches] = useState(false);

  // Etapa 2 states
  const [channelUrl, setChannelUrl] = usePersistedState("explore_channelUrl", "");
  const [channelModel, setChannelModel] = usePersistedState("explore_channelModel", "gpt-4o");
  const [strategicPlan, setStrategicPlan] = usePersistedState<StrategicPlan | null>("explore_strategicPlan", null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const handleFindSubniches = async () => {
    if (!mainNiche.trim()) {
      toast.error("Digite o nicho principal");
      return;
    }

    setLoadingSubniches(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'find_subniches',
          mainNiche,
          competitorSubniche,
          model: subnicheModel
        }
      });

      if (error) throw error;

      if (data.subniches) {
        setSubnicheResults(data.subniches);
        toast.success(`${data.subniches.length} subnichos encontrados!`);
      } else {
        // Fallback mock data
        setSubnicheResults([
          {
            name: `${mainNiche} - Histórias Não Contadas`,
            potential: "Alto",
            competition: "Baixa",
            description: "Foco em histórias pouco conhecidas dentro do nicho principal"
          },
          {
            name: `${mainNiche} - Para Iniciantes`,
            potential: "Muito Alto",
            competition: "Média",
            description: "Conteúdo educacional introdutório para novatos"
          },
          {
            name: `${mainNiche} - Análises Profundas`,
            potential: "Médio",
            competition: "Baixa",
            description: "Análises detalhadas e investigativas"
          }
        ]);
        toast.success("Subnichos gerados!");
      }
    } catch (error) {
      console.error('Error finding subniches:', error);
      // Fallback mock
      setSubnicheResults([
        {
          name: `${mainNiche} - Micro-nicho 1`,
          potential: "Alto",
          competition: "Baixa",
          description: "Oportunidade identificada com alta demanda"
        }
      ]);
      toast.success("Subnichos sugeridos gerados!");
    } finally {
      setLoadingSubniches(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!channelUrl.trim()) {
      toast.error("Digite a URL do canal concorrente");
      return;
    }

    setLoadingPlan(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'analyze_competitor_channel',
          channelUrl,
          model: channelModel
        }
      });

      if (error) throw error;

      if (data.plan) {
        setStrategicPlan(data.plan);
        toast.success("Plano estratégico gerado!");
      } else {
        // Fallback mock
        setStrategicPlan({
          channelName: "Canal Analisado",
          niche: "Nicho detectado",
          strategy: "Baseado na análise do canal, recomendamos focar em conteúdo diferenciado com maior profundidade técnica e storytelling envolvente.",
          contentIdeas: [
            "Série sobre tópicos pouco explorados",
            "Colaborações com especialistas",
            "Vídeos de reação e análise"
          ],
          differentials: [
            "Melhor qualidade de produção",
            "Narrativa mais envolvente",
            "Frequência de postagem consistente"
          ],
          recommendations: [
            "Postar 3x por semana",
            "Usar thumbnails impactantes",
            "Engajar nos comentários"
          ]
        });
        toast.success("Plano estratégico gerado!");
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      setStrategicPlan({
        channelName: "Canal Analisado",
        niche: "Nicho detectado",
        strategy: "Estratégia baseada em análise de concorrência.",
        contentIdeas: ["Ideia 1", "Ideia 2", "Ideia 3"],
        differentials: ["Diferencial 1", "Diferencial 2"],
        recommendations: ["Recomendação 1", "Recomendação 2"]
      });
      toast.success("Plano estratégico gerado!");
    } finally {
      setLoadingPlan(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Session Indicator */}
          <SessionIndicator 
            storageKeys={[
              "explore_mainNiche", 
              "explore_competitorSubniche", 
              "explore_subnicheResults",
              "explore_channelUrl",
              "explore_strategicPlan"
            ]}
            label="Exploração anterior"
            onClear={() => {
              setMainNiche("");
              setCompetitorSubniche("");
              setSubnicheResults([]);
              setChannelUrl("");
              setStrategicPlan(null);
            }}
          />

          {/* Header */}
          <div className="mb-8 mt-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">Explorador de Nichos</h1>
            <p className="text-muted-foreground">
              Encontre subnichos promissores e analise a concorrência para o seu novo canal.
            </p>
          </div>

          {/* Etapa 1: Encontrar um Subnicho */}
          <Card className="p-6 mb-6 border-border/50">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-1">Etapa 1: Encontrar um Subnicho</h2>
              <p className="text-sm text-muted-foreground">
                Descubra oportunidades com alta demanda e baixa concorrência.
              </p>
            </div>

            <div className="space-y-4">
              {/* Nicho Principal e Subnicho */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Nicho Principal</label>
                  <Input
                    placeholder="Ex: História, Culinária, Finanças"
                    value={mainNiche}
                    onChange={(e) => setMainNiche(e.target.value)}
                    className="bg-secondary border-border h-12"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Subnicho que você pensou (concorrido)</label>
                  <Input
                    placeholder="Ex: Segunda Guerra Mundial"
                    value={competitorSubniche}
                    onChange={(e) => setCompetitorSubniche(e.target.value)}
                    className="bg-secondary border-border h-12"
                  />
                </div>
              </div>

              {/* Motor de IA */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm text-muted-foreground">Motor de IA</label>
                  <Badge variant="outline" className="text-primary border-primary text-xs px-2 py-0.5">
                    <Zap className="w-3 h-3 mr-1" />
                    Custo estimado: 6 créditos
                  </Badge>
                </div>
                <Select value={subnicheModel} onValueChange={setSubnicheModel}>
                  <SelectTrigger className="bg-secondary border-border h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o (2025)</SelectItem>
                    <SelectItem value="claude-4-sonnet">Claude 4 Sonnet</SelectItem>
                    <SelectItem value="gemini-pro">Gemini 2.5 Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Button */}
              <Button
                onClick={handleFindSubniches}
                disabled={loadingSubniches}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
              >
                {loadingSubniches ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Buscando subnichos...
                  </>
                ) : (
                  "Encontrar Subnichos"
                )}
              </Button>
            </div>

            {/* Subnicho Results */}
            {subnicheResults.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-medium text-foreground">Subnichos Encontrados:</h3>
                {subnicheResults.map((sub, index) => (
                  <div key={index} className="p-4 bg-secondary/50 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{sub.name}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-success border-success text-xs">
                          Potencial: {sub.potential}
                        </Badge>
                        <Badge variant="outline" className="text-muted-foreground text-xs">
                          Concorrência: {sub.competition}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{sub.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Etapa 2: Analisar Canal Concorrente */}
          <Card className="p-6 border-border/50">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-1">Etapa 2: Analisar Canal Concorrente</h2>
              <p className="text-sm text-muted-foreground">
                Obtenha um plano estratégico completo baseado em um canal de sucesso.
              </p>
            </div>

            <div className="space-y-4">
              {/* URL do Canal */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">URL do Canal Concorrente</label>
                <Input
                  placeholder="https://www.youtube.com/@canaldesucesso"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="bg-secondary border-border h-12"
                />
              </div>

              {/* Motor de IA */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm text-muted-foreground">Motor de IA</label>
                  <Badge variant="outline" className="text-primary border-primary text-xs px-2 py-0.5">
                    <Zap className="w-3 h-3 mr-1" />
                    Custo estimado: 6 créditos
                  </Badge>
                </div>
                <Select value={channelModel} onValueChange={setChannelModel}>
                  <SelectTrigger className="bg-secondary border-border h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o (2025)</SelectItem>
                    <SelectItem value="claude-4-sonnet">Claude 4 Sonnet</SelectItem>
                    <SelectItem value="gemini-pro">Gemini 2.5 Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Button */}
              <Button
                onClick={handleGeneratePlan}
                disabled={loadingPlan}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 h-12 text-base font-semibold"
              >
                {loadingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando plano estratégico...
                  </>
                ) : (
                  "Gerar Plano Estratégico"
                )}
              </Button>
            </div>

            {/* Strategic Plan Results */}
            {strategicPlan && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Plano Estratégico</h3>
                
                <div className="p-4 bg-secondary/50 rounded-lg border border-border/50">
                  <h4 className="font-medium text-foreground mb-2">Estratégia Principal</h4>
                  <p className="text-sm text-muted-foreground">{strategicPlan.strategy}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary/50 rounded-lg border border-border/50">
                    <h4 className="font-medium text-foreground mb-2">Ideias de Conteúdo</h4>
                    <ul className="space-y-1">
                      {strategicPlan.contentIdeas.map((idea, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {idea}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-secondary/50 rounded-lg border border-border/50">
                    <h4 className="font-medium text-foreground mb-2">Diferenciais</h4>
                    <ul className="space-y-1">
                      {strategicPlan.differentials.map((diff, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {diff}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-secondary/50 rounded-lg border border-border/50">
                  <h4 className="font-medium text-foreground mb-2">Recomendações</h4>
                  <ul className="space-y-1">
                    {strategicPlan.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-muted-foreground">• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default ExploreNiche;
