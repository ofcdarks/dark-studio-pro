import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Library, 
  Search, 
  Eye, 
  ThumbsUp, 
  Play, 
  Plus, 
  Trash2, 
  Loader2, 
  FileText, 
  Image, 
  Bot, 
  ScrollText,
  Heart,
  Copy,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSearchParams } from "react-router-dom";
import { GenerateScriptModal } from "@/components/library/GenerateScriptModal";

interface ViralVideo {
  id: string;
  title: string | null;
  video_url: string;
  views: string | null;
  likes: string | null;
  duration: string | null;
  notes: string | null;
}

interface ScriptAgent {
  id: string;
  name: string;
  niche: string | null;
  sub_niche: string | null;
  based_on_title: string | null;
  formula: string | null;
  formula_structure: any;
  mental_triggers: string[] | null;
  times_used: number;
  created_at: string;
}

const ViralLibrary = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "titles");
  const [searchTerm, setSearchTerm] = useState("");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [viewsFilter, setViewsFilter] = useState("all");
  const [showFavorites, setShowFavorites] = useState(false);
  const [videos, setVideos] = useState<ViralVideo[]>([]);
  const [agents, setAgents] = useState<ScriptAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVideo, setNewVideo] = useState({ title: '', video_url: '', notes: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ScriptAgent | null>(null);

  useEffect(() => {
    if (user) {
      fetchVideos();
      fetchAgents();
    }
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('viral_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('script_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleAddVideo = async () => {
    if (!user || !newVideo.video_url.trim()) {
      toast.error('URL do vídeo é obrigatória');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('viral_library')
        .insert({
          user_id: user.id,
          title: newVideo.title || 'Vídeo sem título',
          video_url: newVideo.video_url,
          notes: newVideo.notes
        });

      if (error) throw error;
      toast.success('Vídeo adicionado à biblioteca!');
      setNewVideo({ title: '', video_url: '', notes: '' });
      setDialogOpen(false);
      fetchVideos();
    } catch (error) {
      console.error('Error adding video:', error);
      toast.error('Erro ao adicionar vídeo');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('viral_library')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Vídeo removido!');
      setVideos(videos.filter(v => v.id !== id));
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Erro ao remover vídeo');
    }
  };

  const handleDeleteAgent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('script_agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Agente removido!');
      setAgents(agents.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Erro ao remover agente');
    }
  };

  const handleAnalyzeVideo = async (video: ViralVideo) => {
    toast.info('Redirecionando para análise...');
    window.location.href = `/viral-analysis?url=${encodeURIComponent(video.video_url)}`;
  };

  const handleUseAgent = (agent: ScriptAgent) => {
    setSelectedAgent(agent);
    setGenerateModalOpen(true);
  };

  const handleCopyFormula = async (id: string, formula: string) => {
    await navigator.clipboard.writeText(formula);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Fórmula copiada!");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const filteredVideos = videos.filter(v => 
    v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAgents = agents.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.niche?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.sub_niche?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">📚</span>
              <h1 className="text-4xl font-bold text-foreground">Biblioteca de Títulos e Thumbnails Virais</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Acesse todos os títulos e thumbnails que geraram milhões de views
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 mb-8">
              <TabsTrigger 
                value="titles" 
                className="text-base px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
              >
                <FileText className="w-5 h-5 mr-2" />
                Títulos Virais
              </TabsTrigger>
              <TabsTrigger 
                value="thumbnails" 
                className="text-base px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
              >
                <Image className="w-5 h-5 mr-2" />
                Thumbnails Virais
              </TabsTrigger>
              <TabsTrigger 
                value="agents" 
                className="text-base px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
              >
                <Bot className="w-5 h-5 mr-2" />
                Agentes de Roteiro
              </TabsTrigger>
              <TabsTrigger 
                value="scripts" 
                className="text-base px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
              >
                <ScrollText className="w-5 h-5 mr-2" />
                Roteiros Gerados
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <Card className="p-6 mb-8 border-border/50">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Buscar títulos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-secondary border-border h-12 text-base"
                  />
                </div>
                <Select value={nicheFilter} onValueChange={setNicheFilter}>
                  <SelectTrigger className="w-[200px] bg-secondary border-border h-12 text-base">
                    <SelectValue placeholder="Todos os Nichos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Nichos</SelectItem>
                    <SelectItem value="history">História</SelectItem>
                    <SelectItem value="education">Educação</SelectItem>
                    <SelectItem value="entertainment">Entretenimento</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={viewsFilter} onValueChange={setViewsFilter}>
                  <SelectTrigger className="w-[200px] bg-secondary border-border h-12 text-base">
                    <SelectValue placeholder="Todas as Views" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Views</SelectItem>
                    <SelectItem value="1m">+1M Views</SelectItem>
                    <SelectItem value="500k">+500K Views</SelectItem>
                    <SelectItem value="100k">+100K Views</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant={showFavorites ? "default" : "outline"} 
                  onClick={() => setShowFavorites(!showFavorites)}
                  className="h-12 text-base px-6"
                >
                  <Heart className={`w-5 h-5 mr-2 ${showFavorites ? 'fill-current' : ''}`} />
                  Apenas Favoritos
                </Button>
              </div>
            </Card>

            {/* Titles Tab */}
            <TabsContent value="titles" className="mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredVideos.length === 0 ? (
                <Card className="p-12 text-center border-border/50">
                  <Library className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Biblioteca de títulos vazia</h3>
                  <p className="text-lg text-muted-foreground">
                    Analise vídeos para adicionar títulos à biblioteca
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVideos.map((video) => (
                    <Card key={video.id} className="p-6 border-border/50 hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-bold text-lg text-foreground line-clamp-2 flex-1">{video.title}</h3>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <Heart className="w-5 h-5" />
                        </Button>
                      </div>
                      
                      <div className="flex gap-2 mb-4">
                        <Badge className="bg-primary/20 text-primary border-0">História</Badge>
                        <Badge variant="outline">Mistérios</Badge>
                      </div>

                      <div className="flex gap-4 mb-4">
                        <div className="bg-secondary/50 px-4 py-2 rounded-lg flex-1">
                          <p className="text-xs text-muted-foreground">Views Originais</p>
                          <p className="text-lg font-bold text-foreground">{video.views || "1.3K"}</p>
                        </div>
                        <div className="bg-secondary/50 px-4 py-2 rounded-lg flex-1">
                          <p className="text-xs text-muted-foreground">Score Viral em Potencial</p>
                          <p className="text-lg font-bold text-primary">0/10</p>
                        </div>
                      </div>

                      {video.notes && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">Fórmula</p>
                          <p className="text-sm text-foreground">{video.notes}</p>
                        </div>
                      )}

                      <Button 
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-base"
                        onClick={() => handleCopyFormula(video.id, video.notes || video.title || "")}
                      >
                        {copiedId === video.id ? (
                          <>
                            <Check className="w-5 h-5 mr-2" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5 mr-2" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Thumbnails Tab */}
            <TabsContent value="thumbnails" className="mt-0">
              <Card className="p-12 text-center border-border/50">
                <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Biblioteca de thumbnails vazia</h3>
                <p className="text-lg text-muted-foreground">
                  Analise vídeos para adicionar thumbnails à biblioteca
                </p>
              </Card>
            </TabsContent>

            {/* Agents Tab */}
            <TabsContent value="agents" className="mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredAgents.length === 0 ? (
                <Card className="p-12 text-center border-border/50">
                  <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum agente criado</h3>
                  <p className="text-lg text-muted-foreground">
                    Analise vídeos e crie agentes de roteiro baseados nas fórmulas virais
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAgents.map((agent) => (
                    <Card key={agent.id} className="p-6 border-border/50 hover:border-primary/50 transition-colors">
                      <h3 className="font-bold text-xl text-foreground mb-3">{agent.name}</h3>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-base">
                          <span className="text-primary font-medium">Nicho:</span>{" "}
                          <span className="text-foreground">{agent.niche || "Não definido"}</span>
                        </p>
                        <p className="text-base">
                          <span className="text-primary font-medium">Sub-nicho:</span>{" "}
                          <span className="text-foreground">{agent.sub_niche || "Não definido"}</span>
                        </p>
                        {agent.based_on_title && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            Baseado em: {agent.based_on_title}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Usado {agent.times_used} vezes
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button 
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base"
                          onClick={() => handleUseAgent(agent)}
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Usar Agente
                        </Button>
                        <Button 
                          variant="destructive"
                          size="icon"
                          className="h-12 w-12"
                          onClick={() => handleDeleteAgent(agent.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Scripts Tab */}
            <TabsContent value="scripts" className="mt-0">
              <Card className="p-12 text-center border-border/50">
                <ScrollText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum roteiro gerado</h3>
                <p className="text-lg text-muted-foreground">
                  Use os agentes para gerar roteiros virais
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Generate Script Modal */}
      <GenerateScriptModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        agent={selectedAgent}
      />
    </MainLayout>
  );
};

export default ViralLibrary;
