import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Loader2, User, Trash2, Sparkles, FileText, X, Zap, Copy, Pencil, Check, Brain, RefreshCw, Save, Download, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import logoGif from "@/assets/logo.gif";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";

const AI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", description: "Rápido e inteligente" },
  { id: "claude-4-sonnet", name: "Claude 4 Sonnet", provider: "Anthropic", description: "Criativo e detalhado" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", description: "Contexto extenso" },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isScript?: boolean;
}

interface ScriptAgent {
  id: string;
  name: string;
  niche: string | null;
  sub_niche: string | null;
  formula: string | null;
  formula_structure: any;
  mental_triggers: string[] | null;
  times_used: number | null;
  preferred_model: string | null;
}

interface AgentChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: ScriptAgent;
  onModelChange?: (model: string) => void;
  onTriggersUpdate?: (triggers: string[]) => void;
}

export function AgentChatModal({ open, onOpenChange, agent, onModelChange, onTriggersUpdate }: AgentChatModalProps) {
  const { user } = useAuth();
  const { balance } = useCredits();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(agent.preferred_model || "gpt-4o");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSavingTriggers, setIsSavingTriggers] = useState(false);
  
  // Script generation state
  const [showScriptForm, setShowScriptForm] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptDuration, setScriptDuration] = useState("5");
  const [scriptLanguage, setScriptLanguage] = useState("pt-BR");
  const [ctaInicio, setCtaInicio] = useState(false);
  const [ctaMeio, setCtaMeio] = useState(false);
  const [ctaFinal, setCtaFinal] = useState(true);
  const [autoTriggers, setAutoTriggers] = useState<string[]>([]);
  const [isGeneratingTriggers, setIsGeneratingTriggers] = useState(false);
  const [useAutoTriggers, setUseAutoTriggers] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedModel(agent.preferred_model || "gpt-4o");
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Olá! Sou o agente "${agent.name}". ${agent.niche ? `Especializado em ${agent.niche}${agent.sub_niche ? ` - ${agent.sub_niche}` : ''}.` : ''} Como posso ajudar você hoje?\n\n💡 Dica: Clique em "Gerar Roteiro" para criar um roteiro completo usando minha fórmula viral!`,
        timestamp: new Date()
      }]);
    }
  }, [open, agent]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    try {
      await supabase
        .from('script_agents')
        .update({ preferred_model: newModel })
        .eq('id', agent.id);
      onModelChange?.(newModel);
    } catch (error) {
      console.error("Error saving model preference:", error);
    }
  };

  const buildSystemPrompt = () => {
    let systemPrompt = `Você é "${agent.name}", um agente de IA especializado em criar conteúdo viral para YouTube.`;
    if (agent.niche) systemPrompt += `\nSeu nicho de especialização é: ${agent.niche}`;
    if (agent.sub_niche) systemPrompt += ` - Subnicho: ${agent.sub_niche}`;
    if (agent.formula) systemPrompt += `\n\nSuas instruções/fórmula de trabalho:\n${agent.formula}`;
    if (agent.formula_structure?.memory) systemPrompt += `\n\nMemória do agente:\n${agent.formula_structure.memory}`;
    if (agent.mental_triggers && agent.mental_triggers.length > 0) {
      systemPrompt += `\n\nGatilhos mentais que você deve aplicar: ${agent.mental_triggers.join(", ")}`;
    }
    systemPrompt += `\n\nVocê deve:
