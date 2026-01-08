import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Clock, 
  Target, 
  Zap, 
  Brain, 
  TrendingUp, 
  Copy, 
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Eye,
  MessageSquare,
  Lightbulb,
  Play,
  Pause,
  SkipForward,
  Volume2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";
import { useActivityLog } from "@/hooks/useActivityLog";
import logoGif from "@/assets/logo.gif";

// Viral formulas based on proven YouTube patterns
const VIRAL_FORMULAS = [
  {
    id: "curiosity-gap",
    name: "Curiosity Gap",
    description: "Cria lacunas de curiosidade que mantêm o espectador grudado",
    icon: "🎯",
    retention: 85
  },
  {
    id: "storytelling",
    name: "Storytelling Épico",
    description: "Narrativa envolvente com arcos dramáticos e plot twists",
    icon: "📖",
    retention: 90
  },
  {
    id: "problem-solution",
    name: "Problema → Solução",
    description: "Apresenta dor intensa e entrega transformação",
    icon: "💡",
    retention: 82
  },
  {
    id: "controversy",
    name: "Polêmica Controlada",
    description: "Opiniões fortes que geram debate e compartilhamento",
    icon: "🔥",
    retention: 88
  },
  {
    id: "mystery",
    name: "Mistério Revelado",
    description: "Segredos e revelações que prendem até o final",
    icon: "🔮",
    retention: 92
  },
  {
    id: "challenge",
    name: "Desafio Extremo",
    description: "Situações impossíveis com superação épica",
    icon: "⚡",
    retention: 87
  }
];

// Mental triggers for maximum engagement
const MENTAL_TRIGGERS = [
  { id: "urgency", name: "Urgência", icon: "⏰" },
  { id: "scarcity", name: "Escassez", icon: "💎" },
  { id: "social-proof", name: "Prova Social", icon: "👥" },
  { id: "authority", name: "Autoridade", icon: "🏆" },
  { id: "reciprocity", name: "Reciprocidade", icon: "🎁" },
  { id: "fear", name: "Medo de Perder", icon: "😨" },
  { id: "curiosity", name: "Curiosidade", icon: "🤔" },
  { id: "anticipation", name: "Antecipação", icon: "🎬" }
];

// Niches with specific viral patterns
const NICHES = [
  "Dark/Mistério",
  "True Crime",
  "Histórias Reais",
  "Motivacional",
  "Finanças",
  "Tecnologia",
  "Saúde/Fitness",
  "Relacionamentos",
  "Curiosidades",
  "Educacional",
  "Entretenimento",
  "Gaming",
  "Negócios",
  "Desenvolvimento Pessoal",
  "Lifestyle"
];

const AI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", premium: true },
  { id: "claude-4-sonnet", name: "Claude 4 Sonnet", provider: "Anthropic", premium: true },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", premium: true }
];

