import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bot, 
  Plus, 
  Settings, 
  Trash2, 
  FileText, 
  MessageSquare, 
  ArrowLeft,
  Loader2,
  Rocket,
  Pencil,
  Check,
  X,
  Clock,
  Zap,
  Target
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ScriptAgent {
  id: string;
  name: string;
  niche: string | null;
  sub_niche: string | null;
  formula: string | null;
  formula_structure: any;
  based_on_title: string | null;
  mental_triggers: string[] | null;
  times_used: number | null;
  created_at: string;
  updated_at: string;
}

const ViralAgents = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<ScriptAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<ScriptAgent | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showNewAgentModal, setShowNewAgentModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // New agent form
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentNiche, setNewAgentNiche] = useState("");
  const [newAgentSubniche, setNewAgentSubniche] = useState("");
  const [creatingAgent, setCreatingAgent] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadAgents();
    }
  }, [user?.id]);

  const loadAgents = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('script_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error loading agents:', error);
      toast.error('Erro ao carregar agentes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!deletingId) return;
    
    try {
      const { error } = await supabase
        .from('script_agents')
        .delete()
        .eq('id', deletingId);

      if (error) throw error;

      setAgents(prev => prev.filter(a => a.id !== deletingId));
      if (selectedAgent?.id === deletingId) {
        setSelectedAgent(null);
      }
      toast.success("Agente excluído!");
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Erro ao excluir agente');
    } finally {
      setShowDeleteDialog(false);
      setDeletingId(null);
    }
  };

  const handleUpdateName = async () => {
    if (!selectedAgent || !newName.trim()) return;
    
    setSavingName(true);
    try {
      const { error } = await supabase
        .from('script_agents')
        .update({ name: newName.trim() })
        .eq('id', selectedAgent.id);

      if (error) throw error;

      setAgents(prev => prev.map(a => 
        a.id === selectedAgent.id ? { ...a, name: newName.trim() } : a
      ));
      setSelectedAgent({ ...selectedAgent, name: newName.trim() });
      setEditingName(false);
      toast.success("Nome atualizado!");
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Erro ao atualizar nome');
    } finally {
      setSavingName(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!user?.id || !newAgentName.trim()) {
      toast.error("Digite um nome para o agente");
      return;
    }

    setCreatingAgent(true);
    try {
      const { data, error } = await supabase
        .from('script_agents')
        .insert({
          user_id: user.id,
          name: newAgentName.trim(),
          niche: newAgentNiche.trim() || null,
          sub_niche: newAgentSubniche.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      setAgents(prev => [data, ...prev]);
      setShowNewAgentModal(false);
      setNewAgentName("");
      setNewAgentNiche("");
      setNewAgentSubniche("");
      toast.success("Agente criado com sucesso!");
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Erro ao criar agente');
    } finally {
      setCreatingAgent(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center border border-primary/30">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Agentes Virais</h1>
                <p className="text-muted-foreground text-sm">
                  Crie e gerencie agentes de IA personalizados com memória, instruções e arquivos
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowNewAgentModal(true)}
              className="bg-gradient-to-r from-primary to-amber-500 text-primary-foreground hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Agente
            </Button>
          </motion.div>

          <AnimatePresence mode="wait">
            {selectedAgent ? (
              /* Agent Detail View */
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Agent Header */}
                    <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50 rounded-2xl">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedAgent(null)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </Button>
                          <div className="flex-1">
                            {editingName ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={newName}
                                  onChange={(e) => setNewName(e.target.value)}
                                  className="h-9 text-xl font-bold"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateName();
                                    if (e.key === 'Escape') setEditingName(false);
                                  }}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={handleUpdateName}
                                  disabled={savingName}
                                  className="text-green-500 hover:text-green-600"
                                >
                                  {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditingName(false)}
                                  className="text-muted-foreground"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <h2 className="text-2xl font-bold text-foreground">{selectedAgent.name}</h2>
                            )}
                            {selectedAgent.based_on_title && (
                              <p className="text-muted-foreground text-sm mt-1">
                                Agente gerado automaticamente a partir do vídeo "{selectedAgent.based_on_title}". 
                                Nicho: {selectedAgent.niche || 'N/A'} | Subnicho: {selectedAgent.sub_niche || 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setNewName(selectedAgent.name);
                              setEditingName(true);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Settings className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingId(selectedAgent.id);
                              setShowDeleteDialog(true);
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </Card>

                    {/* Conversations Section */}
                    <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50 rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">Conversas</h3>
                        <span className="text-sm text-muted-foreground">Chat desativado nesta área.</span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-foreground">Conversas Anteriores</h4>
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                          <Plus className="w-4 h-4 mr-2" />
                          Nova Conversa
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                          <p className="font-medium text-foreground">Nova Conversa</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date().toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    {/* Memory Card */}
                    <Card className="p-4 bg-card/50 backdrop-blur-xl border-border/50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-primary font-medium">Memória</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>🔒 Apenas você</span>
                          <Button variant="ghost" size="icon" className="w-6 h-6">
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">Nenhuma memória definida</p>
                      <p className="text-xs text-muted-foreground mt-2">Última atualização hoje</p>
                    </Card>

                    {/* Instructions Card */}
                    <Card className="p-4 bg-card/50 backdrop-blur-xl border-border/50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-primary font-medium">Instruções</span>
                        <Button variant="ghost" size="icon" className="w-6 h-6">
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>
                      {selectedAgent.formula ? (
                        <p className="text-sm text-muted-foreground line-clamp-4">
                          {selectedAgent.formula}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma instrução definida</p>
                      )}
                    </Card>

                    {/* Triggers Card */}
                    {selectedAgent.mental_triggers && selectedAgent.mental_triggers.length > 0 && (
                      <Card className="p-4 bg-card/50 backdrop-blur-xl border-border/50 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-primary font-medium">Gatilhos Mentais</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedAgent.mental_triggers.map((trigger, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Files Card */}
                    <Card className="p-4 bg-card/50 backdrop-blur-xl border-border/50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-primary font-medium">Arquivos</span>
                        <Button variant="ghost" size="icon" className="w-6 h-6">
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">Nenhum arquivo</p>
                      <div className="mt-3">
                        <div className="h-1 bg-border rounded-full overflow-hidden">
                          <div className="h-full w-[1%] bg-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">1% da capacidade do projeto utilizada</p>
                      </div>
                    </Card>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Agents Grid */
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : agents.length === 0 ? (
                  <Card className="p-16 text-center bg-card/30 backdrop-blur-xl border-border/30 rounded-2xl">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center mx-auto mb-6 border border-primary/20">
                      <Bot className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Nenhum agente criado</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      Crie agentes de IA personalizados para gerar roteiros baseados em fórmulas virais extraídas de vídeos de sucesso
                    </p>
                    <Button
                      onClick={() => setShowNewAgentModal(true)}
                      className="bg-gradient-to-r from-primary to-amber-500 text-primary-foreground"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Agente
                    </Button>
                  </Card>
                ) : (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {agents.map((agent) => (
                      <motion.div key={agent.id} variants={itemVariants}>
                        <Card 
                          className="p-5 bg-card/50 backdrop-blur-xl border-border/50 rounded-2xl hover:border-primary/30 transition-all duration-300 cursor-pointer group"
                          onClick={() => setSelectedAgent(agent)}
                        >
                          <h3 className="font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                            {agent.name}
                          </h3>
                          
                          {agent.based_on_title && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              Agente gerado automaticamente a partir do vídeo "{agent.based_on_title}". 
                              Nicho: {agent.niche || 'N/A'} | Subnicho: {agent.sub_niche || 'N/A'}
                            </p>
                          )}
                          
                          {!agent.based_on_title && agent.niche && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {agent.niche}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 mb-4">
                            {agent.niche && (
                              <Badge variant="secondary" className="bg-background/50 text-foreground text-xs">
                                {agent.niche}
                              </Badge>
                            )}
                            {agent.sub_niche && (
                              <Badge variant="secondary" className="bg-background/50 text-foreground text-xs">
                                {agent.sub_niche}
                              </Badge>
                            )}
                            {agent.formula && (
                              <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Fórmula Viral
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              <span>0 arquivos</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{agent.times_used || 0} conversas</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(agent.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New Agent Modal */}
      <Dialog open={showNewAgentModal} onOpenChange={setShowNewAgentModal}>
        <DialogContent className="bg-card border-primary/30 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Criar Novo Agente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Nome do Agente *</label>
              <Input
                placeholder="Ex: Agente de Histórias"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Nicho</label>
              <Input
                placeholder="Ex: Histórias, Finanças, Curiosidades..."
                value={newAgentNiche}
                onChange={(e) => setNewAgentNiche(e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Subnicho</label>
              <Input
                placeholder="Ex: Histórias de Conflitos, Investimentos..."
                value={newAgentSubniche}
                onChange={(e) => setNewAgentSubniche(e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowNewAgentModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAgent}
                disabled={creatingAgent || !newAgentName.trim()}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {creatingAgent ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Criar Agente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default ViralAgents;
