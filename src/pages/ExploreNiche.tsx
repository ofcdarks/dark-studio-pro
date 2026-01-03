import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Zap, 
  Loader2, 
  Target, 
  TrendingUp, 
  Users, 
  Lightbulb, 
  ChevronDown, 
  DollarSign, 
  BarChart3,
  Rocket,
  Award,
  Clock,
  Calendar,
  CheckCircle,
  Search,
  Star,
  Hash,
  Copy,
  Check,
  Globe,
  FileText,
  Layers
} from "lucide-react";
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
  demandScore?: number;
  competitionScore?: number;
  opportunityScore?: number;
  contentIdeas?: string[];
  keywords?: string[];
  monetizationPotential?: string;
  growthTrend?: string;
  entryDifficulty?: string;
  audienceSize?: string;
  avgViews?: string;
  topChannels?: string[];
  microNiche?: string;
  exampleTitles?: string[];
  targetCountries?: string[];
}

interface StrategicPlan {
  channelName?: string;
  niche?: string;
  strategy: string;
  contentIdeas: string[];
  differentials: string[];
  recommendations: string[];
  positioning?: string;
  uniqueValue?: string;
  postingSchedule?: string;
  growthTimeline?: string;
  quickWins?: string[];
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
}

const ExploreNiche = () => {
  // Etapa 1 states
  const [mainNiche, setMainNiche] = usePersistedState("explore_mainNiche", "");
  const [competitorSubniche, setCompetitorSubniche] = usePersistedState("explore_competitorSubniche", "");
  const [subnicheModel, setSubnicheModel] = usePersistedState("explore_subnicheModel", "gpt-4o");
  const [subnicheResults, setSubnicheResults] = usePersistedState<SubnicheResult[]>("explore_subnicheResults", []);
  const [loadingSubniches, setLoadingSubniches] = useState(false);
  const [expandedSubniche, setExpandedSubniche] = useState<number | null>(null);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  // Etapa 2 states
  const [channelUrl, setChannelUrl] = usePersistedState("explore_channelUrl", "");
  const [channelModel, setChannelModel] = usePersistedState("explore_channelModel", "gpt-4o");
  const [strategicPlan, setStrategicPlan] = usePersistedState<StrategicPlan | null>("explore_strategicPlan", null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const copyKeyword = (keyword: string) => {
    navigator.clipboard.writeText(keyword);
    setCopiedKeyword(keyword);
    toast.success("Palavra-chave copiada!");
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-success";
    if (score >= 5) return "text-primary";
    return "text-destructive";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 8) return "bg-success";
    if (score >= 5) return "bg-primary";
    return "bg-destructive";
  };

  const normalizeCountryName = (value: string) => {
    const trimmed = value.trim();
    const withoutCode = trimmed.replace(/^[a-z]{2}\s+/i, "");
    return withoutCode
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  };

  const getCountryBadgeClass = (country: string) => {
    const name = normalizeCountryName(country);

    const toneMap: Record<string, "success" | "primary" | "destructive" | "secondary"> = {
      brasil: "success",
      mexico: "success",
      italia: "success",

      alemanha: "primary",
      india: "primary",
      espanha: "primary",

      turquia: "destructive",
      canada: "destructive",
      japao: "destructive",
      portugal: "destructive",
      "reino unido": "destructive",
      eua: "destructive",
      usa: "destructive",
      "estados unidos": "destructive",

      argentina: "primary",
      "coreia do sul": "primary",
      franca: "primary",
    };

    const tone = toneMap[name] ?? "secondary";

    if (tone === "success") return "!bg-success/20 !text-success !border-success/30";
    if (tone === "primary") return "!bg-primary/20 !text-primary !border-primary/30";
    if (tone === "destructive") return "!bg-destructive/20 !text-destructive !border-destructive/30";
    return "!bg-secondary/50 !text-foreground !border-border/50";
  };

  const getPotentialBadge = (potential: string) => {
    if (potential === "Muito Alto") {
      return "bg-success text-success-foreground border-0";
    }
    if (potential === "Alto") {
      return "bg-success/80 text-success-foreground border-0";
    }
    if (potential === "Médio") {
      return "bg-primary text-primary-foreground border-0";
    }
    return "bg-muted text-muted-foreground border-0";
  };

  const getCompetitionBadge = (competition: string) => {
    if (competition === "Muito Baixa") {
      return "bg-success text-success-foreground border-0";
    }
    if (competition === "Baixa") {
      return "bg-success/80 text-success-foreground border-0";
    }
    if (competition === "Média") {
      return "bg-primary text-primary-foreground border-0";
    }
    return "bg-destructive text-destructive-foreground border-0";
  };

  const handleFindSubniches = async () => {
    if (!mainNiche.trim()) {
      toast.error("Digite o nicho principal");
      return;
    }

    setLoadingSubniches(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'find_subniches',
          niche: mainNiche,
          text: competitorSubniche,
          model: subnicheModel
        }
      });

      if (error) throw error;

      const result = data.result;
      if (result?.subniches) {
        setSubnicheResults(result.subniches);
        toast.success(`${result.subniches.length} subnichos encontrados!`);
      } else if (Array.isArray(result)) {
        setSubnicheResults(result);
        toast.success(`${result.length} subnichos encontrados!`);
      } else {
        throw new Error("Formato de resposta inválido");
      }
    } catch (error) {
      console.error('Error finding subniches:', error);
      toast.error('Erro ao buscar subnichos. Usando sugestões padrão.');
      setSubnicheResults([
        {
          name: `${mainNiche} - Histórias Não Contadas`,
          potential: "Alto",
          competition: "Baixa",
          description: "Foco em histórias pouco conhecidas dentro do nicho principal, explorando narrativas únicas e intrigantes que capturam a atenção do público.",
          demandScore: 8,
          competitionScore: 3,
          opportunityScore: 9,
          contentIdeas: ["Top 10 histórias esquecidas", "O que ninguém conta sobre...", "Revelações surpreendentes", "A verdade por trás de...", "Segredos históricos revelados"],
          keywords: ["história secreta", "revelações", "verdade oculta", "fatos desconhecidos", "mistérios"],
          monetizationPotential: "Alto",
          growthTrend: "📈 Em alta",
          audienceSize: "500K-1M",
          avgViews: "50K-100K",
          microNiche: "Segredos e Mistérios Históricos",
          exampleTitles: [
            `O Segredo de ${mainNiche} Que NINGUÉM Te Contou`,
            `A Verdade CHOCANTE Por Trás de ${mainNiche}`,
            `5 Histórias PROIBIDAS de ${mainNiche} Reveladas`
          ],
          targetCountries: ["🇧🇷 Brasil", "🇵🇹 Portugal", "🇺🇸 EUA (Espanhol)"]
        },
        {
          name: `${mainNiche} - Para Iniciantes`,
          potential: "Muito Alto",
          competition: "Média",
          description: "Conteúdo educacional introdutório para novatos, guias passo a passo e explicações simplificadas para quem está começando.",
          demandScore: 9,
          competitionScore: 5,
          opportunityScore: 8,
          contentIdeas: ["Guia completo para iniciantes", "Primeiros passos em...", "Erros comuns de iniciantes", "O básico que você precisa saber", "Por onde começar?"],
          keywords: ["iniciantes", "tutorial", "como começar", "guia básico", "passo a passo"],
          monetizationPotential: "Muito Alto",
          growthTrend: "📈 Em alta",
          audienceSize: "1M-5M",
          avgViews: "100K-500K",
          microNiche: "Tutoriais e Guias Simplificados",
          exampleTitles: [
            `${mainNiche} Para INICIANTES: Guia Completo 2025`,
            `Como Começar em ${mainNiche} do ZERO (Passo a Passo)`,
            `7 Erros de INICIANTE em ${mainNiche} Que Você PRECISA Evitar`
          ],
          targetCountries: ["🇧🇷 Brasil", "🇲🇽 México", "🇦🇷 Argentina", "🇨🇴 Colômbia"]
        },
        {
          name: `${mainNiche} - Análises Profundas`,
          potential: "Médio",
          competition: "Baixa",
          description: "Análises detalhadas e investigativas que vão além da superfície, oferecendo insights únicos e perspectivas exclusivas.",
          demandScore: 6,
          competitionScore: 2,
          opportunityScore: 8,
          contentIdeas: ["Análise completa de...", "Por que isso acontece?", "A verdade sobre...", "Investigação profunda", "O que os especialistas dizem"],
          keywords: ["análise", "investigação", "estudo aprofundado", "pesquisa", "insights"],
          monetizationPotential: "Médio",
          growthTrend: "📊 Estável",
          audienceSize: "100K-500K",
          avgViews: "20K-50K",
          microNiche: "Investigações e Deep Dives",
          exampleTitles: [
            `A VERDADE Sobre ${mainNiche} Que Ninguém Fala`,
            `Eu Investiguei ${mainNiche} Por 30 Dias e Descobri ISSO`,
            `Por Que ${mainNiche} Vai MUDAR em 2025? Análise Completa`
          ],
          targetCountries: ["🇧🇷 Brasil", "🇵🇹 Portugal"]
        },
        {
          name: `${mainNiche} - Comparativos`,
          potential: "Alto",
          competition: "Média",
          description: "Vídeos de comparação entre temas, produtos ou conceitos relacionados ao nicho, ajudando o público a tomar decisões informadas.",
          demandScore: 8,
          competitionScore: 4,
          opportunityScore: 7,
          contentIdeas: ["X vs Y: Qual é melhor?", "Comparativo definitivo", "A diferença que ninguém fala", "Ranking completo", "O melhor de todos os tempos"],
          keywords: ["comparativo", "versus", "ranking", "melhor", "diferenças"],
          monetizationPotential: "Alto",
          growthTrend: "📈 Em alta",
          audienceSize: "500K-1M",
          avgViews: "80K-150K",
          microNiche: "Reviews e Batalhas",
          exampleTitles: [
            `${mainNiche} A vs B: Qual é o MELHOR? Teste Definitivo`,
            `TOP 5 Melhores de ${mainNiche} em 2025 (Ranking Atualizado)`,
            `A Diferença Entre ${mainNiche} Barato e Caro (Vale a Pena?)`
          ],
          targetCountries: ["🇧🇷 Brasil", "🇺🇸 EUA", "🇬🇧 Reino Unido", "🇮🇳 Índia"]
        },
        {
          name: `${mainNiche} - Curiosidades`,
          potential: "Muito Alto",
          competition: "Média",
          description: "Fatos curiosos, trivia e informações surpreendentes que geram engajamento e compartilhamento orgânico.",
          demandScore: 9,
          competitionScore: 5,
          opportunityScore: 8,
          contentIdeas: ["10 fatos que você não sabia", "Curiosidades surpreendentes", "Por que isso existe?", "O que a ciência diz", "Mitos desvendados"],
          keywords: ["curiosidades", "fatos", "você sabia", "surpreendente", "incrível"],
          monetizationPotential: "Alto",
          growthTrend: "🚀 Viral",
          audienceSize: "1M-10M",
          avgViews: "200K-1M",
          microNiche: "Fatos Virais e Trivia",
          exampleTitles: [
            `10 Fatos INSANOS Sobre ${mainNiche} Que Vão Te CHOCAR`,
            `Por Que ${mainNiche} Existe? A Resposta Vai Te Surpreender`,
            `Você NUNCA Vai Olhar ${mainNiche} Da Mesma Forma Depois Disso`
          ],
          targetCountries: ["🇧🇷 Brasil", "🇲🇽 México", "🇪🇸 Espanha", "🇺🇸 EUA (Latino)"]
        }
      ]);
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
          type: 'analyze_competitor_channel',
          channelUrl,
          model: channelModel
        }
      });

      if (error) throw error;

      const result = data.result;
      if (result?.strategicPlan) {
        setStrategicPlan({
          channelName: result.channelAnalysis?.name || "Canal Analisado",
          niche: result.channelAnalysis?.niche || "Nicho detectado",
          strategy: result.strategicPlan.contentStrategy || result.strategicPlan.positioning || "",
          contentIdeas: result.strategicPlan.contentIdeas || [],
          differentials: result.strategicPlan.differentials || [],
          recommendations: result.strategicPlan.recommendations || [],
          positioning: result.strategicPlan.positioning,
          uniqueValue: result.strategicPlan.uniqueValue,
          postingSchedule: result.strategicPlan.postingSchedule,
          growthTimeline: result.strategicPlan.growthTimeline,
          quickWins: result.quickWins,
          summary: result.summary,
          strengths: result.channelAnalysis?.strengths,
          weaknesses: result.channelAnalysis?.weaknesses,
          opportunities: result.opportunities,
          threats: result.threats
        });
        toast.success("Plano estratégico gerado!");
      } else {
        throw new Error("Formato de resposta inválido");
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      toast.error('Erro ao gerar plano. Usando sugestões padrão.');
      setStrategicPlan({
        channelName: "Canal Analisado",
        niche: "Nicho detectado",
        strategy: "Baseado na análise do canal, recomendamos focar em conteúdo diferenciado com maior profundidade técnica e storytelling envolvente.",
        contentIdeas: [
          "Série sobre tópicos pouco explorados",
          "Colaborações com especialistas",
          "Vídeos de reação e análise",
          "Tutoriais aprofundados",
          "Behind the scenes"
        ],
        differentials: [
          "Melhor qualidade de produção",
          "Narrativa mais envolvente",
          "Frequência de postagem consistente",
          "Edição cinematográfica",
          "Pesquisa aprofundada"
        ],
        recommendations: [
          "Postar 3x por semana",
          "Usar thumbnails impactantes",
          "Engajar nos comentários",
          "Criar séries de conteúdo",
          "Investir em SEO de vídeo"
        ],
        quickWins: [
          "Otimizar títulos e thumbnails existentes",
          "Responder a todos os comentários",
          "Criar um vídeo respondendo dúvidas comuns",
          "Fazer um compilado dos melhores momentos",
          "Criar shorts a partir de vídeos longos"
        ],
        strengths: [
          "Boa qualidade de áudio",
          "Conteúdo bem pesquisado",
          "Comunidade engajada"
        ],
        weaknesses: [
          "Thumbnails pouco atrativas",
          "Títulos genéricos",
          "Frequência irregular"
        ],
        opportunities: [
          "Explorar shorts/reels",
          "Parcerias com outros criadores",
          "Conteúdo em outros idiomas"
        ],
        summary: "O canal tem bom potencial de crescimento. Focando em melhorar thumbnails e títulos, mantendo consistência de postagem, é possível dobrar as visualizações em 3-6 meses."
      });
    } finally {
      setLoadingPlan(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
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
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Explorador de Nichos</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Encontre subnichos promissores e analise a concorrência para dominar o YouTube.
            </p>
          </div>

          {/* Etapa 1: Encontrar um Subnicho */}
          <Card className="p-6 mb-8 border-primary/20 bg-gradient-to-br from-card to-card/80">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-bold text-lg">
                1
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Encontrar Subnichos</h2>
                <p className="text-sm text-muted-foreground">
                  Descubra oportunidades com alta demanda e baixa concorrência
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Nicho Principal *</label>
                  <Input
                    placeholder="Ex: História, Culinária, Finanças, Tecnologia"
                    value={mainNiche}
                    onChange={(e) => setMainNiche(e.target.value)}
                    className="bg-secondary/50 border-border h-12 text-base"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Subnicho concorrido (opcional)</label>
                  <Input
                    placeholder="Ex: Segunda Guerra Mundial, Receitas Fitness"
                    value={competitorSubniche}
                    onChange={(e) => setCompetitorSubniche(e.target.value)}
                    className="bg-secondary/50 border-border h-12 text-base"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-foreground">Motor de IA</label>
                    <Badge className="bg-primary/20 text-primary border-0 text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      ~6 créditos
                    </Badge>
                  </div>
                  <Select value={subnicheModel} onValueChange={setSubnicheModel}>
                    <SelectTrigger className="bg-secondary/50 border-border h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (2025)</SelectItem>
                      <SelectItem value="claude-4-sonnet">Claude 4 Sonnet</SelectItem>
                      <SelectItem value="gemini-pro">Gemini 2.5 Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleFindSubniches}
                    disabled={loadingSubniches || !mainNiche.trim()}
                    className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base font-semibold"
                  >
                    {loadingSubniches ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analisando com IA...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 mr-2" />
                        Encontrar Subnichos
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Loading Progress Indicator */}
              {loadingSubniches && (
                <div className="mt-6 p-4 bg-secondary/30 rounded-xl border border-border/30">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-sm font-medium text-foreground">Processando análise...</span>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-success" />
                      <span>Analisando demanda de mercado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 text-primary animate-spin" />
                      <span>Avaliando concorrência e oportunidades</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-50">
                      <Clock className="w-3 h-3" />
                      <span>Gerando títulos virais e micro-nichos</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-50">
                      <Globe className="w-3 h-3" />
                      <span>Identificando países recomendados</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Subnicho Results */}
            {subnicheResults.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-primary" />
                    {subnicheResults.length} Subnichos Encontrados
                  </h3>
                </div>
                
                {/* Legenda das pontuações */}
                <div className="mb-6 p-4 bg-secondary/20 rounded-xl border border-border/30">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Entenda as Pontuações
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-foreground">Demanda</span>
                        <p className="text-muted-foreground">Quanto o público busca por esse tipo de conteúdo. Maior = mais interesse.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-3 h-3 rounded-full bg-success mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-foreground">Oportunidade</span>
                        <p className="text-muted-foreground">Potencial de crescimento considerando demanda vs concorrência. Maior = melhor.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-3 h-3 rounded-full bg-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-foreground">Dificuldade</span>
                        <p className="text-muted-foreground">Quão difícil é competir nesse nicho. Menor = mais fácil de entrar.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {(() => {
                    // Calcular o vencedor (maior score combinado: demanda + oportunidade - dificuldade)
                    const winnerIndex = subnicheResults.reduce((best, curr, idx) => {
                      const currScore = (curr.demandScore || 0) + (curr.opportunityScore || 0) - (curr.competitionScore || 0);
                      const bestScore = (subnicheResults[best].demandScore || 0) + (subnicheResults[best].opportunityScore || 0) - (subnicheResults[best].competitionScore || 0);
                      return currScore > bestScore ? idx : best;
                    }, 0);
                    
                    return subnicheResults.map((sub, index) => {
                      const isWinner = index === winnerIndex;
                      return (
                      <Collapsible 
                        key={index} 
                        open={expandedSubniche === index}
                        onOpenChange={() => setExpandedSubniche(expandedSubniche === index ? null : index)}
                      >
                        <div className={`bg-secondary/30 rounded-xl border overflow-hidden transition-colors ${isWinner ? 'border-success/50 ring-2 ring-success/20' : 'border-border/50 hover:border-primary/30'}`}>
                        <CollapsibleTrigger className="w-full cursor-pointer group/trigger">
                          <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm text-muted-foreground font-medium">#{index + 1}</span>
                                  {isWinner && (
                                    <Badge className="bg-success/20 text-success border-success/30 text-xs px-2 py-0.5">
                                      <Award className="w-3 h-3 mr-1" />
                                      Melhor Escolha
                                    </Badge>
                                  )}
                                  {sub.growthTrend && (
                                    <Badge className="bg-primary/20 text-primary border-0 text-xs">
                                      {sub.growthTrend}
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="font-bold text-foreground text-xl text-left">{sub.name}</h4>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge className={`${getPotentialBadge(sub.potential)} text-sm px-3 py-1.5`}>
                                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                                  {sub.potential}
                                </Badge>
                                <Badge className={`${getCompetitionBadge(sub.competition)} text-sm px-3 py-1.5`}>
                                  <Users className="w-3.5 h-3.5 mr-1" />
                                  {sub.competition}
                                </Badge>
                                <ChevronDown className={`w-6 h-6 text-muted-foreground transition-transform duration-200 group-hover/trigger:text-primary ${expandedSubniche === index ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                            
                            <p className="text-base text-muted-foreground text-left mb-5 leading-relaxed">{sub.description}</p>
                            
                            {/* Scores Row */}
                            {(sub.demandScore || sub.opportunityScore || sub.competitionScore) && (
                              <div className="grid grid-cols-3 gap-6 mb-4">
                                {sub.demandScore !== undefined && sub.demandScore !== null && (
                                  <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-sm text-muted-foreground">Demanda</span>
                                      <span className={`text-base font-bold ${getScoreColor(sub.demandScore)}`}>{sub.demandScore}/10</span>
                                    </div>
                                    <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full transition-all rounded-full"
                                        style={{ 
                                          width: `${sub.demandScore * 10}%`,
                                          backgroundColor:
                                            sub.demandScore >= 8
                                              ? "hsl(var(--success))"
                                              : sub.demandScore >= 5
                                                ? "hsl(var(--primary))"
                                                : "hsl(var(--destructive))",
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                                {sub.opportunityScore !== undefined && sub.opportunityScore !== null && (
                                  <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-sm text-muted-foreground">Oportunidade</span>
                                      <span className={`text-base font-bold ${getScoreColor(sub.opportunityScore)}`}>{sub.opportunityScore}/10</span>
                                    </div>
                                    <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full transition-all rounded-full"
                                        style={{ 
                                          width: `${sub.opportunityScore * 10}%`,
                                          backgroundColor:
                                            sub.opportunityScore >= 8
                                              ? "hsl(var(--success))"
                                              : sub.opportunityScore >= 5
                                                ? "hsl(var(--primary))"
                                                : "hsl(var(--destructive))",
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                                {sub.competitionScore !== undefined && sub.competitionScore !== null && (
                                  <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-sm text-muted-foreground">Dificuldade</span>
                                      <span className={`text-base font-bold ${getScoreColor(10 - sub.competitionScore)}`}>{sub.competitionScore}/10</span>
                                    </div>
                                    <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full transition-all rounded-full"
                                        style={{ 
                                          width: `${sub.competitionScore * 10}%`,
                                          backgroundColor:
                                            (10 - sub.competitionScore) >= 8
                                              ? "hsl(var(--success))"
                                              : (10 - sub.competitionScore) >= 5
                                                ? "hsl(var(--primary))"
                                                : "hsl(var(--destructive))",
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Expand indicator */}
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground group-hover/trigger:text-primary transition-colors">
                              <span>{expandedSubniche === index ? 'Clique para recolher' : 'Clique para ver detalhes'}</span>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="px-5 pb-5 pt-2 border-t border-border/30">
                            {/* Micro-Nicho */}
                            {sub.microNiche && (
                              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                                <div className="flex items-center gap-2 mb-1">
                                  <Layers className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-semibold text-primary">Micro-Nicho Específico</span>
                                </div>
                                <p className="text-sm font-medium text-foreground">{sub.microNiche}</p>
                              </div>
                            )}
                            
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                              {sub.monetizationPotential && (
                                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                                  <DollarSign className="w-4 h-4 text-primary mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">Monetização</p>
                                  <p className="text-sm font-semibold text-foreground">{sub.monetizationPotential}</p>
                                </div>
                              )}
                              {sub.audienceSize && (
                                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                                  <Users className="w-4 h-4 text-primary mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">Audiência</p>
                                  <p className="text-sm font-semibold text-foreground">{sub.audienceSize}</p>
                                </div>
                              )}
                              {sub.avgViews && (
                                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                                  <BarChart3 className="w-4 h-4 text-primary mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">Views Médias</p>
                                  <p className="text-sm font-semibold text-foreground">{sub.avgViews}</p>
                                </div>
                              )}
                              {sub.entryDifficulty && (
                                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                                  <Target className="w-4 h-4 text-primary mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">Entrada</p>
                                  <p className="text-sm font-semibold text-foreground">{sub.entryDifficulty}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Target Countries */}
                            {sub.targetCountries && sub.targetCountries.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-primary" />
                                  Países Recomendados para Iniciar
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {sub.targetCountries.map((country, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className={`${getCountryBadgeClass(country)} text-sm px-3 py-1.5 font-medium`}
                                    >
                                      {country}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Example Titles */}
                            {sub.exampleTitles && sub.exampleTitles.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-primary" />
                                  Exemplos de Títulos Virais
                                </h5>
                                <div className="space-y-2">
                                  {sub.exampleTitles.map((title, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2 text-sm bg-success/10 border border-success/20 rounded-lg px-3 py-2 group">
                                      <div className="flex items-start gap-2">
                                        <span className="text-success font-bold flex-shrink-0">#{i + 1}</span>
                                        <span className="text-foreground">{title}</span>
                                      </div>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          copyKeyword(title);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-success/20 rounded"
                                      >
                                        {copiedKeyword === title ? (
                                          <Check className="w-4 h-4 text-success" />
                                        ) : (
                                          <Copy className="w-4 h-4 text-muted-foreground" />
                                        )}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Content Ideas */}
                            {sub.contentIdeas && sub.contentIdeas.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                  <Lightbulb className="w-4 h-4 text-primary" />
                                  Ideias de Conteúdo
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {sub.contentIdeas.map((idea, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
                                      <Star className="w-3 h-3 text-primary flex-shrink-0" />
                                      {idea}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Keywords */}
                            {sub.keywords && sub.keywords.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                  <Hash className="w-4 h-4 text-primary" />
                                  Palavras-chave (clique para copiar)
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {sub.keywords.map((kw, i) => (
                                    <button
                                      key={i}
                                      onClick={() => copyKeyword(kw)}
                                      className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                                    >
                                      {copiedKeyword === kw ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                      {kw}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                      );
                    })
                  })()}
                </div>
              </div>
            )}
          </Card>

          {/* Etapa 2: Analisar Canal Concorrente */}
          <Card className="p-6 border-blue-500/20 bg-gradient-to-br from-card to-card/80">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 font-bold text-lg">
                2
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Analisar Concorrência</h2>
                <p className="text-sm text-muted-foreground">
                  Obtenha um plano estratégico baseado em um canal de sucesso
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">URL do Canal Concorrente *</label>
                <Input
                  placeholder="https://www.youtube.com/@canaldesucesso"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="bg-secondary/50 border-border h-12 text-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-foreground">Motor de IA</label>
                    <Badge className="bg-blue-500/20 text-blue-500 border-0 text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      ~8 créditos
                    </Badge>
                  </div>
                  <Select value={channelModel} onValueChange={setChannelModel}>
                    <SelectTrigger className="bg-secondary/50 border-border h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (2025)</SelectItem>
                      <SelectItem value="claude-4-sonnet">Claude 4 Sonnet</SelectItem>
                      <SelectItem value="gemini-pro">Gemini 2.5 Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleGeneratePlan}
                    disabled={loadingPlan || !channelUrl.trim()}
                    className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 h-12 px-8 text-base font-semibold"
                  >
                    {loadingPlan ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Gerar Plano Estratégico
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Strategic Plan Results */}
            {strategicPlan && (
              <div className="mt-8 space-y-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  Plano Estratégico
                </h3>
                
                {/* Summary Card */}
                {strategicPlan.summary && (
                  <div className="p-5 bg-gradient-to-r from-blue-500/10 to-primary/10 rounded-xl border border-blue-500/20">
                    <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                      <Rocket className="w-4 h-4" />
                      Resumo Executivo
                    </h4>
                    <p className="text-foreground">{strategicPlan.summary}</p>
                  </div>
                )}

                {/* SWOT Analysis */}
                {(strategicPlan.strengths || strategicPlan.weaknesses || strategicPlan.opportunities) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {strategicPlan.strengths && (
                      <div className="p-4 bg-success/10 rounded-xl border border-success/20">
                        <h5 className="font-semibold text-success mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Pontos Fortes
                        </h5>
                        <ul className="space-y-2">
                          {strategicPlan.strengths.map((item, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-success mt-0.5">•</span>
                              {typeof item === 'string' ? item : (item as any)?.description || (item as any)?.type || JSON.stringify(item)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {strategicPlan.weaknesses && (
                      <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                        <h5 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Pontos Fracos
                        </h5>
                        <ul className="space-y-2">
                          {strategicPlan.weaknesses.map((item, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-destructive mt-0.5">•</span>
                              {typeof item === 'string' ? item : (item as any)?.description || (item as any)?.type || JSON.stringify(item)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {strategicPlan.opportunities && (
                      <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                        <h5 className="font-semibold text-primary mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Oportunidades
                        </h5>
                        <ul className="space-y-2">
                          {strategicPlan.opportunities.map((item, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              {typeof item === 'string' ? item : (item as any)?.description || (item as any)?.type || JSON.stringify(item)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {strategicPlan.threats && (
                      <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                        <h5 className="font-semibold text-orange-500 mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Ameaças
                        </h5>
                        <ul className="space-y-2">
                          {strategicPlan.threats.map((item, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-orange-500 mt-0.5">•</span>
                              {typeof item === 'string' ? item : (item as any)?.description || (item as any)?.type || JSON.stringify(item)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Wins */}
                {strategicPlan.quickWins && strategicPlan.quickWins.length > 0 && (
                  <div className="p-5 bg-success/10 rounded-xl border border-success/20">
                    <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Ações Imediatas (Quick Wins)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {strategicPlan.quickWins.map((win, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-foreground bg-success/5 rounded-lg px-3 py-2">
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                          {typeof win === 'string' ? win : (win as any)?.description || (win as any)?.type || JSON.stringify(win)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strategy */}
                <div className="p-5 bg-secondary/30 rounded-xl border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Estratégia Principal
                  </h4>
                  <p className="text-muted-foreground mb-4">{strategicPlan.strategy}</p>
                  
                  {strategicPlan.uniqueValue && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <p className="text-xs text-muted-foreground mb-1">Proposta de Valor Única:</p>
                      <p className="text-foreground font-medium">{strategicPlan.uniqueValue}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Content Ideas */}
                  <div className="p-5 bg-secondary/30 rounded-xl border border-border/50">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      Ideias de Conteúdo
                    </h4>
                    <ul className="space-y-2">
                      {strategicPlan.contentIdeas.map((idea, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Star className="w-3 h-3 text-primary mt-1 flex-shrink-0" />
                          {idea}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Differentials */}
                  <div className="p-5 bg-secondary/30 rounded-xl border border-border/50">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      Diferenciais a Explorar
                    </h4>
                    <ul className="space-y-2">
                      {strategicPlan.differentials.map((diff, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-success mt-1 flex-shrink-0" />
                          {diff}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-5 bg-secondary/30 rounded-xl border border-border/50">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Recomendações de Execução
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {strategicPlan.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                        <span className="text-primary">•</span>
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Schedule & Growth */}
                {(strategicPlan.postingSchedule || strategicPlan.growthTimeline) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {strategicPlan.postingSchedule && (
                      <div className="p-5 bg-secondary/30 rounded-xl border border-border/50">
                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          Agenda de Postagem
                        </h4>
                        <p className="text-muted-foreground">{strategicPlan.postingSchedule}</p>
                      </div>
                    )}
                    {strategicPlan.growthTimeline && (
                      <div className="p-5 bg-secondary/30 rounded-xl border border-border/50">
                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          Expectativa de Crescimento
                        </h4>
                        <p className="text-muted-foreground">{strategicPlan.growthTimeline}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default ExploreNiche;