export default function ViralScriptGenerator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deduct, checkBalance, getEstimatedCost } = useCreditDeduction();
  const { logActivity } = useActivityLog();

  // Form state
  const [title, setTitle] = useState("");
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [duration, setDuration] = useState(10); // minutes
  const [selectedFormula, setSelectedFormula] = useState("storytelling");
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(["curiosity", "anticipation"]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [aiModel, setAiModel] = useState("gpt-4o");
  const [language, setLanguage] = useState("pt-BR");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [currentPart, setCurrentPart] = useState(0);
  const [totalParts, setTotalParts] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Retention analysis
  const [retentionScore, setRetentionScore] = useState<number | null>(null);
  const [retentionTips, setRetentionTips] = useState<string[]>([]);

  // Credits
  const [hasEnoughCredits, setHasEnoughCredits] = useState(true);
  const [estimatedCredits, setEstimatedCredits] = useState(0);

  // Loading messages rotation
  const loadingMessages = [
    "🎬 Analisando fórmulas virais...",
    "🧠 Aplicando gatilhos mentais...",
    "📈 Otimizando para retenção máxima...",
    "✍️ Escrevendo narrativa envolvente...",
    "🔥 Adicionando hooks poderosos...",
    "⚡ Criando momentos de tensão...",
    "🎯 Inserindo CTAs estratégicos...",
    "💎 Polindo cada palavra..."
  ];

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  // Calculate estimated credits based on duration
  useEffect(() => {
    const wordsPerMinute = 150;
    const totalWords = duration * wordsPerMinute;
    const creditsPerWord = 0.02; // Base credit cost
    const modelMultiplier = aiModel === "gpt-4o" ? 1.5 : aiModel === "claude-4-sonnet" ? 1.3 : 1.0;
    const estimated = Math.ceil(totalWords * creditsPerWord * modelMultiplier);
    setEstimatedCredits(estimated);
  }, [duration, aiModel]);

  // Check credits on mount
  useEffect(() => {
    const checkCredits = async () => {
      if (user) {
        const result = await checkBalance(estimatedCredits);
        setHasEnoughCredits(result.hasBalance);
      }
    };
    checkCredits();
  }, [user, estimatedCredits]);

  const toggleTrigger = (triggerId: string) => {
    setSelectedTriggers(prev => 
      prev.includes(triggerId) 
        ? prev.filter(t => t !== triggerId)
        : [...prev, triggerId]
    );
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
    return `${hours}h ${mins}min`;
  };

  const cleanScriptForCopy = (script: string) => {
    return script
      .replace(/\[PARTE \d+\/\d+\]/g, '')
      .replace(/\[INÍCIO\]|\[FIM\]/g, '')
      .replace(/---+/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const handleCopyScript = () => {
    const cleanedScript = cleanScriptForCopy(generatedScript);
    navigator.clipboard.writeText(cleanedScript);
    toast.success("Roteiro copiado!");
  };

  const handleDownloadScript = () => {
    const cleanedScript = cleanScriptForCopy(generatedScript);
    const blob = new Blob([cleanedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roteiro-viral-${title.slice(0, 30).replace(/[^a-z0-9]/gi, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Roteiro baixado!");
  };

  const buildViralPrompt = () => {
    const formula = VIRAL_FORMULAS.find(f => f.id === selectedFormula);
    const triggers = selectedTriggers.map(t => MENTAL_TRIGGERS.find(m => m.id === t)?.name).filter(Boolean);
    const finalNiche = niche === "custom" ? customNiche : niche;
    const wordsTarget = duration * 150;

    return `Você é um ESPECIALISTA ELITE em roteiros virais para YouTube com mais de 10 anos criando conteúdo que quebra a internet. Seu trabalho é criar roteiros que:
- Mantêm retenção ACIMA de 70%
- Geram milhões de visualizações
- Viralizam organicamente

## MISSÃO CRÍTICA
Crie um roteiro COMPLETO e PROFISSIONAL para um vídeo de ${formatDuration(duration)} (aproximadamente ${wordsTarget} palavras).

## DADOS DO VÍDEO
- **Título/Tema**: ${title}
- **Nicho**: ${finalNiche}
- **Público-alvo**: ${targetAudience || "Geral"}
- **Fórmula Viral**: ${formula?.name} - ${formula?.description}
- **Gatilhos Mentais**: ${triggers.join(", ")}
${additionalContext ? `- **Contexto Adicional**: ${additionalContext}` : ''}

## ESTRUTURA OBRIGATÓRIA DE RETENÇÃO

### 🎯 HOOK INICIAL (0-30 segundos) - CRÍTICO!
- Primeira frase EXPLOSIVA que para o scroll
- Promessa clara do que o espectador vai ganhar
- Elemento de curiosidade ou choque
- NUNCA comece com "Olá pessoal" ou saudações genéricas

### 📈 DESENVOLVIMENTO (corpo do vídeo)
Divida em blocos de 2-3 minutos, cada um com:
- Mini-hook no início de cada bloco
- Tensão crescente
- Micro-revelações para manter engajamento
- Transições que criam expectativa

### 🔥 PONTOS DE RETENÇÃO (a cada 2-3 minutos)
- Pattern interrupts visuais
- Perguntas retóricas
- Teasers do que vem a seguir
- Momentos de emoção intensa

### 💎 CLÍMAX E RESOLUÇÃO
- Build-up emocional máximo
- Revelação principal épica
- Momento de transformação/insight

### 📢 CTA ESTRATÉGICO
- CTA integrado naturalmente
- Chamada para inscrição contextualizada
- Teaser do próximo vídeo

## REGRAS DE OURO
1. CADA FRASE deve ter um propósito
2. Use linguagem conversacional e envolvente
3. Crie "open loops" (ganchos que só fecham depois)
4. Alterne entre momentos de tensão e alívio
5. Inclua dados/números para credibilidade
6. Use metáforas e histórias para ilustrar pontos
7. Faça o espectador SENTIR, não apenas ouvir

## GATILHOS MENTAIS A APLICAR
${triggers.map(t => `- **${t}**: Aplique naturalmente ao longo do roteiro`).join('\n')}

## FORMATO DE ENTREGA
Entregue APENAS o roteiro narrado (voice-over), sem instruções técnicas.
Não inclua: [CENA], [CORTE], [B-ROLL] ou qualquer marcação técnica.
O texto deve fluir naturalmente como uma narração contínua.

## IMPORTANTE
- O roteiro DEVE ter aproximadamente ${wordsTarget} palavras
- Mantenha parágrafos curtos (2-3 frases)
- Use quebras naturais para respiração
- Cada minuto = ~150 palavras

COMECE O ROTEIRO AGORA:`;
  };

  const generateScript = async () => {
    if (!title.trim()) {
      toast.error("Digite o título ou tema do vídeo");
      return;
    }

    if (!niche && !customNiche) {
      toast.error("Selecione ou digite um nicho");
      return;
    }

    if (!hasEnoughCredits) {
      toast.error("Créditos insuficientes");
      return;
    }

    setIsGenerating(true);
    setGeneratedScript("");
    setProgress(0);
    setRetentionScore(null);
    setRetentionTips([]);

    try {
      // Calculate parts needed for long scripts
      const wordsPerPart = 2000;
      const totalWords = duration * 150;
      const partsNeeded = Math.ceil(totalWords / wordsPerPart);
      setTotalParts(partsNeeded);

      let fullScript = "";

      for (let part = 1; part <= partsNeeded; part++) {
        setCurrentPart(part);
        setProgress(((part - 1) / partsNeeded) * 100);

        const partPrompt = partsNeeded > 1 
          ? `${buildViralPrompt()}\n\n[PARTE ${part}/${partsNeeded}] ${part === 1 ? 'Comece do início do roteiro.' : `Continue de onde parou. Texto anterior terminava em: "${fullScript.slice(-200)}"`} ${part === partsNeeded ? 'Finalize o roteiro com CTA.' : 'Pare em um ponto natural, será continuado.'}`
          : buildViralPrompt();

        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: {
            messages: [{ role: 'user', content: partPrompt }],
            model: aiModel,
            type: 'viral-script'
          }
        });

        if (error) throw error;

        const partContent = data?.content || data?.message || "";
        fullScript += (part > 1 ? "\n\n" : "") + partContent;
        setGeneratedScript(fullScript);
      }

      setProgress(100);

      // Deduct credits
      await deduct({
        operationType: 'script_generation',
        customAmount: estimatedCredits,
        modelUsed: aiModel,
        details: {
          title,
          duration,
          formula: selectedFormula
        }
      });

      // Log activity
      await logActivity({
        action: 'script_generated',
        description: `Roteiro viral: ${title} (${formatDuration(duration)})`,
        metadata: {
          duration,
          formula: selectedFormula,
          triggers: selectedTriggers
        }
      });

      // Analyze retention
      analyzeRetention(fullScript);

      // Save script
      await saveScript(fullScript);

      toast.success("Roteiro viral gerado com sucesso!");

    } catch (error) {
      console.error('Error generating script:', error);
      toast.error("Erro ao gerar roteiro. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeRetention = (script: string) => {
    const tips: string[] = [];
    let score = 75;

    // Check for strong hooks
    const firstSentence = script.split('.')[0] || "";
    if (firstSentence.length > 100) {
      tips.push("Primeira frase muito longa. Hooks devem ser impactantes e curtos.");
      score -= 5;
    } else {
      score += 5;
    }

    // Check for questions
    const questionCount = (script.match(/\?/g) || []).length;
    if (questionCount < 5) {
      tips.push("Adicione mais perguntas retóricas para engajar o espectador.");
      score -= 3;
    } else {
      score += 5;
    }

    // Check for emotional words
    const emotionalWords = ['incrível', 'chocante', 'surpreendente', 'impressionante', 'nunca', 'sempre', 'segredo', 'revelação'];
    const emotionalCount = emotionalWords.reduce((acc, word) => 
      acc + (script.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0
    );
    if (emotionalCount < 10) {
      tips.push("Use mais palavras emocionais para criar impacto.");
      score -= 3;
    } else {
      score += 5;
    }

    // Check paragraph length
    const paragraphs = script.split('\n\n').filter(p => p.trim());
    const longParagraphs = paragraphs.filter(p => p.length > 500);
    if (longParagraphs.length > 3) {
      tips.push("Alguns parágrafos estão muito longos. Quebre em blocos menores.");
      score -= 5;
    }

    // Ensure score is within bounds
    score = Math.min(100, Math.max(0, score));
    
    setRetentionScore(score);
    setRetentionTips(tips);
  };

  const saveScript = async (script: string) => {
    if (!user) return;

    try {
      await supabase.from('generated_scripts').insert({
        user_id: user.id,
        title: title,
        content: script,
        duration: duration,
        language: language,
        model_used: aiModel,
        credits_used: estimatedCredits
      });
    } catch (error) {
      console.error('Error saving script:', error);
    }
  };

  return (
    <MainLayout>
      <SEOHead 
        title="Gerador de Roteiros Virais | Retenção Máxima"
        description="Crie roteiros virais otimizados para retenção máxima no YouTube"
      />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              Gerador de Roteiros Virais
            </h1>
          </div>
          <p className="text-muted-foreground">
            Crie roteiros de 5 minutos a 3 horas com foco em retenção e viralização
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Informações do Vídeo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Título ou Tema *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: A história por trás do maior golpe do século"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="niche">Nicho</Label>
                    <Select value={niche} onValueChange={setNiche}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {NICHES.map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                        <SelectItem value="custom">Outro (digitar)</SelectItem>
                      </SelectContent>
                    </Select>
                    {niche === "custom" && (
                      <Input
                        value={customNiche}
                        onChange={(e) => setCustomNiche(e.target.value)}
                        placeholder="Digite o nicho"
                        className="mt-2"
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="audience">Público-alvo</Label>
                    <Input
                      id="audience"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="Ex: 18-35 anos, interessados em..."
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Duração do Vídeo: {formatDuration(duration)}</Label>
                  <div className="mt-3 px-2">
                    <Slider
                      value={[duration]}
                      onValueChange={(v) => setDuration(v[0])}
                      min={5}
                      max={180}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>5 min</span>
                      <span>1h</span>
                      <span>2h</span>
                      <span>3h</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Viral Formula */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Fórmula Viral
                </CardTitle>
                <CardDescription>
                  Escolha a estrutura que melhor se adapta ao seu conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {VIRAL_FORMULAS.map((formula) => (
                    <button
                      key={formula.id}
                      onClick={() => setSelectedFormula(formula.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedFormula === formula.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{formula.icon}</span>
                        <span className="font-medium text-sm">{formula.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {formula.description}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-500">{formula.retention}% retenção</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mental Triggers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Gatilhos Mentais
                </CardTitle>
                <CardDescription>
                  Selecione os gatilhos a serem aplicados no roteiro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {MENTAL_TRIGGERS.map((trigger) => (
                    <button
                      key={trigger.id}
                      onClick={() => toggleTrigger(trigger.id)}
                      className={`px-3 py-2 rounded-full text-sm flex items-center gap-1.5 transition-all ${
                        selectedTriggers.includes(trigger.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      <span>{trigger.icon}</span>
                      <span>{trigger.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Model & Context */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Configurações Avançadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Modelo de IA</Label>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {model.provider}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="context">Contexto Adicional (opcional)</Label>
                  <Textarea
                    id="context"
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Informações extras, referências, estilo específico..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      ~{Math.ceil(duration * 150)} palavras
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">
                      {estimatedCredits} créditos
                    </span>
                  </div>
                </div>

                <Button
                  onClick={generateScript}
                  disabled={isGenerating || !hasEnoughCredits}
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Gerando... {Math.round(progress)}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5" />
                      <span>Gerar Roteiro Viral</span>
                    </div>
                  )}
                </Button>

                {!hasEnoughCredits && (
                  <p className="text-xs text-red-500 text-center mt-2">
                    Créditos insuficientes. Recarregue para continuar.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Output Panel */}
          <div className="space-y-6">
            {isGenerating && (
              <Card className="border-primary/50 bg-gradient-to-br from-background to-primary/5">
                <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full animate-pulse" />
                    <img 
                      src={logoGif} 
                      alt="Loading" 
                      className="relative h-24 w-24 rounded-full animate-pulse"
                    />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">Criando Roteiro Viral</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {loadingMessage}
                  </p>

                  {totalParts > 1 && (
                    <div className="text-sm text-muted-foreground mb-4">
                      Parte {currentPart} de {totalParts}
                    </div>
                  )}

                  <div className="w-full max-w-xs bg-secondary rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-2">
                    {Math.round(progress)}% concluído
                  </span>
                </CardContent>
              </Card>
            )}

            {generatedScript && !isGenerating && (
              <>
                {/* Retention Analysis */}
                {retentionScore !== null && (
                  <Card className={`border-2 ${
                    retentionScore >= 80 ? 'border-green-500/50 bg-green-500/5' :
                    retentionScore >= 60 ? 'border-yellow-500/50 bg-yellow-500/5' :
                    'border-red-500/50 bg-red-500/5'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className={`h-5 w-5 ${
                            retentionScore >= 80 ? 'text-green-500' :
                            retentionScore >= 60 ? 'text-yellow-500' :
                            'text-red-500'
                          }`} />
                          <span className="font-semibold">Análise de Retenção</span>
                        </div>
                        <Badge variant={
                          retentionScore >= 80 ? 'default' :
                          retentionScore >= 60 ? 'secondary' :
                          'destructive'
                        } className="text-lg px-3">
                          {retentionScore}%
                        </Badge>
                      </div>

                      {retentionTips.length > 0 && (
                        <div className="space-y-2">
                          {retentionTips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {retentionTips.length === 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Roteiro otimizado para alta retenção!</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Script Output */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Seu Roteiro Viral
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyScript}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownloadScript}>
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {generatedScript}
                        </pre>
                      </div>
                    </ScrollArea>

                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {generatedScript.split(/\s+/).length} palavras
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          ~{Math.ceil(generatedScript.split(/\s+/).length / 150)} min
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={generateScript}
                        className="text-primary"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Regenerar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!generatedScript && !isGenerating && (
              <Card className="min-h-[400px] flex items-center justify-center">
                <CardContent className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
                    <Flame className="h-8 w-8 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Pronto para Viralizar?
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Configure as opções ao lado e clique em "Gerar Roteiro Viral" 
                    para criar um roteiro otimizado para máxima retenção.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
