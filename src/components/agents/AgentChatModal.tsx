import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, User, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
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
}

interface AgentChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: ScriptAgent;
}

export function AgentChatModal({ open, onOpenChange, agent }: AgentChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      // Add welcome message
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Olá! Sou o agente "${agent.name}". ${agent.niche ? `Especializado em ${agent.niche}${agent.sub_niche ? ` - ${agent.sub_niche}` : ''}.` : ''} Como posso ajudar você hoje?`,
        timestamp: new Date()
      }]);
    }
  }, [open, agent]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const buildSystemPrompt = () => {
    let systemPrompt = `Você é "${agent.name}", um agente de IA especializado em criar conteúdo viral para YouTube.`;
    
    if (agent.niche) {
      systemPrompt += `\nSeu nicho de especialização é: ${agent.niche}`;
    }
    if (agent.sub_niche) {
      systemPrompt += ` - Subnicho: ${agent.sub_niche}`;
    }
    if (agent.formula) {
      systemPrompt += `\n\nSuas instruções/fórmula de trabalho:\n${agent.formula}`;
    }
    if (agent.formula_structure?.memory) {
      systemPrompt += `\n\nMemória do agente (informações importantes):\n${agent.formula_structure.memory}`;
    }
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
      // Build conversation history for context
      const conversationHistory = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({
          role: m.role,
          content: m.content
        }));

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
          model: "gpt-4o"
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

      // Increment times_used
      await supabase
        .from('script_agents')
        .update({ times_used: (agent.times_used || 0) + 1 })
        .eq('id', agent.id);

    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: `Olá! Sou o agente "${agent.name}". ${agent.niche ? `Especializado em ${agent.niche}${agent.sub_niche ? ` - ${agent.sub_niche}` : ''}.` : ''} Como posso ajudar você hoje?`,
      timestamp: new Date()
    }]);
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
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="text-muted-foreground hover:text-foreground"
              title="Limpar conversa"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
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
                  <p className="text-[10px] opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
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
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2">
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
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
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
            Cada mensagem consome créditos da plataforma
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