- Responder sempre em português brasileiro
- Ser criativo e envolvente
- Aplicar técnicas de copywriting viral
- Usar os gatilhos mentais quando apropriado
- Ajudar o usuário a criar conteúdo de alta performance`;
    return systemPrompt;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "agent_chat",
          prompt: input.trim(),
          agentData: {
            name: agent.name,
            niche: agent.niche,
            subNiche: agent.sub_niche,
            formula: agent.formula,
            memory: agent.formula_structure?.memory,
            mentalTriggers: agent.mental_triggers,
            systemPrompt: buildSystemPrompt(),
            conversationHistory
          },
          model: selectedModel
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.text || "Desculpe, não consegui gerar uma resposta.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      await supabase
        .from('script_agents')
        .update({ times_used: (agent.times_used || 0) + 1 })
        .eq('id', agent.id);

    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: `Olá! Sou o agente "${agent.name}". ${agent.niche ? `Especializado em ${agent.niche}${agent.sub_niche ? ` - ${agent.sub_niche}` : ''}.` : ''} Como posso ajudar você hoje?\n\n💡 Dica: Clique em "Gerar Roteiro" para criar um roteiro completo usando minha fórmula viral!`,
      timestamp: new Date()
    }]);
  };

  // Script generation logic
  const wordsPerMinute = 150; // Velocidade média de narração
  const estimatedWords = parseInt(scriptDuration || "1") * wordsPerMinute;
  const estimatedParts = Math.max(1, Math.ceil(parseInt(scriptDuration || "1") / 3));
  
  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      "pt-BR": "Português (Brasil)",
      "en-US": "English (US)",
      "en-GB": "English (UK)",
      "es": "Español",
      "es-MX": "Español (México)",
      "fr": "Français",
      "de": "Deutsch",
      "it": "Italiano",
      "ja": "日本語",
      "ko": "한국어",
      "zh": "中文",
      "ru": "Русский",
      "ar": "العربية",
      "hi": "हिन्दी",
      "nl": "Nederlands",
      "pl": "Polski",
      "tr": "Türkçe",
    };
    return languages[code] || code;
  };
  
  const getCreditsForModel = () => {
    const durationNum = parseInt(scriptDuration || "1");
    if (selectedModel.includes("gemini")) return Math.ceil(durationNum * 2.4);
    if (selectedModel.includes("gpt") || selectedModel.includes("claude")) return Math.ceil(durationNum * 2.8);
    return Math.ceil(durationNum * 2);
  };
  const estimatedCredits = getCreditsForModel();

  // Generate auto triggers based on niche and title
  const handleGenerateTriggers = async () => {
    if (!scriptTitle.trim()) {
      toast.error("Insira um título primeiro para gerar gatilhos personalizados");
      return;
    }

    setIsGeneratingTriggers(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "generate_mental_triggers",
          prompt: `Você é um ESPECIALISTA em YouTube com +10 anos de experiência em vídeos virais. Analise profundamente este título e nicho para gerar os MELHORES gatilhos mentais que farão o vídeo VIRALIZAR.

TÍTULO DO VÍDEO: "${scriptTitle}"
NICHO: ${agent.niche || "Geral"}
SUBNICHO: ${agent.sub_niche || "Geral"}

🎯 SUA MISSÃO: Gerar 8 gatilhos mentais ULTRA-PODEROSOS baseados em:

1. PSICOLOGIA DO ALGORITMO DO YOUTUBE:
   - Gatilhos que aumentam RETENÇÃO (watch time)
   - Gatilhos que geram CLIQUES (CTR alto)
   - Gatilhos que provocam ENGAJAMENTO (comentários, likes)

2. NEUROCIÊNCIA DA VIRALIZAÇÃO:
   - Dopamina: Curiosidade, Surpresa, Recompensa
   - Urgência: FOMO, Escassez, Tempo limitado
   - Emoção: Medo, Esperança, Raiva, Alegria
   - Social: Prova Social, Autoridade, Pertencimento

3. FÓRMULAS COMPROVADAS DE VIRAIS:
   - Contraste Dramático (Antes/Depois)
   - Segredo Revelado
   - Desafio Impossível
   - História de Transformação
   - Polêmica Controlada
   - Especificidade Numérica

4. GATILHOS ESPECÍFICOS PARA O NICHO "${agent.niche || 'Geral'}":
   - Adapte os gatilhos para ressoar com a audiência deste nicho
   - Use linguagem e referências que esta audiência conhece

