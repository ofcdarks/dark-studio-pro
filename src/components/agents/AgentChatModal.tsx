import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Loader2, User, Trash2, Sparkles, FileText, X, Zap, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const AI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", description: "Rápido e inteligente" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", description: "Econômico" },
  { id: "claude-4-sonnet", name: "Claude 4 Sonnet", provider: "Anthropic", description: "Criativo e detalhado" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", description: "Contexto extenso" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", description: "Rápido e eficiente" },
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
}

export function AgentChatModal({ open, onOpenChange, agent, onModelChange }: AgentChatModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(agent.preferred_model || "gpt-4o");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Script generation state
  const [showScriptForm, setShowScriptForm] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptDuration, setScriptDuration] = useState("5");
  const [scriptLanguage, setScriptLanguage] = useState("pt-BR");
  const [ctaInicio, setCtaInicio] = useState(false);
  const [ctaMeio, setCtaMeio] = useState(false);
  const [ctaFinal, setCtaFinal] = useState(true);

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
  const wordsPerMinute = 130;
  const estimatedWords = parseInt(scriptDuration || "1") * wordsPerMinute;
  const estimatedParts = Math.max(1, Math.ceil(parseInt(scriptDuration || "1") / 3));
  
  const getCreditsForModel = () => {
    const durationNum = parseInt(scriptDuration || "1");
    if (selectedModel.includes("gemini")) return Math.ceil(durationNum * 2.4);
    if (selectedModel.includes("gpt") || selectedModel.includes("claude")) return Math.ceil(durationNum * 2.8);
    return Math.ceil(durationNum * 2);
  };
  const estimatedCredits = getCreditsForModel();

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
    
    try {
      const ctaPositions = [];
      if (ctaInicio) ctaPositions.push("início (primeiros 30 segundos)");
      if (ctaMeio) ctaPositions.push("meio (metade do vídeo)");
      if (ctaFinal) ctaPositions.push("final (últimos 30 segundos)");

      const maxDuration = 8;
      const adjustedDuration = parseInt(scriptDuration || "1") > maxDuration ? maxDuration : parseInt(scriptDuration || "1");

      const prompt = `
Gere um roteiro completo para um vídeo com o título: "${scriptTitle}"

ESPECIFICAÇÕES DO VÍDEO:
- Duração: ${adjustedDuration} minutos (~${estimatedWords} palavras)
- Partes: ${estimatedParts} partes de ~${Math.ceil(adjustedDuration / estimatedParts)} minutos cada
- Idioma: ${scriptLanguage === "pt-BR" ? "Português (Brasil)" : scriptLanguage === "en-US" ? "English (US)" : "Español"}
- Incluir CTA em: ${ctaPositions.length > 0 ? ctaPositions.join(", ") : "final do vídeo"}

Gere um roteiro completo seguindo a estrutura e fórmula do agente, otimizado para engajamento viral.
      `.trim();

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "generate_script_with_formula",
          prompt,
          model: selectedModel,
          duration: adjustedDuration,
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

      const scriptContent = typeof data?.result === 'string' ? data.result : JSON.stringify(data?.result, null, 2);

      // Save script
      await supabase
        .from('generated_scripts')
        .insert({
          user_id: user.id,
          agent_id: agent.id,
          title: scriptTitle,
          content: scriptContent,
          duration: adjustedDuration,
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

      // Add script to chat as assistant message
      const scriptMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `📝 **ROTEIRO GERADO: ${scriptTitle}**\n\n${scriptContent}`,
        timestamp: new Date(),
        isScript: true
      };
      setMessages(prev => [...prev, scriptMessage]);
      
      setShowScriptForm(false);
      setScriptTitle("");
      toast.success(`Roteiro gerado! (${data?.creditsUsed || estimatedCredits} créditos)`);
      
    } catch (error) {
      console.error("[GenerateScript] Error:", error);
      toast.error("Erro ao gerar roteiro. Tente novamente.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const copyToClipboard = (content: string) => {
    const cleanContent = content.replace(/^📝 \*\*ROTEIRO GERADO:.*?\*\*\n\n/, '');
    navigator.clipboard.writeText(cleanContent);
    toast.success("Roteiro copiado!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-primary/30 rounded-2xl max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center border border-primary/30">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{agent.name}</p>
                {agent.niche && (
                  <p className="text-xs text-muted-foreground font-normal">
                    {agent.niche}{agent.sub_niche ? ` • ${agent.sub_niche}` : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger className="w-[180px] h-8 text-xs bg-background/50 border-border/50">
                  <Sparkles className="w-3 h-3 mr-1.5 text-primary" />
                  <SelectValue placeholder="Modelo" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="text-muted-foreground hover:text-foreground"
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
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] opacity-60">
                      {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {message.isScript && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message.content)}
                        className="h-6 px-2 text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copiar
                      </Button>
                    )}
                  </div>
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
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Gerando roteiro...</span>
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
                  <SelectContent>
                    <SelectItem value="pt-BR">Português</SelectItem>
                    <SelectItem value="en-US">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

            <Button
              onClick={handleGenerateScript}
              disabled={!scriptTitle.trim() || isGeneratingScript}
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
  );
}