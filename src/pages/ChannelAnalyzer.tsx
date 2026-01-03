import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Plus, 
  Loader2, 
  X, 
  BarChart3, 
  Lightbulb,
  Copy,
  Star,
  Sparkles,
  Youtube,
  Target,
  Zap
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface ChannelToAnalyze {
  id: string;
  url: string;
  niche: string;
  subniche: string;
  isAnalyzed: boolean;
  channelName?: string;
  subscribers?: string;
  topVideos?: Array<{
    title: string;
    views: string;
    formula?: string;
  }>;
}

interface AnalysisResult {
  gapAnalysis: {
    gaps: string[];
    opportunities: string[];
  };
  optimizedTitles: Array<{
    title: string;
    formula: string;
    explanation: string;
    score: number;
  }>;
  channelIdeas: Array<{
    name: string;
    concept: string;
    niche: string;
    firstVideos: string[];
  }>;
  patternsMixed: string[];
}

const ChannelAnalyzer = () => {
  const { user } = useAuth();
  
  // Persisted states
  const [channels, setChannels] = usePersistedState<ChannelToAnalyze[]>("channelAnalyzer_channels", []);
  const [analysisResult, setAnalysisResult] = usePersistedState<AnalysisResult | null>("channelAnalyzer_result", null);
  
  // Non-persisted states
  const [newChannelUrl, setNewChannelUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzingChannel, setAnalyzingChannel] = useState<string | null>(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("gaps");

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleAddChannel = () => {
    if (!newChannelUrl.trim()) {
      toast.error("Cole a URL de um canal para adicionar");
      return;
    }

    if (channels.length >= 5) {
      toast.error("Limite máximo de 5 canais atingido");
      return;
    }

    // Check if URL is valid YouTube channel URL
    const isValidUrl = newChannelUrl.includes('youtube.com/') || newChannelUrl.includes('youtu.be/');
    if (!isValidUrl) {
      toast.error("URL inválida. Cole uma URL de canal do YouTube");
      return;
    }

    // Check if channel already added
    const exists = channels.some(ch => ch.url.toLowerCase() === newChannelUrl.toLowerCase());
    if (exists) {
      toast.error("Este canal já foi adicionado");
      return;
    }

    const newChannel: ChannelToAnalyze = {
      id: generateId(),
      url: newChannelUrl,
      niche: "",
      subniche: "",
      isAnalyzed: false
    };

    setChannels([...channels, newChannel]);
    setNewChannelUrl("");
    toast.success("Canal adicionado! Clique em 'Analisar' quando estiver pronto.");
  };

  const handleRemoveChannel = (id: string) => {
    setChannels(channels.filter(ch => ch.id !== id));
    toast.success("Canal removido");
  };

  const handleAnalyzeChannel = async (channel: ChannelToAnalyze) => {
    setAnalyzingChannel(channel.id);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-channel', {
        body: {
          channelUrl: channel.url,
          userId: user?.id
        }
      });

      if (error) throw error;

      // Check for error in response
      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      // Extract analysis data
      const analysis = data.analysis || {};
      const channelInfo = analysis.channelInfo || {};
      const insights = analysis.insights || {};

      // Update the channel with analysis data
      setChannels(prev => prev.map(ch => {
        if (ch.id === channel.id) {
          return {
            ...ch,
            isAnalyzed: true,
            niche: channelInfo.niche || "Detectado",
            subniche: channelInfo.subniche || "Detectado",
            channelName: channelInfo.name || channel.url.split('/').pop() || 'Canal',
            subscribers: analysis.metrics?.subscribers 
              ? `${(analysis.metrics.subscribers / 1000).toFixed(0)}K`
              : undefined,
            topVideos: insights.exampleTitles?.map((title: string) => ({
              title,
              views: "N/A"
            })) || []
          };
        }
        return ch;
      }));

      toast.success(`Canal "${channelInfo.name || 'Canal'}" analisado com sucesso!`);
    } catch (error) {
      console.error('Error analyzing channel:', error);
      toast.error('Erro ao analisar canal. Verifique a URL.');
    } finally {
      setAnalyzingChannel(null);
    }
  };

  const handleGenerateFullAnalysis = async () => {
    const analyzedChannels = channels.filter(ch => ch.isAnalyzed);
    
    if (analyzedChannels.length < 2) {
      toast.error("Analise pelo menos 2 canais antes de gerar a análise completa");
      return;
    }

    setGeneratingAnalysis(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'analyze_multiple_channels',
          agentData: {
            channels: analyzedChannels.map(ch => ({
              name: ch.channelName,
              url: ch.url,
              niche: ch.niche,
              subniche: ch.subniche,
              subscribers: ch.subscribers,
              topVideos: ch.topVideos
            }))
          },
          userId: user?.id
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      // Extract result from response
      const result = data?.result || data;
      setAnalysisResult(result);
      toast.success("Análise completa gerada com sucesso!");
    } catch (error) {
      console.error('Error generating analysis:', error);
      toast.error('Erro ao gerar análise. Tente novamente.');
    } finally {
      setGeneratingAnalysis(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const analyzedCount = channels.filter(ch => ch.isAnalyzed).length;

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Session Indicator */}
          <SessionIndicator 
            storageKeys={["channelAnalyzer_channels", "channelAnalyzer_result"]}
            label="Análise anterior"
            onClear={() => {
              setChannels([]);
              setAnalysisResult(null);
            }}
          />

          {/* Header */}
          <div className="mb-8 mt-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📊</span>
              <h1 className="text-3xl font-bold text-foreground">Análise de Canais Virais</h1>
            </div>
            <p className="text-muted-foreground">
              Analise até 5 canais, identifique padrões virais e crie títulos baseados no que funcionou
            </p>
          </div>

          {/* Add Channel Form */}
          <Card className="p-6 mb-6 border-primary/30">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Adicionar Canal para Análise</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">URL do Canal</label>
                <Input
                  placeholder="https://youtube.com/@canal ou https://..."
                  value={newChannelUrl}
                  onChange={(e) => setNewChannelUrl(e.target.value)}
                  className="bg-secondary border-border"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChannel()}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Nicho <span className="text-muted-foreground/60">(detectado após análise)</span>
                </label>
                <Input
                  placeholder="Será detectado automaticamente ap..."
                  disabled
                  className="bg-secondary/50 border-border"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Subnicho <span className="text-muted-foreground/60">(detectado após análise)</span>
                </label>
                <Input
                  placeholder="Será detectado automaticamente ap..."
                  disabled
                  className="bg-secondary/50 border-border"
                />
              </div>
            </div>

            <Button 
              onClick={handleAddChannel}
              disabled={channels.length >= 5}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Canal
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              Você pode adicionar até 5 canais para análise simultânea. O nicho e subnicho serão detectados automaticamente após a análise do canal, trazendo informações mais precisas.
            </p>
          </Card>

          {/* Channels List */}
          {channels.length > 0 && (
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-500" />
                  Canais Adicionados ({channels.length}/5)
                </h2>
                <Badge variant="outline" className="border-primary/50">
                  {analyzedCount} de {channels.length} analisados
                </Badge>
              </div>

              <div className="space-y-3">
                {channels.map((channel) => (
                  <div 
                    key={channel.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      channel.isAnalyzed 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-secondary/50 border-border'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                          <Youtube className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {channel.channelName || channel.url}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {channel.isAnalyzed ? (
                              <>
                                <span className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  {channel.niche}
                                </span>
                                <span className="text-muted-foreground/50">•</span>
                                <span>{channel.subniche}</span>
                                {channel.subscribers && (
                                  <>
                                    <span className="text-muted-foreground/50">•</span>
                                    <span>{channel.subscribers} inscritos</span>
                                  </>
                                )}
                              </>
                            ) : (
                              <span className="text-amber-500">Aguardando análise...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {channel.isAnalyzed ? (
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                          ✓ Analisado
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAnalyzeChannel(channel)}
                          disabled={analyzingChannel === channel.id}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {analyzingChannel === channel.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Analisando...
                            </>
                          ) : (
                            <>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Analisar
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveChannel(channel.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {analyzedCount >= 2 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <Button
                    onClick={handleGenerateFullAnalysis}
                    disabled={generatingAnalysis}
                    className="w-full bg-gradient-to-r from-primary to-amber-500 text-primary-foreground hover:opacity-90"
                    size="lg"
                  >
                    {generatingAnalysis ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Gerando Análise Completa...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Gerar Análise Completa com IA
                      </>
                    )}
                  </Button>
                  
                  {generatingAnalysis && (
                    <Progress value={progress} className="mt-3 h-2" />
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Empty State */}
          {channels.length === 0 && !analysisResult && (
            <Card className="p-12 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Analise a viralidade</h3>
              <p className="text-muted-foreground">
                Cole a URL de um vídeo para descobrir seu potencial viral
              </p>
            </Card>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Resultado da Análise</h2>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="gaps" className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Lacunas & Oportunidades
                  </TabsTrigger>
                  <TabsTrigger value="titles" className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Títulos Otimizados
                  </TabsTrigger>
                  <TabsTrigger value="ideas" className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Ideias de Canal
                  </TabsTrigger>
                </TabsList>

                {/* Gaps & Opportunities Tab */}
                <TabsContent value="gaps" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-red-500" />
                        Lacunas Identificadas
                      </h3>
                      <ul className="space-y-2">
                        {analysisResult.gapAnalysis?.gaps?.map((gap, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-green-500" />
                        Oportunidades
                      </h3>
                      <ul className="space-y-2">
                        {analysisResult.gapAnalysis?.opportunities?.map((opp, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {opp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {analysisResult.patternsMixed && analysisResult.patternsMixed.length > 0 && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        Padrões Identificados nos Canais
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.patternsMixed.map((pattern, index) => (
                          <Badge key={index} variant="secondary" className="bg-primary/20">
                            {pattern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Optimized Titles Tab */}
                <TabsContent value="titles" className="space-y-4">
                  {analysisResult.optimizedTitles?.map((title, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-primary/20 text-primary">
                              <Star className="w-3 h-3 mr-1" />
                              {title.score}/100
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {title.formula}
                            </Badge>
                          </div>
                          <p className="font-medium text-foreground mb-2">{title.title}</p>
                          <p className="text-xs text-muted-foreground">{title.explanation}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(title.title)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                {/* Channel Ideas Tab */}
                <TabsContent value="ideas" className="space-y-6">
                  {analysisResult.channelIdeas?.map((idea, index) => (
                    <div 
                      key={index}
                      className="p-5 rounded-lg bg-gradient-to-br from-primary/10 to-amber-500/10 border border-primary/30"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Lightbulb className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{idea.name}</h3>
                          <Badge variant="outline" className="text-xs">{idea.niche}</Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">{idea.concept}</p>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-500" />
                          5 Primeiros Vídeos:
                        </h4>
                        <ol className="space-y-2">
                          {idea.firstVideos?.map((video, vIndex) => (
                            <li 
                              key={vIndex}
                              className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded bg-background/50"
                            >
                              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                                {vIndex + 1}
                              </span>
                              <span className="flex-1">{video}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => copyToClipboard(video)}
                                className="w-6 h-6 text-muted-foreground hover:text-primary"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ChannelAnalyzer;