⚠️ REGRAS:
- Cada gatilho deve ter NO MÁXIMO 3 palavras
- Devem ser ACIONÁVEIS no roteiro
- Foque nos gatilhos mais FORTES para este título específico
- Pense: "O que faria QUALQUER PESSOA parar de scrollar e assistir?"

Retorne APENAS os 8 gatilhos, um por linha, sem numeração, hífens ou explicação. Apenas as palavras/frases dos gatilhos.`,
          model: selectedModel,
        },
      });

      if (error) throw error;

      const triggersText = data?.response || data?.text || data?.result || "";
      const triggers = triggersText
        .split('\n')
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0 && t.length < 50)
        .slice(0, 8);

      if (triggers.length > 0) {
        setAutoTriggers(triggers);
        setUseAutoTriggers(true);
        toast.success(`${triggers.length} gatilhos mentais gerados!`);
      } else {
        toast.error("Não foi possível gerar gatilhos");
      }
    } catch (error) {
      console.error("Error generating triggers:", error);
      toast.error("Erro ao gerar gatilhos mentais");
    } finally {
      setIsGeneratingTriggers(false);
    }
  };

  const handleSaveTriggersToAgent = async () => {
    if (autoTriggers.length === 0) {
      toast.error("Nenhum gatilho para salvar");
      return;
    }

    setIsSavingTriggers(true);
    
    try {
      // Merge existing triggers with new ones (avoid duplicates)
      const existingTriggers = agent.mental_triggers || [];
      const mergedTriggers = [...new Set([...existingTriggers, ...autoTriggers])];
      
      const { error } = await supabase
        .from('script_agents')
        .update({ 
          mental_triggers: mergedTriggers,
          updated_at: new Date().toISOString()
        })
        .eq('id', agent.id);

      if (error) throw error;

      onTriggersUpdate?.(mergedTriggers);
      toast.success(`${autoTriggers.length} gatilhos salvos no agente!`);
      
      // Clear auto triggers after saving
      setAutoTriggers([]);
      setUseAutoTriggers(false);
      
    } catch (error) {
      console.error("Error saving triggers:", error);
      toast.error("Erro ao salvar gatilhos");
    } finally {
      setIsSavingTriggers(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!scriptTitle.trim()) {
      toast.error("Por favor, insira o título do vídeo");
      return;
    }
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    setIsGeneratingScript(true);
    setGenerationStatus("Preparando dados do agente...");
    
    try {
      const ctaPositions = [];
      if (ctaInicio) ctaPositions.push("início (primeiros 30 segundos)");
      if (ctaMeio) ctaPositions.push("meio (metade do vídeo)");
      if (ctaFinal) ctaPositions.push("final (últimos 30 segundos)");

      const userDuration = parseInt(scriptDuration || "1");
      const duration = userDuration + 1; // Sempre gera 1 minuto a mais para garantir conteúdo completo
      const actualWords = duration * 150;
      const actualParts = Math.max(1, Math.ceil(duration / 3));
      
      setGenerationStatus("Aplicando fórmula viral e gatilhos mentais...");

      // Build comprehensive prompt for voice-over only narration
      const prompt = `
GERE UM ROTEIRO DE NARRAÇÃO PARA VOICE-OVER com EXATAMENTE ${duration} minuto(s) de duração.

TÍTULO DO VÍDEO: "${scriptTitle}"

⚠️ REGRAS CRÍTICAS DE FORMATO:
1. SOMENTE TEXTO DE NARRAÇÃO - Nenhuma indicação de cena, corte, música ou efeito sonoro
2. DURAÇÃO EXATA: ${duration} minuto(s) = aproximadamente ${actualWords} palavras (150 palavras/minuto)
3. O texto deve ser LIDO EM VOZ ALTA naturalmente
4. Sem colchetes, parênteses ou instruções técnicas
5. Apenas o que o narrador deve FALAR

IDIOMA: ${getLanguageName(scriptLanguage)}

ESTRUTURA OBRIGATÓRIA (${actualParts} partes):
${Array.from({ length: actualParts }, (_, i) => `- Parte ${i + 1}: ~${Math.ceil(actualWords / actualParts)} palavras`).join('\n')}

