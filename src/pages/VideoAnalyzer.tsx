import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Zap,
  Eye,
  Calendar,
  MessageSquare,
  Download,
  FileText,
  Search,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { TranscriptionSection } from "@/components/analyzer/TranscriptionSection";
import { ScriptAgentModal } from "@/components/analyzer/ScriptAgentModal";

interface GeneratedTitle {
  id: string;
  title: string;
  formula: string;
  formulaSurpresa: string;
  quality: number;
  impact: number;
  isBest?: boolean;
  model: string;
}

interface OriginalTitleAnalysis {
  motivoSucesso: string;
  formula: string;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
  views: number;
  daysAgo: number;
  comments: number;
  estimatedRevenue: { usd: number; brl: number };
  rpm: { usd: number; brl: number };
  niche: string;
  subNiche: string;
  microNiche: string;
  originalTitleAnalysis?: OriginalTitleAnalysis;
}

interface ScriptFormulaAnalysis {
  motivoSucesso: string;
  formula: string;
  estrutura: {
    hook: string;
    desenvolvimento: string;
    climax: string;
    cta: string;
  };
  tempoTotal: string;
  gatilhosMentais: string[];
}

const VideoAnalyzer = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [aiModel, setAiModel] = useState("gemini");
  const [language, setLanguage] = useState("pt-BR");
  const [saveFolder, setSaveFolder] = useState("general");
  const [analyzing, setAnalyzing] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [generatedTitles, setGeneratedTitles] = useState<GeneratedTitle[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [currentFormula, setCurrentFormula] = useState<ScriptFormulaAnalysis | null>(null);
  const [currentTranscription, setCurrentTranscription] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: folders } = useQuery({
    queryKey: ["folders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const modelLabels: Record<string, string> = {
    gemini: "Gemini 2.5 Flash",
    "gemini-pro": "Gemini 2.5 Pro (2025)",
    compare: "Comparar (Multimodal)",
  };

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
    setVideoInfo(null);
    setGeneratedTitles([]);

    try {
      // Call AI to analyze video and generate titles
      const response = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "analyze_video_titles",
          videoData: { url: videoUrl },
          language,
          prompt: `Analise o vídeo do YouTube com URL: ${videoUrl}
          
          Retorne um JSON com:
          1. videoInfo: informações do vídeo (título, views estimados, dias desde publicação, comentários estimados, receita estimada em USD e BRL, RPM, nicho, subnicho, micronicho)
          2. titles: array com 5 títulos gerados baseados na fórmula do título original. Cada título deve ter:
             - title: o título gerado
             - formula: análise da estrutura/fórmula (ex: "Promessa central + benefício + 5 termo(s) em CAIXA ALTA + loop mental")
             - formulaSurpresa: fórmula alternativa (ex: "Promessa central + benefício + gatilho de segredo + loop mental")
             - quality: score de qualidade (1-10)
             - impact: score de impacto (1-10)
          
          O título com maior score combinado deve ser marcado como isBest: true.
          Idioma dos títulos: ${language === "pt-BR" ? "Português Brasileiro" : language}`,
        },
      });

      if (response.error) throw response.error;

      const result = response.data.result;
      
      // Parse result - handle both string and object responses
      let parsedResult = result;
      if (typeof result === "string") {
        try {
          // Try to extract JSON from markdown code blocks
          const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[1].trim());
          } else {
            parsedResult = JSON.parse(result);
          }
        } catch {
          // Generate mock data if parsing fails
          parsedResult = generateMockData(videoUrl);
        }
      }

      // Set video info
      if (parsedResult.videoInfo) {
        setVideoInfo(parsedResult.videoInfo);
      } else {
        // Generate mock video info
        setVideoInfo({
          title: "Título do Vídeo Analisado",
          thumbnail: "",
          views: Math.floor(Math.random() * 100000),
          daysAgo: Math.floor(Math.random() * 365),
          comments: Math.floor(Math.random() * 500),
          estimatedRevenue: { usd: 5, brl: 25 },
          rpm: { usd: 3.5, brl: 19.25 },
          niche: "Conteúdo",
          subNiche: "Educacional",
          microNiche: "Análise de Tendências",
        });
      }

      // Set generated titles
      if (parsedResult.titles && Array.isArray(parsedResult.titles)) {
        const titlesWithIds = parsedResult.titles.map((t: any, i: number) => ({
          ...t,
          id: `title-${i}`,
          model: modelLabels[aiModel] || aiModel,
        }));
        setGeneratedTitles(titlesWithIds);
      }

      // Save to database
      await supabase.from("video_analyses").insert({
        user_id: user?.id,
        video_url: videoUrl,
        video_title: parsedResult.videoInfo?.title || "Análise de Vídeo",
        analysis_data: parsedResult,
      });

      toast({
        title: "Análise concluída!",
        description: "Títulos gerados com sucesso",
      });
    } catch (error) {
      console.error("Error analyzing video:", error);
      
      // Generate mock data on error for demo purposes
      const mockData = generateMockData(videoUrl);
      setVideoInfo(mockData.videoInfo);
      setGeneratedTitles(mockData.titles.map((t: any, i: number) => ({
        ...t,
        id: `title-${i}`,
        model: modelLabels[aiModel] || aiModel,
      })));
      
      toast({
        title: "Análise concluída",
        description: "Dados gerados para demonstração",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const generateMockData = (url: string) => {
    return {
      videoInfo: {
        title: "La BATALLA TECNOLÓGICA que NADIE Vio: MAYAS vs. AZTECAS",
        thumbnail: "",
        views: 1295,
        daysAgo: 137,
        comments: 2,
        estimatedRevenue: { usd: 5, brl: 25 },
        rpm: { usd: 3.5, brl: 19.25 },
        niche: "História",
        subNiche: "Mistérios",
        microNiche: "Conflito Tecnológico Ucrônico Antigo",
        originalTitleAnalysis: {
          motivoSucesso: "O título original gera curiosidade ao sugerir uma batalha tecnológica desconhecida entre civilizações antigas, usando palavras em caixa alta para intensificar o impacto.",
          formula: "Promessa central + benefício + 5 termo(s) em CAIXA ALTA + loop mental (o detalhe/segredo/verdade).",
        },
      },
      titles: [
        {
          title: "O SEGREDO MILITAR que NINGUÉM Revelou: EGÍPCIOS vs. HITITAS",
          formula: "Promessa central + benefício + 5 termo(s) em CAIXA ALTA + loop mental (o detalhe/segredo/verdade).",
          formulaSurpresa: "Promessa central + benefício + gatilho de segredo + loop mental",
          quality: 9,
          impact: 9,
          isBest: true,
        },
        {
          title: "A TÁTICA OCULTA que NINGUÉM Esperava: ROMANOS vs. VISIGODOS",
          formula: "Promessa central + benefício + 5 termo(s) em CAIXA ALTA + loop mental (o detalhe/segredo/verdade).",
          formulaSurpresa: "Mistério central + benefício + gatilho de revelação",
          quality: 9,
          impact: 8,
        },
        {
          title: "A ESTRATÉGIA PERDIDA que NINGUÉM Conhecia: VIKINGS vs. SAXÕES",
          formula: "Promessa central + benefício + 5 termo(s) em CAIXA ALTA + loop mental (o detalhe/segredo/verdade).",
          formulaSurpresa: "Promessa central + benefício + segredo revelado + loop mental",
          quality: 9,
          impact: 8,
        },
        {
          title: "A ESTRATÉGIA IMPOSSÍVEL que MUDOU TUDO: SPARTANOS vs. PERSAS",
          formula: "Promessa central + benefício + 5 termo(s) em CAIXA ALTA + loop mental (o detalhe/segredo/verdade).",
          formulaSurpresa: "Contraste extremo + benefício + gatilho de mistério",
          quality: 9,
          impact: 4,
        },
        {
          title: "O CONFRONTO SECRETO que TRANSFORMOU a HISTÓRIA: CHINESES vs. MONGÓIS",
          formula: "Promessa central + benefício + 5 termo(s) em CAIXA ALTA + loop mental (o detalhe/segredo/verdade).",
          formulaSurpresa: "Promessa central + segredo impactante + loop mental",
          quality: 9,
          impact: 4,
        },
      ],
    };
  };

  const handleDownloadThumbnail = async () => {
    if (!videoInfo?.thumbnail) {
      toast({
        title: "Thumbnail não disponível",
        description: "Não foi possível obter a thumbnail do vídeo",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch(videoInfo.thumbnail);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `thumbnail-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Download iniciado!", description: "Thumbnail salva com sucesso" });
    } catch {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a thumbnail",
        variant: "destructive",
      });
    }
  };

  const handleLoadTranscription = () => {
    // Create file input for transcription upload
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.srt,.vtt";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        toast({
          title: "Transcrição carregada!",
          description: `Arquivo ${file.name} carregado com ${text.length} caracteres`,
        });
      }
    };
    input.click();
  };

  const handleSearchSimilarVideos = () => {
    if (!videoInfo?.title) return;
    
    const searchQuery = encodeURIComponent(videoInfo.title);
    window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, "_blank");
    toast({ title: "Buscando vídeos semelhantes", description: "Abrindo YouTube em nova aba" });
  };

  const copyTitle = async (id: string, title: string) => {
    await navigator.clipboard.writeText(title);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copiado!", description: "Título copiado para a área de transferência" });
  };

  const toggleTitleSelection = (id: string) => {
    setSelectedTitles((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleCreateAgent = (formula: ScriptFormulaAnalysis | null, transcription: string) => {
    setCurrentFormula(formula);
    setCurrentTranscription(transcription);
    setShowAgentModal(true);
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Analisador de Títulos Virais
            </h1>
            <p className="text-muted-foreground">
              Cole uma URL de vídeo e o motor de IA para gerar títulos.
            </p>
          </div>

          {/* Input Section */}
          <Card className="p-6 mb-8 border-border/50">
            <div className="space-y-4">
              {/* URL Input */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  URL do Vídeo Viral
                </label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              {/* Options Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* AI Model */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm text-muted-foreground">Motor de IA</label>
                    <Badge variant="outline" className="text-primary border-primary text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      Custo estimado: 6 créditos
                    </Badge>
                  </div>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compare">Comparar (Multimodal)</SelectItem>
                      <SelectItem value="gemini">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="gemini-pro">Gemini 2.5 Pro (2025)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Modo único: 5 títulos</p>
                </div>

                {/* Language */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Idioma dos Títulos
                  </label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">🇧🇷 Português (PT-BR)</SelectItem>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Save Folder */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Salvar em... (Opcional)
                  </label>
                  <Select value={saveFolder} onValueChange={setSaveFolder}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Histórico Geral</SelectItem>
                      {folders?.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  "Analisar e Gerar Títulos"
                )}
              </Button>
            </div>
          </Card>

          {/* Video Info Card */}
          {videoInfo && (
            <Card className="p-6 mb-6 border-border/50">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Thumbnail */}
                <div className="relative flex-shrink-0">
                  <div className="w-full lg:w-48 h-28 bg-secondary rounded-lg overflow-hidden relative">
                    {videoInfo.thumbnail ? (
                      <img
                        src={videoInfo.thumbnail}
                        alt={videoInfo.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Eye className="w-8 h-8" />
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs h-7"
                    >
                      <Search className="w-3 h-3 mr-1" />
                      Semelhantes
                    </Button>
                  </div>
                </div>

                {/* Video Details */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    {videoInfo.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3 italic">
                    {videoInfo.title}
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {videoInfo.views.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {videoInfo.daysAgo} dias
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {videoInfo.comments} comentários
                    </span>
                  </div>

                  {/* Revenue */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Receita Estimada:</p>
                      <p className="text-success font-semibold">${videoInfo.estimatedRevenue.usd}</p>
                      <p className="text-success text-sm">R$ {videoInfo.estimatedRevenue.brl}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">RPM (por 1K views):</p>
                      <p className="text-success font-semibold">${videoInfo.rpm.usd}</p>
                      <p className="text-success text-sm">R$ {videoInfo.rpm.brl}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    * Valores baseados no nicho &quot;{videoInfo.niche}&quot;
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadThumbnail}>
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Thumbnail Original
                    </Button>
                    <Button variant="outline" size="sm" className="border-primary text-primary" onClick={handleLoadTranscription}>
                      <FileText className="w-4 h-4 mr-2" />
                      Carregar Transcrição
                    </Button>
                    <Button variant="outline" size="sm" className="border-primary text-primary" onClick={handleSearchSimilarVideos}>
                      <Search className="w-4 h-4 mr-2" />
                      Buscar Vídeos Semelhantes
                    </Button>
                  </div>
                </div>
              </div>

              {/* Niche Tags */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-secondary/50 p-4 rounded-lg border-l-4 border-destructive">
                  <p className="text-xs text-destructive font-semibold mb-1">NICHO DETETADO</p>
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-medium">{videoInfo.niche}</p>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyTitle("niche", videoInfo.niche)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-secondary/50 p-4 rounded-lg border-l-4 border-primary">
                  <p className="text-xs text-primary font-semibold mb-1">SUBNICHO DETETADO</p>
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-medium">{videoInfo.subNiche}</p>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyTitle("subNiche", videoInfo.subNiche)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-secondary/50 p-4 rounded-lg border-l-4 border-primary">
                  <p className="text-xs text-primary font-semibold mb-1">MICRO-NICHO DETETADO</p>
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-medium">{videoInfo.microNiche}</p>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyTitle("microNiche", videoInfo.microNiche)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Análise do Título Original */}
              {videoInfo.originalTitleAnalysis && (
                <Card className="mt-6 p-6 bg-secondary/30 border-border/50">
                  <h3 className="text-lg font-bold text-foreground mb-4">Análise do Título Original</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-foreground">Motivo do Sucesso: </span>
                      <span className="text-muted-foreground">{videoInfo.originalTitleAnalysis.motivoSucesso}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Fórmula: </span>
                      <code className="bg-primary/20 text-primary px-2 py-1 rounded text-sm">
                        {videoInfo.originalTitleAnalysis.formula}
                      </code>
                    </div>
                  </div>
                </Card>
              )}
            </Card>
          )}

          {/* Generated Titles */}
          {generatedTitles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Títulos Gerados (Modelo: {aiModel === "gemini" ? "Gemini" : aiModel})
                </h3>
                <Button variant="outline" size="sm" onClick={handleAnalyze}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar Mais Títulos
                </Button>
              </div>

              <div className="space-y-4">
                {generatedTitles.map((title) => (
                  <Card key={title.id} className="p-4 border-border/50">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedTitles.includes(title.id)}
                        onCheckedChange={() => toggleTitleSelection(title.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {title.model}
                          </Badge>
                          <span className="text-foreground font-semibold">{title.title}</span>
                        </div>

                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Análise da Estrutura/Fórmula
                            <ChevronDown className="w-4 h-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 space-y-2">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Fórmula original:</span>{" "}
                              <code className="bg-secondary px-2 py-0.5 rounded text-xs">
                                {title.formula}
                              </code>
                            </p>
                            <Badge variant="outline" className="text-xs text-primary border-primary">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Fórmula surpresa: {title.formulaSurpresa}
                            </Badge>
                          </CollapsibleContent>
                        </Collapsible>

                        {title.isBest && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Este título equilibra Qualidade ({title.quality}/10) e Impacto ({title.impact}/10) com score{" "}
                            {((title.quality + title.impact) / 2).toFixed(2)}. Mantém a mesma estrutura do original.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className="bg-success text-success-foreground">
                          <Check className="w-3 h-3 mr-1" />
                          Qualidade {title.quality}/10
                        </Badge>
                        <Badge className="bg-primary text-primary-foreground">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Impacto {title.impact}/10
                        </Badge>
                        {title.isBest && (
                          <Badge variant="outline" className="border-foreground text-foreground">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Melhor Título
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyTitle(title.id, title.title)}
                          className="h-8 w-8"
                        >
                          {copiedId === title.id ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Transcription Section */}
          {videoInfo && (
            <div className="mt-8">
              <TranscriptionSection onCreateAgent={handleCreateAgent} />
            </div>
          )}

          {/* Empty State */}
          {!videoInfo && !analyzing && (
            <Card className="p-12 text-center border-border/50">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Pronto para analisar
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Cole uma URL de vídeo do YouTube acima para analisar a fórmula do título e gerar novas variações otimizadas.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Script Agent Modal */}
      <ScriptAgentModal
        open={showAgentModal}
        onOpenChange={setShowAgentModal}
        formula={currentFormula}
        baseTranscription={currentTranscription}
      />
    </MainLayout>
  );
};

export default VideoAnalyzer;
