import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Image, 
  Upload, 
  Sparkles, 
  Loader2, 
  Trash2,
  Lightbulb,
  Wand2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ReferenceThumbnail {
  id: string;
  image_url: string;
  channel_name: string | null;
  niche: string | null;
  sub_niche: string | null;
  description: string | null;
  extracted_prompt: string | null;
  folder_id: string | null;
  created_at: string;
}

interface ThumbnailLibraryProps {
  currentNiche?: string;
  currentSubNiche?: string;
  currentTitle?: string;
  onGenerateThumbnail?: (prompt: string, title: string) => void;
}

export function ThumbnailLibrary({ 
  currentNiche, 
  currentSubNiche, 
  currentTitle,
  onGenerateThumbnail 
}: ThumbnailLibraryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Upload states
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [channelName, setChannelName] = useState("");
  const [niche, setNiche] = useState(currentNiche || "");
  const [subNiche, setSubNiche] = useState(currentSubNiche || "");
  const [description, setDescription] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("none");
  
  // Analysis states
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisModel, setAnalysisModel] = useState("auto");
  
  // Generation states
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [videoTitle, setVideoTitle] = useState(currentTitle || "");
  const [selectedPrompt, setSelectedPrompt] = useState<string>("1");
  const [genModel, setGenModel] = useState("gpt-4o");
  const [genLanguage, setGenLanguage] = useState("pt-BR");
  const [artStyle, setArtStyle] = useState("realistic");
  const [includeHeadline, setIncludeHeadline] = useState(true);
  const [useTitle, setUseTitle] = useState(false);

  // Fetch folders
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

  // Fetch saved thumbnails
  const { data: savedThumbnails, isLoading: loadingThumbnails } = useQuery({
    queryKey: ["reference-thumbnails", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("reference_thumbnails")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return (data || []) as ReferenceThumbnail[];
    },
    enabled: !!user,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo é 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    
    setUploading(true);
    try {
      // Upload to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("reference-thumbnails")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("reference-thumbnails")
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from("reference_thumbnails")
        .insert({
          user_id: user.id,
          image_url: urlData.publicUrl,
          folder_id: selectedFolder !== "none" ? selectedFolder : null,
          channel_name: channelName || null,
          niche: niche || null,
          sub_niche: subNiche || null,
          description: description || null,
        });

      if (dbError) throw dbError;

      toast({ title: "Upload concluído!", description: "Thumbnail salva com sucesso" });
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setChannelName("");
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Refresh list
      queryClient.invalidateQueries({ queryKey: ["reference-thumbnails"] });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload da thumbnail",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyzeStyle = async () => {
    if (!savedThumbnails || savedThumbnails.length === 0) {
      toast({
        title: "Sem thumbnails",
        description: "Faça upload de pelo menos uma thumbnail de referência",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      // Call AI to analyze thumbnails and extract prompts
      const response = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "analyze_thumbnails",
          thumbnails: savedThumbnails.slice(0, 5).map(t => ({
            url: t.image_url,
            niche: t.niche,
            subNiche: t.sub_niche,
          })),
          prompt: `Analise estas thumbnails de referência e extraia o padrão visual/estilo usado.
          Para cada thumbnail, crie um prompt detalhado que poderia ser usado para gerar uma thumbnail similar.
          Retorne um JSON com:
          - prompts: array de prompts (um para cada thumbnail)
          - commonStyle: descrição do estilo comum entre as thumbnails
          - colorPalette: cores predominantes
          - composition: descrição da composição típica`,
        },
      });

      if (response.error) throw response.error;

      // Update thumbnails with extracted prompts
      const result = response.data?.result;
      if (result?.prompts && Array.isArray(result.prompts)) {
        for (let i = 0; i < Math.min(result.prompts.length, savedThumbnails.length); i++) {
          await supabase
            .from("reference_thumbnails")
            .update({
              extracted_prompt: result.prompts[i],
              style_analysis: result,
            })
            .eq("id", savedThumbnails[i].id);
        }
      }

      toast({ title: "Análise concluída!", description: "Prompts padrão extraídos das thumbnails" });
      queryClient.invalidateQueries({ queryKey: ["reference-thumbnails"] });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar as thumbnails",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!videoTitle.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Digite o título do vídeo",
        variant: "destructive",
      });
      return;
    }

    const selectedThumb = savedThumbnails?.find((_, i) => String(i + 1) === selectedPrompt);
    const basePrompt = selectedThumb?.extracted_prompt || "";

    setGeneratingThumbnail(true);
    try {
      // Generate adapted prompt based on title and reference
      const response = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "generate_thumbnail_prompt",
          prompt: `Baseado neste prompt de referência de thumbnail:
          "${basePrompt}"
          
          Adapte o prompt para o seguinte título de vídeo:
          "${videoTitle}"
          
          Nicho: ${niche || "Geral"}
          Subnicho: ${subNiche || "Geral"}
          Estilo de arte: ${artStyle === "realistic" ? "Foto Realista - Ultra HD" : artStyle}
          Idioma: ${genLanguage}
          ${includeHeadline ? `Incluir headline: "${useTitle ? videoTitle : 'Gerar headline de impacto'}"` : "Sem texto na imagem"}
          
          Retorne um JSON com:
          - adaptedPrompt: o prompt adaptado para gerar a thumbnail
          - headline: a headline de impacto (se solicitado)
          - seoDescription: descrição SEO da thumbnail
          - tags: array de tags relevantes`,
        },
      });

      if (response.error) throw response.error;

      const result = response.data?.result;
      if (result?.adaptedPrompt && onGenerateThumbnail) {
        onGenerateThumbnail(result.adaptedPrompt, videoTitle);
      }

      toast({ title: "Prompt gerado!", description: "Use o prompt para gerar sua thumbnail" });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Erro na geração",
        description: "Não foi possível gerar o prompt",
        variant: "destructive",
      });
    } finally {
      setGeneratingThumbnail(false);
    }
  };

  const handleDeleteThumbnail = async (id: string) => {
    try {
      await supabase.from("reference_thumbnails").delete().eq("id", id);
      toast({ title: "Excluído!", description: "Thumbnail removida" });
      queryClient.invalidateQueries({ queryKey: ["reference-thumbnails"] });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível excluir", variant: "destructive" });
    }
  };

  const thumbnailsWithPrompts = savedThumbnails?.filter(t => t.extracted_prompt) || [];

  return (
    <div className="space-y-6">
      {/* Biblioteca de Thumbnails de Referência */}
      <Card className="p-6 border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Image className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Biblioteca de Thumbnails de Referência
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Faça upload de thumbnails do seu canal para que a IA sempre replique o estilo visual nas novas gerações.
        </p>

        {/* Upload Section */}
        <div className="bg-secondary/30 rounded-lg p-6 mb-6">
          <h4 className="font-medium text-foreground mb-2">Adicionar Thumbnail de Referência</h4>
          <p className="text-xs text-primary mb-4">
            <Lightbulb className="w-3 h-3 inline mr-1" />
            Os campos serão preenchidos automaticamente com os dados da análise atual
          </p>

          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Imagem da Thumbnail</label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="bg-secondary border-border"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos suportados: JPG, PNG, WebP (máx. 5MB)
              </p>
              {previewUrl && (
                <div className="mt-2 relative w-32 h-20 rounded overflow-hidden">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Folder Select */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Pasta (Opcional)</label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Nenhuma pasta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma pasta</SelectItem>
                  {folders?.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Associe esta thumbnail a uma pasta específica
              </p>
            </div>

            {/* Channel Name */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Nome do Canal (Opcional)</label>
              <Input
                placeholder="Ex: Meu Canal"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            {/* Niche & SubNiche */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Nicho</label>
                <Input
                  placeholder="Ex: História"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Subnicho</label>
                <Input
                  placeholder="Ex: Mistérios / Civilizações Antigas"
                  value={subNiche}
                  onChange={(e) => setSubNiche(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              A thumbnail será usada para gerar novas thumbnails deste nicho/subnicho específico
            </p>

            {/* Description */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Descrição (Opcional)</label>
              <Textarea
                placeholder="Descreva o estilo ou características desta thumbnail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary border-border"
                rows={2}
              />
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-primary text-primary-foreground"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload Thumbnail
            </Button>
          </div>
        </div>

        {/* Saved Thumbnails */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium text-foreground">Thumbnails Salvas</h4>
              {loadingThumbnails ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {savedThumbnails?.length || 0} thumbnail(s) de referência
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Modelo de IA para Análise:</label>
                <Select value={analysisModel} onValueChange={setAnalysisModel}>
                  <SelectTrigger className="w-48 bg-secondary border-border h-9">
                    <SelectValue placeholder="Escolher Automaticamente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Escolher Automaticamente</SelectItem>
                    <SelectItem value="gemini">Gemini 2.5 Flash</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAnalyzeStyle}
                disabled={analyzing || !savedThumbnails?.length}
                className="bg-primary text-primary-foreground mt-auto"
              >
                {analyzing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Analisar Estilo e Criar Prompt Padrão
              </Button>
            </div>
          </div>

          {/* Thumbnails Grid */}
          {savedThumbnails && savedThumbnails.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {savedThumbnails.map((thumb) => (
                <div key={thumb.id} className="relative group">
                  <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
                    <img
                      src={thumb.image_url}
                      alt="Reference thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteThumbnail(thumb.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {thumb.extracted_prompt && (
                    <Badge className="absolute top-2 right-2 bg-success/80 text-success-foreground text-xs">
                      Prompt OK
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {thumb.niche || "Sem nicho"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma thumbnail de referência salva ainda.
            </p>
          )}
        </div>
      </Card>

      {/* Gerador de Thumbnail Completa */}
      <Card className="p-6 border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Wand2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Gerador de Thumbnail Completa
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Digite o título e o sistema gerará automaticamente: thumbnail pronta, headline de impacto, descrição SEO e tags principais, tudo baseado no estilo das suas thumbnails de referência.
        </p>

        <div className="space-y-4">
          {/* Video Title */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Título do Vídeo</label>
            <Input
              placeholder="Ex: A CIDADE FLUTUANTE dos Astecas: 3 TÉCNICAS GENIAIS que Arqueólogos Ainda Não Conseguem Explicar"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">
              O sistema adaptará automaticamente o estilo das thumbnails de referência para este título.
            </p>
          </div>

          {/* Prompt Selection */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Prompt Padrão a Usar</label>
            <Select value={selectedPrompt} onValueChange={setSelectedPrompt}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Selecione um prompt" />
              </SelectTrigger>
              <SelectContent>
                {thumbnailsWithPrompts.length > 0 ? (
                  thumbnailsWithPrompts.map((thumb, i) => (
                    <SelectItem key={thumb.id} value={String(i + 1)}>
                      Prompt {i + 1} - {thumb.niche || "Geral"}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="1">Prompt 1 (Padrão)</SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Selecione qual dos {thumbnailsWithPrompts.length || 3} prompts padrão usar para gerar a thumbnail
            </p>
          </div>

          {/* Model, Language, Style */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Modelo de IA</label>
              <Select value={genModel} onValueChange={setGenModel}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o (2025)</SelectItem>
                  <SelectItem value="gemini">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="gemini-pro">Gemini 2.5 Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Idioma</label>
              <Select value={genLanguage} onValueChange={setGenLanguage}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Estilo de Arte</label>
              <Select value={artStyle} onValueChange={setArtStyle}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">✨ Foto Realista - Ultra HD, detalhes perfeitos</SelectItem>
                  <SelectItem value="cinematic">🎬 Cinematográfico</SelectItem>
                  <SelectItem value="digital-art">🎨 Arte Digital</SelectItem>
                  <SelectItem value="3d">🔮 3D Render</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="include-headline" 
                checked={includeHeadline}
                onCheckedChange={(checked) => setIncludeHeadline(checked as boolean)}
              />
              <label htmlFor="include-headline" className="text-sm text-muted-foreground cursor-pointer">
                Incluir headline na imagem
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="use-title" 
                checked={useTitle}
                onCheckedChange={(checked) => setUseTitle(checked as boolean)}
              />
              <label htmlFor="use-title" className="text-sm text-muted-foreground cursor-pointer">
                Usar o título como headline
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateThumbnail}
            disabled={generatingThumbnail || !videoTitle.trim()}
            className="w-full bg-primary text-primary-foreground h-12 text-base"
          >
            {generatingThumbnail ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2" />
            )}
            Gerar Thumbnail Completa
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            O sistema gerará 2 variações da thumbnail com headline, SEO e tags prontos
          </p>
        </div>
      </Card>
    </div>
  );
}