${ctaPositions.length > 0 ? `INCLUIR CALL-TO-ACTION NATURAL EM: ${ctaPositions.join(", ")}` : "INCLUIR CTA NATURAL NO FINAL"}

${agent.formula ? `\n🎯 FÓRMULA VIRAL A SEGUIR:\n${agent.formula}` : ''}

${agent.formula_structure?.memory ? `\n📝 MEMÓRIA/CONTEXTO DO AGENTE:\n${agent.formula_structure.memory}` : ''}

${(() => {
  const allTriggers = [
    ...(agent.mental_triggers || []),
    ...(useAutoTriggers ? autoTriggers : [])
  ];
  return allTriggers.length > 0 
    ? `\n🧠 GATILHOS MENTAIS OBRIGATÓRIOS (use TODOS para roteiro viral 10/10):\n${allTriggers.map(t => `- ${t}`).join('\n')}` 
    : '';
})()}

${agent.formula_structure?.instructions ? `\n📋 INSTRUÇÕES ESPECÍFICAS:\n${agent.formula_structure.instructions}` : ''}

EXEMPLO DE FORMATO CORRETO:
"Você já parou para pensar por que algumas pessoas conseguem resultados extraordinários enquanto outras lutam para sair do lugar? Hoje vou revelar o segredo que mudou completamente minha perspectiva..."

