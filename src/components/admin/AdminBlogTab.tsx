import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  FileText,
  Plus,
  Sparkles,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Globe,
  GlobeLock,
  RefreshCw,
  Search,
  Image,
  ImagePlus,
  Youtube,
  Newspaper,
  Type,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  read_time: string | null;
  image_url: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

const CATEGORIES = [
  "YouTube",
  "Monetização",
  "SEO",
  "Thumbnails",
  "Roteiros",
  "Shorts",
  "Ferramentas",
  "Crescimento",
  "Dark Channels",
  "Afiliados",
];

export const AdminBlogTab = () => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingCover, setGeneratingCover] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Generate modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generateMode, setGenerateMode] = useState<"keyword" | "youtube" | "news">("keyword");
  const [generateTopic, setGenerateTopic] = useState("");
  const [generateYoutubeUrl, setGenerateYoutubeUrl] = useState("");
  const [generateCategory, setGenerateCategory] = useState("YouTube");
  const [generateWithCover, setGenerateWithCover] = useState(true);
  const [generateCoverStyle, setGenerateCoverStyle] = useState("cinematic");

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "YouTube",
    read_time: "5 min",
    meta_description: "",
    image_url: "",
  });

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState<BlogArticle | null>(null);

  // Preview modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<BlogArticle | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("blog_articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Erro ao carregar artigos");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateArticle = async () => {
    if (generateMode === "keyword" && !generateTopic.trim()) {
      toast.error("Digite um tópico para o artigo");
      return;
    }
    if (generateMode === "youtube" && !generateYoutubeUrl.trim()) {
      toast.error("Cole a URL do vídeo do YouTube");
      return;
    }
    if (generateMode === "news" && !generateTopic.trim()) {
      toast.error("Digite o tópico da notícia");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-article", {
        body: { 
          topic: generateTopic, 
          category: generateCategory,
          mode: generateMode,
          youtubeUrl: generateYoutubeUrl,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const article = data.article;

      // Save to database
      const { data: savedArticle, error: saveError } = await supabase
        .from("blog_articles")
        .insert({
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          category: generateCategory,
          read_time: article.read_time,
          meta_description: article.meta_description,
          meta_keywords: article.meta_keywords,
          is_published: false,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Generate cover image if enabled
      if (generateWithCover && savedArticle) {
        toast.info("Gerando imagem de capa...");
        try {
          const { data: coverData, error: coverError } = await supabase.functions.invoke(
            "generate-blog-cover",
            {
              body: {
                title: article.title,
                category: generateCategory,
                articleId: savedArticle.id,
                style: generateCoverStyle,
              },
            }
          );

          if (coverError) {
            console.error("Error generating cover:", coverError);
            toast.warning("Artigo criado, mas houve erro na imagem de capa");
          } else if (coverData?.image_url) {
            toast.success("Imagem de capa gerada!");
          }
        } catch (coverErr) {
          console.error("Cover generation failed:", coverErr);
          toast.warning("Artigo criado, mas houve erro na imagem de capa");
        }
      }

      toast.success("Artigo gerado com sucesso!");
      setGenerateModalOpen(false);
      setGenerateTopic("");
      setGenerateYoutubeUrl("");
      setGenerateMode("keyword");
      fetchArticles();
    } catch (error: any) {
      console.error("Error generating article:", error);
      toast.error(error.message || "Erro ao gerar artigo");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateCover = async (article: BlogArticle) => {
    setGeneratingCover(article.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-cover", {
        body: {
          title: article.title,
          category: article.category,
          articleId: article.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Imagem de capa gerada com sucesso!");
      fetchArticles();
    } catch (error: any) {
      console.error("Error generating cover:", error);
      toast.error(error.message || "Erro ao gerar imagem de capa");
    } finally {
      setGeneratingCover(null);
    }
  };

  const handleEditArticle = (article: BlogArticle) => {
    setEditingArticle(article);
    setEditForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || "",
      content: article.content,
      category: article.category,
      read_time: article.read_time || "5 min",
      meta_description: article.meta_description || "",
      image_url: article.image_url || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveArticle = async () => {
    if (!editingArticle) return;

    try {
      const { error } = await supabase
        .from("blog_articles")
        .update({
          title: editForm.title,
          slug: editForm.slug,
          excerpt: editForm.excerpt,
          content: editForm.content,
          category: editForm.category,
          read_time: editForm.read_time,
          meta_description: editForm.meta_description,
          image_url: editForm.image_url || null,
        })
        .eq("id", editingArticle.id);

      if (error) throw error;

      toast.success("Artigo atualizado!");
      setEditModalOpen(false);
      fetchArticles();
    } catch (error) {
      console.error("Error saving article:", error);
      toast.error("Erro ao salvar artigo");
    }
  };

  const handleTogglePublish = async (article: BlogArticle) => {
    try {
      const newStatus = !article.is_published;
      const { error } = await supabase
        .from("blog_articles")
        .update({
          is_published: newStatus,
          published_at: newStatus ? new Date().toISOString() : null,
        })
        .eq("id", article.id);

      if (error) throw error;

      toast.success(newStatus ? "Artigo publicado!" : "Artigo despublicado!");
      fetchArticles();
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast.error("Erro ao alterar status");
    }
  };

  const handleDeleteArticle = async () => {
    if (!deletingArticle) return;

    try {
      const { error } = await supabase
        .from("blog_articles")
        .delete()
        .eq("id", deletingArticle.id);

      if (error) throw error;

      toast.success("Artigo excluído!");
      setDeleteDialogOpen(false);
      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Erro ao excluir artigo");
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      !searchTerm ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || article.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && article.is_published) ||
      (filterStatus === "draft" && !article.is_published);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Gerador de Artigos</h3>
          <p className="text-sm text-muted-foreground">
            Crie artigos automaticamente com IA para o blog
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchArticles} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={() => setGenerateModalOpen(true)}>
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar Artigo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total de Artigos</p>
          <p className="text-2xl font-bold text-foreground">{articles.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Publicados</p>
          <p className="text-2xl font-bold text-success">
            {articles.filter((a) => a.is_published).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Rascunhos</p>
          <p className="text-2xl font-bold text-primary">
            {articles.filter((a) => !a.is_published).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Categorias</p>
          <p className="text-2xl font-bold text-foreground">
            {new Set(articles.map((a) => a.category)).size}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar artigos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Rascunhos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Articles List */}
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">Nenhum artigo encontrado</h4>
            <p className="text-muted-foreground mb-4">
              Clique em "Gerar Artigo" para criar seu primeiro artigo com IA
            </p>
            <Button onClick={() => setGenerateModalOpen(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Primeiro Artigo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-16 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                    {article.image_url ? (
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground truncate">{article.title}</h4>
                      {article.is_published ? (
                        <Badge className="bg-success/20 text-success border-success/50">
                          <Globe className="w-3 h-3 mr-1" />
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <GlobeLock className="w-3 h-3 mr-1" />
                          Rascunho
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{article.category}</span>
                      <span>•</span>
                      <span>{article.read_time}</span>
                      <span>•</span>
                      <span>{new Date(article.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleGenerateCover(article)}
                    disabled={generatingCover === article.id}
                    title="Gerar imagem de capa"
                  >
                    {generatingCover === article.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImagePlus className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPreviewArticle(article);
                      setPreviewModalOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEditArticle(article)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePublish(article)}
                  >
                    {article.is_published ? "Despublicar" : "Publicar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setDeletingArticle(article);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Generate Modal */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Gerar Artigo com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Mode Selection */}
            <Tabs value={generateMode} onValueChange={(v) => setGenerateMode(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="keyword" className="gap-1.5">
                  <Type className="w-4 h-4" />
                  Palavra-chave
                </TabsTrigger>
                <TabsTrigger value="youtube" className="gap-1.5">
                  <Youtube className="w-4 h-4" />
                  YouTube
                </TabsTrigger>
                <TabsTrigger value="news" className="gap-1.5">
                  <Newspaper className="w-4 h-4" />
                  Notícias
                </TabsTrigger>
              </TabsList>

              <TabsContent value="keyword" className="mt-4 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Tópico do Artigo
                  </label>
                  <Input
                    placeholder="Ex: Como criar thumbnails que viralizam"
                    value={generateTopic}
                    onChange={(e) => setGenerateTopic(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A IA vai criar um artigo completo sobre este tópico
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="youtube" className="mt-4 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    URL do Vídeo do YouTube
                  </label>
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    value={generateYoutubeUrl}
                    onChange={(e) => setGenerateYoutubeUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O vídeo será transcrito e transformado em artigo
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Foco do Artigo (opcional)
                  </label>
                  <Input
                    placeholder="Ex: Principais insights do vídeo"
                    value={generateTopic}
                    onChange={(e) => setGenerateTopic(e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="news" className="mt-4 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Tópico da Notícia
                  </label>
                  <Input
                    placeholder="Ex: Novas regras de monetização do YouTube 2025"
                    value={generateTopic}
                    onChange={(e) => setGenerateTopic(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A IA vai pesquisar tendências e criar um artigo atualizado
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Categoria</label>
              <Select value={generateCategory} onValueChange={setGenerateCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="generateWithCover"
                  checked={generateWithCover}
                  onChange={(e) => setGenerateWithCover(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="generateWithCover" className="text-sm text-muted-foreground">
                  Gerar imagem de capa automaticamente
                </label>
              </div>
              {generateWithCover && (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Estilo Visual da Capa
                  </label>
                  <Select value={generateCoverStyle} onValueChange={setGenerateCoverStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cinematic">🎬 Cinematográfico</SelectItem>
                      <SelectItem value="minimalist">✨ Minimalista</SelectItem>
                      <SelectItem value="colorful">🌈 Colorido</SelectItem>
                      <SelectItem value="tech">💻 Tech/Futurista</SelectItem>
                      <SelectItem value="gradient">🎨 Gradiente Abstrato</SelectItem>
                      <SelectItem value="neon">🔮 Neon/Cyberpunk</SelectItem>
                      <SelectItem value="professional">📊 Profissional/Corporativo</SelectItem>
                      <SelectItem value="creative">🎭 Artístico/Criativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateArticle} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {generateMode === "youtube" ? "Transcrevendo..." : "Gerando..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Artigo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Título</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Slug</label>
                <Input
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Categoria</label>
                <Select
                  value={editForm.category}
                  onValueChange={(v) => setEditForm({ ...editForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Tempo de Leitura
                </label>
                <Input
                  value={editForm.read_time}
                  onChange={(e) => setEditForm({ ...editForm, read_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">URL da Imagem</label>
              <Input
                value={editForm.image_url}
                onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Resumo</label>
              <Textarea
                value={editForm.excerpt}
                onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Meta Description</label>
              <Textarea
                value={editForm.meta_description}
                onChange={(e) => setEditForm({ ...editForm, meta_description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Conteúdo (HTML)</label>
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={12}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveArticle}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewArticle?.title}</DialogTitle>
          </DialogHeader>
          {previewArticle && (
            <div className="py-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <Badge>{previewArticle.category}</Badge>
                <span>{previewArticle.read_time}</span>
              </div>
              {previewArticle.excerpt && (
                <p className="text-muted-foreground italic mb-6">{previewArticle.excerpt}</p>
              )}
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewArticle.content }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Artigo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingArticle?.title}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteArticle}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