GERE AGORA O ROTEIRO COMPLETO DE NARRAÇÃO:
      `.trim();

      setGenerationStatus("Gerando roteiro com IA...");

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "generate_script_with_formula",
          prompt,
          model: selectedModel,
          duration,
          language: scriptLanguage,
          userId: user.id,
          agentData: {
            name: agent.name,
            niche: agent.niche,
            sub_niche: agent.sub_niche,
            formula: agent.formula,
            formula_structure: agent.formula_structure,
            mental_triggers: agent.mental_triggers,
          },
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setGenerationStatus("Salvando roteiro...");

      const scriptContent = typeof data?.result === 'string' ? data.result : JSON.stringify(data?.result, null, 2);

      // Save script
      await supabase
        .from('generated_scripts')
        .insert({
          user_id: user.id,
          agent_id: agent.id,
          title: scriptTitle,
          content: scriptContent,
          duration: duration,
          language: scriptLanguage,
          model_used: selectedModel,
          credits_used: data?.creditsUsed || estimatedCredits
        });

      // Update agent usage
      await supabase
        .from("script_agents")
        .update({ 
          times_used: (agent.times_used || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", agent.id);

      setGenerationStatus("Concluído!");

      // Calculate actual word count and estimated reading time
      const wordCount = scriptContent.split(/\s+/).filter((w: string) => w.length > 0).length;
      const actualMinutes = Math.round((wordCount / 150) * 10) / 10; // 150 words per minute
      const actualSeconds = Math.round((wordCount / 150) * 60);
      const formattedTime = actualMinutes >= 1 
        ? `${Math.floor(actualMinutes)}:${String(Math.round((actualMinutes % 1) * 60)).padStart(2, '0')} min`
        : `${actualSeconds} seg`;

      // Add script to chat as assistant message (only the content)
      const scriptMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: scriptContent,
        timestamp: new Date(),
        isScript: true
      };
      setMessages(prev => [...prev, scriptMessage]);
      
      setShowScriptForm(false);
      setScriptTitle("");
      toast.success(`Roteiro gerado: ${wordCount} palavras (~${formattedTime})`);
      
    } catch (error) {
      console.error("[GenerateScript] Error:", error);
      toast.error("Erro ao gerar roteiro. Tente novamente.");
    } finally {
      setIsGeneratingScript(false);
      setGenerationStatus("");
    }
  };

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");

  const copyToClipboard = (content: string) => {
    // Remove marcações de partes (Parte 1:, Parte 2:, etc.) e títulos
    const cleanContent = content
      .replace(/^(Parte\s*\d+\s*[:\.]\s*)/gim, '')
      .replace(/^\*\*Parte\s*\d+\s*[:\.]\s*\*\*/gim, '')
      .replace(/^#+ .+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    navigator.clipboard.writeText(cleanContent);
    toast.success("Roteiro copiado!");
  };

  // Calculate word count and estimated time for a script
  const getScriptStats = (content: string) => {
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const minutes = Math.floor(wordCount / 150);
    const seconds = Math.round((wordCount % 150) / 2.5);
    const formattedTime = minutes >= 1 
      ? `${minutes}:${String(seconds).padStart(2, '0')}`
      : `${Math.round(wordCount / 2.5)}s`;
    return { wordCount, formattedTime };
  };

  // Convert script to SRT format
  const convertToSRT = (content: string) => {
    // Clean the content first
    const cleanContent = content
      .replace(/^(Parte\s*\d+\s*[:\.]\s*)/gim, '')
      .replace(/^\*\*Parte\s*\d+\s*[:\.]\s*\*\*/gim, '')
      .replace(/^#+ .+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Split content into sentences/phrases (never split words)
    const sentences = cleanContent
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);

    const srtParts: string[] = [];
    let currentPart = '';
    let partIndex = 1;
    let currentTime = 0;
    const timePerPart = 10; // 10 seconds per part

    for (const sentence of sentences) {
      const testPart = currentPart ? `${currentPart} ${sentence}` : sentence;
      
      // If adding this sentence would exceed 499 chars, finalize current part
      if (testPart.length > 499 && currentPart.length >= 400) {
        // Format time for SRT
        const startTime = formatSRTTime(currentTime);
        const endTime = formatSRTTime(currentTime + timePerPart);
        
        srtParts.push(`${partIndex}\n${startTime} --> ${endTime}\n${currentPart.trim()}\n`);
        
        partIndex++;
        currentTime += timePerPart;
        currentPart = sentence;
      } 
      // If current part is between 400-499 and sentence would push over, finalize
      else if (currentPart.length >= 400 && testPart.length > 499) {
        const startTime = formatSRTTime(currentTime);
        const endTime = formatSRTTime(currentTime + timePerPart);
        
        srtParts.push(`${partIndex}\n${startTime} --> ${endTime}\n${currentPart.trim()}\n`);
        
        partIndex++;
        currentTime += timePerPart;
        currentPart = sentence;
      }
      else {
        currentPart = testPart;
      }
    }

    // Add remaining content if any
    if (currentPart.trim().length > 0) {
      const startTime = formatSRTTime(currentTime);
      const endTime = formatSRTTime(currentTime + timePerPart);
      srtParts.push(`${partIndex}\n${startTime} --> ${endTime}\n${currentPart.trim()}\n`);
    }

    return srtParts.join('\n');
  };

  const formatSRTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = 0;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };

  const downloadSRT = (content: string, title: string) => {
    const srtContent = convertToSRT(content);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("SRT baixado com sucesso!");
  };

  const startEditing = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedContent(content);
  };

  const saveEdit = (messageId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          content: editedContent
        };
      }
      return msg;
    }));
    setEditingMessageId(null);
    setEditedContent("");
    toast.success("Roteiro atualizado!");
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent("");
  };

  // Loading modal steps for script generation
  const loadingSteps = [
    "Analisando título e nicho",
    "Aplicando fórmula viral",
    "Ativando gatilhos mentais",
    "Gerando roteiro 10/10",
    "Otimizando para retenção",
    "Finalizando roteiro viral",
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isGeneratingScript) {
      setCurrentStep(0);
      setProgress(0);
      
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < loadingSteps.length - 1) return prev + 1;
          return prev;
        });
      }, 3000);
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 95) return prev + Math.random() * 5;
          return prev;
        });
      }, 500);

      return () => {
        clearInterval(stepInterval);
        clearInterval(progressInterval);
      };
    } else {
      setProgress(100);
    }
  }, [isGeneratingScript]);

  return (
    <>
      {/* Loading Modal durante geração */}
      <Dialog open={isGeneratingScript} onOpenChange={() => {}}>
        <DialogContent className="bg-card border-primary/50 rounded-2xl max-w-sm text-center p-8" onPointerDownOutside={(e) => e.preventDefault()}>
          <div className="flex flex-col items-center gap-6">
            {/* Logo com efeito de pulso */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
              <div className="relative w-20 h-20 rounded-full border-2 border-primary/50 overflow-hidden">
                <img src={logoGif} alt="Logo" className="w-full h-full object-cover scale-110" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                Gerando Roteiro Viral
              </h3>
              <p className="text-sm text-muted-foreground">
                {loadingSteps[currentStep]}...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full space-y-2">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {Math.round(progress)}%
              </p>
            </div>

            {/* Steps indicator */}
            <div className="flex gap-1.5">
              {loadingSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    idx <= currentStep 
                      ? "bg-primary" 
                      : "bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Modal */}
      <Dialog open={open && !isGeneratingScript} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-primary/30 rounded-2xl max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-5 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/30 to-amber-500/20 flex items-center justify-center border border-primary/40 shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-lg text-foreground truncate">{agent.name}</p>
                {agent.niche && (
                  <p className="text-xs text-muted-foreground font-normal truncate">
                    {agent.niche}{agent.sub_niche ? ` • ${agent.sub_niche}` : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger className="w-[140px] h-9 text-xs bg-background/50 border-border/50 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  <SelectValue placeholder="Modelo" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Limpar conversa"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    message.role === "user"
                      ? "bg-primary/20 text-primary"
                      : "bg-gradient-to-br from-primary/20 to-amber-500/20 text-primary"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/50 border border-border/50 text-foreground"
                  } ${message.isScript ? 'max-w-[95%]' : ''}`}
                >
                  {editingMessageId === message.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[300px] text-sm bg-background/80 border-primary/30 resize-y"
                        placeholder="Edite o roteiro..."
                      />
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {editedContent.split(/\s+/).filter(w => w.length > 0).length} palavras
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEdit}
                            className="h-7 px-2 text-xs"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveEdit(message.id)}
                            className="h-7 px-3 text-xs bg-primary text-primary-foreground"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.isScript && (
                          <div className="absolute top-0 right-0 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded-bl-lg rounded-tr-lg px-2 py-1 border-l border-b border-border/30">
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {getScriptStats(message.content).wordCount} palavras
                            </span>
                            <span className="text-[10px] text-primary font-medium">
                              ~{getScriptStats(message.content).formattedTime}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                        <p className="text-[10px] opacity-60">
                          {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {message.isScript && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(message.id, message.content)}
                              className="h-6 px-2 text-xs"
                            >
                              <Pencil className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(message.content)}
                              className="h-6 px-2 text-xs"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copiar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadSRT(message.content, scriptTitle || 'roteiro')}
                              className="h-6 px-2 text-xs"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              SRT
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-background/50 border border-border/50 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            {isGeneratingScript && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-background/50 border border-border/50 rounded-2xl px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">Gerando roteiro de narração...</span>
                    </div>
                    {generationStatus && (
                      <span className="text-xs text-muted-foreground">{generationStatus}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Script Generation Form */}
        {showScriptForm && (
          <div className="p-4 border-t border-border/50 bg-secondary/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Gerar Roteiro</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  ~{estimatedCredits} créditos
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowScriptForm(false)}
                  className="h-6 w-6"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Input
              placeholder="Título do vídeo..."
              value={scriptTitle}
              onChange={(e) => setScriptTitle(e.target.value)}
              className="bg-background/50 border-border/50 text-sm"
            />

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Duração (min)</Label>
                <Input
                  type="number"
                  min="1"
                  max="15"
                  value={scriptDuration}
                  onChange={(e) => setScriptDuration(e.target.value)}
                  className="bg-background/50 border-border/50 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Partes</Label>
                <Input
                  value={estimatedParts}
                  readOnly
                  className="bg-background/50 border-border/50 h-9 text-sm opacity-70 cursor-not-allowed"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Idioma</Label>
                <Select value={scriptLanguage} onValueChange={setScriptLanguage}>
                  <SelectTrigger className="bg-background/50 border-border/50 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="pt-BR">🇧🇷 Português (BR)</SelectItem>
                    <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
                    <SelectItem value="en-GB">🇬🇧 English (UK)</SelectItem>
                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                    <SelectItem value="es-MX">🇲🇽 Español (MX)</SelectItem>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                    <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                    <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                    <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                    <SelectItem value="ko">🇰🇷 한국어</SelectItem>
                    <SelectItem value="zh">🇨🇳 中文</SelectItem>
                    <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                    <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                    <SelectItem value="hi">🇮🇳 हिन्दी</SelectItem>
                    <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
                    <SelectItem value="pl">🇵🇱 Polski</SelectItem>
                    <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Auto Mental Triggers Section */}
            <div className="bg-background/30 rounded-lg p-3 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">Gatilhos Mentais Automáticos</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateTriggers}
                  disabled={isGeneratingTriggers || !scriptTitle.trim()}
                  className="h-7 px-2 text-xs"
                >
                  {isGeneratingTriggers ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : autoTriggers.length > 0 ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Regenerar
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Gerar
                    </>
                  )}
                </Button>
              </div>
              
              {autoTriggers.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {autoTriggers.map((trigger, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
                        onClick={() => {
                          setAutoTriggers(prev => prev.filter((_, i) => i !== idx));
                        }}
                      >
                        {trigger} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <Checkbox
                        checked={useAutoTriggers}
                        onCheckedChange={(c) => setUseAutoTriggers(c === true)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-muted-foreground">Usar no roteiro</span>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveTriggersToAgent}
                      disabled={isSavingTriggers || autoTriggers.length === 0}
                      className="h-6 px-2 text-xs bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20"
                    >
                      {isSavingTriggers ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-1" />
                          Salvar no Agente
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Insira o título e clique em "Gerar" para criar gatilhos mentais otimizados para viralizar
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={ctaInicio}
                  onCheckedChange={(c) => setCtaInicio(c === true)}
                  className="h-4 w-4"
                />
                CTA Início
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={ctaMeio}
                  onCheckedChange={(c) => setCtaMeio(c === true)}
                  className="h-4 w-4"
                />
                CTA Meio
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={ctaFinal}
                  onCheckedChange={(c) => setCtaFinal(c === true)}
                  className="h-4 w-4"
                />
                CTA Final
              </label>
            </div>

            {/* Insufficient Credits Warning */}
            {balance < estimatedCredits && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive">Créditos Insuficientes</p>
                    <p className="text-xs text-muted-foreground">
                      Você precisa de <span className="font-bold text-foreground">{estimatedCredits} créditos</span> para gerar este roteiro, 
                      mas possui apenas <span className="font-bold text-foreground">{balance} créditos</span>.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/plans");
                  }}
                  className="w-full bg-gradient-to-r from-primary to-amber-500 text-primary-foreground hover:opacity-90"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Comprar Créditos
                </Button>
              </div>
            )}

            <Button
              onClick={handleGenerateScript}
              disabled={!scriptTitle.trim() || isGeneratingScript || balance < estimatedCredits}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isGeneratingScript ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Gerar Roteiro ({estimatedCredits} créditos)
                </>
              )}
            </Button>
          </div>
        )}

        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowScriptForm(!showScriptForm)}
              className={`shrink-0 ${showScriptForm ? 'bg-primary/20 border-primary/50' : ''}`}
              disabled={isLoading || isGeneratingScript}
            >
              <FileText className="w-4 h-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="bg-background/50 border-border/50"
              disabled={isLoading || isGeneratingScript}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || isGeneratingScript}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            💡 Clique no ícone de documento para gerar roteiros com a fórmula do agente
          </p>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}