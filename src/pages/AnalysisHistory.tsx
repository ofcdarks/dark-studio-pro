import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Calendar,
  MessageSquare,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Search,
  Star,
  Loader2,
  FileText,
  FolderInput,
  FolderOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FolderSelect } from "@/components/folders/FolderSelect";
import { MoveToFolderDialog } from "@/components/folders/MoveToFolderDialog";
import { TagManager } from "@/components/tags/TagManager";
import { TagBadge } from "@/components/tags/TagBadge";
import { TagFilter } from "@/components/tags/TagFilter";

interface AnalyzedVideo {
  id: string;
  video_url: string;
  original_title: string | null;
  translated_title: string | null;
  original_views: number | null;
  original_comments: number | null;
  original_days: number | null;
  original_thumbnail_url: string | null;
  detected_niche: string | null;
  detected_subniche: string | null;
  detected_microniche: string | null;
  analysis_data_json: unknown;
  analyzed_at: string | null;
  created_at: string | null;
  folder_id: string | null;
}

interface GeneratedTitle {
  id: string;
  title_text: string;
  pontuacao: number | null;
  formula: string | null;
  explicacao: string | null;
  is_favorite: boolean | null;
  model_used: string | null;
  video_analysis_id: string | null;
  created_at: string | null;
  folder_id: string | null;
}


interface Folder {
  id: string;
  name: string;
}

interface TagData {
  id: string;
  name: string;
  color: string;
}

interface VideoTag {
  tag_id: string;
  tags: TagData;
}

interface TitleTag {
  tag_id: string;
  tags: TagData;
}

export default function AnalysisHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState<{
    id: string;
    type: "analyzed_videos" | "generated_titles";
    folderId: string | null;
    title: string;
  } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch folders for display names
  const { data: folders } = useQuery({
    queryKey: ["folders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("folders")
        .select("id, name")
        .eq("user_id", user.id);
      if (error) throw error;
      return data as Folder[];
    },
    enabled: !!user,
  });

  // Fetch analyzed videos
  const { data: analyzedVideos, isLoading: loadingVideos } = useQuery({
    queryKey: ["analyzed-videos", user?.id, selectedFolderId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("analyzed_videos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Folder filter: null = "Sem pasta" (folder_id IS NULL)
      if (selectedFolderId === null) {
        query = query.is("folder_id", null);
      } else {
        query = query.eq("folder_id", selectedFolderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AnalyzedVideo[];
    },
    enabled: !!user,
  });

  // Fetch generated titles
  const { data: generatedTitles, isLoading: loadingTitles } = useQuery({
    queryKey: ["generated-titles", user?.id, selectedFolderId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("generated_titles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Folder filter: null = "Sem pasta" (folder_id IS NULL)
      if (selectedFolderId === null) {
        query = query.is("folder_id", null);
      } else {
        query = query.eq("folder_id", selectedFolderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as GeneratedTitle[];
    },
    enabled: !!user,
  });

  // Fetch video tags
  const { data: videoTags } = useQuery({
    queryKey: ["video-tags", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("video_tags")
        .select("video_id, tag_id, tags:tag_id(id, name, color)");
      if (error) throw error;
      return data as unknown as { video_id: string; tag_id: string; tags: TagData }[];
    },
    enabled: !!user,
  });

  // Fetch title tags
  const { data: titleTags } = useQuery({
    queryKey: ["title-tags", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("title_tags")
        .select("title_id, tag_id, tags:tag_id(id, name, color)");
      if (error) throw error;
      return data as unknown as { title_id: string; tag_id: string; tags: TagData }[];
    },
    enabled: !!user,
  });

  const getVideoTags = (videoId: string): TagData[] => {
    return videoTags?.filter((vt) => vt.video_id === videoId).map((vt) => vt.tags) || [];
  };

  const getTitleTags = (titleId: string): TagData[] => {
    return titleTags?.filter((tt) => tt.title_id === titleId).map((tt) => tt.tags) || [];
  };

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from("generated_titles")
        .update({ is_favorite: !isFavorite })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-titles"] });
      toast({ title: "Atualizado!", description: "Favorito atualizado" });
    },
  });

  // Delete video analysis mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("analyzed_videos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyzed-videos"] });
      toast({ title: "Excluído!", description: "Análise removida" });
    },
  });

  // Delete multiple videos mutation
  const deleteMultipleVideosMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        const { error } = await supabase
          .from("analyzed_videos")
          .delete()
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyzed-videos"] });
      setSelectedVideos([]);
      toast({ title: "Excluídos!", description: `${selectedVideos.length} análises removidas` });
    },
  });

  // Delete multiple titles mutation
  const deleteMultipleTitlesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        const { error } = await supabase
          .from("generated_titles")
          .delete()
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-titles"] });
      setSelectedTitles([]);
      toast({ title: "Excluídos!", description: `${selectedTitles.length} títulos removidos` });
    },
  });

  // Move multiple videos to folder mutation
  const moveMultipleVideosMutation = useMutation({
    mutationFn: async ({ ids, folderId }: { ids: string[]; folderId: string | null }) => {
      const { error } = await supabase
        .from("analyzed_videos")
        .update({ folder_id: folderId })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["analyzed-videos"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setSelectedVideos([]);
      toast({
        title: "Movidos!",
        description: `${variables.ids.length} vídeos movidos para a pasta`,
      });
    },
  });


  // Move multiple titles to folder mutation
  const moveMultipleTitlesMutation = useMutation({
    mutationFn: async ({ ids, folderId }: { ids: string[]; folderId: string | null }) => {
      const { error } = await supabase
        .from("generated_titles")
        .update({ folder_id: folderId })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["generated-titles"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setSelectedTitles([]);
      toast({
        title: "Movidos!",
        description: `${variables.ids.length} títulos movidos para a pasta`,
      });
    },
  });


  const toggleVideoSelection = (id: string) => {
    setSelectedVideos(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  // Toggle title selection
  const toggleTitleSelection = (id: string) => {
    setSelectedTitles(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  // Toggle all videos
  const toggleAllVideos = () => {
    if (selectedVideos.length === filteredVideos?.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(filteredVideos?.map(v => v.id) || []);
    }
  };

  // Toggle all titles
  const toggleAllTitles = () => {
    if (selectedTitles.length === filteredTitles?.length) {
      setSelectedTitles([]);
    } else {
      setSelectedTitles(filteredTitles?.map(t => t.id) || []);
    }
  };

  const copyToClipboard = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copiado!", description: "Título copiado para a área de transferência" });
  };

  const openMoveDialog = (
    id: string,
    type: "analyzed_videos" | "generated_titles",
    folderId: string | null,
    title: string
  ) => {
    setItemToMove({ id, type, folderId, title });
    setMoveDialogOpen(true);
  };

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return null;
    const folder = folders?.find((f) => f.id === folderId);
    return folder?.name || null;
  };

  const filteredVideos = analyzedVideos?.filter((video) => {
    const matchesSearch =
      video.original_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.translated_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.detected_niche?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags =
      selectedTagIds.length === 0 ||
      getVideoTags(video.id).some((tag) => selectedTagIds.includes(tag.id));
    
    return matchesSearch && matchesTags;
  });

  const filteredTitles = generatedTitles?.filter((title) => {
    const matchesSearch =
      title.title_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      title.formula?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags =
      selectedTagIds.length === 0 ||
      getTitleTags(title.id).some((tag) => selectedTagIds.includes(tag.id));
    
    return matchesSearch && matchesTags;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const formatViews = (views: number | null) => {
    if (!views) return "0";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Histórico de Análises
            </h1>
            <p className="text-lg text-muted-foreground">
              Visualize todos os vídeos analisados e títulos gerados
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, nicho ou fórmula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border h-12"
              />
            </div>
            <div className="w-full sm:w-64">
              <FolderSelect
                value={selectedFolderId}
                onChange={setSelectedFolderId}
                placeholder="Filtrar por pasta"
                showCreateButton={false}
              />
            </div>
            <TagFilter
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
            />
          </div>

          <Tabs defaultValue="videos" className="space-y-6">
            <TabsList className="bg-secondary border border-border">
              <TabsTrigger value="videos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Vídeos Analisados ({filteredVideos?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="titles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Títulos Gerados ({filteredTitles?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Videos Tab */}
            <TabsContent value="videos" className="space-y-4">
              {/* Selection bar */}
              {filteredVideos && filteredVideos.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedVideos.length === filteredVideos.length && filteredVideos.length > 0}
                      onCheckedChange={toggleAllVideos}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedVideos.length > 0 
                        ? `${selectedVideos.length} selecionado(s)` 
                        : "Selecionar todos"}
                    </span>
                  </div>
                  {selectedVideos.length > 0 && (
                    <div className="flex items-center gap-2">
                      {/* Move to folder dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={moveMultipleVideosMutation.isPending}
                          >
                            {moveMultipleVideosMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <FolderInput className="w-4 h-4 mr-2" />
                            )}
                            Mover para Pasta
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            onClick={() => moveMultipleVideosMutation.mutate({ ids: selectedVideos, folderId: null })}
                          >
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Remover da pasta (Geral)
                          </DropdownMenuItem>
                          {folders?.map((folder) => (
                            <DropdownMenuItem
                              key={folder.id}
                              onClick={() => moveMultipleVideosMutation.mutate({ ids: selectedVideos, folderId: folder.id })}
                            >
                              <FolderOpen className="w-4 h-4 mr-2" />
                              {folder.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Delete button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMultipleVideosMutation.mutate(selectedVideos)}
                        disabled={deleteMultipleVideosMutation.isPending}
                      >
                        {deleteMultipleVideosMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Excluir Selecionados
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {loadingVideos ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : filteredVideos?.length === 0 ? (
                <Card className="p-12 text-center border-border/50">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">Nenhuma análise encontrada</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedFolderId
                      ? "Nenhum vídeo nesta pasta"
                      : "Analise vídeos virais para ver o histórico aqui"}
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredVideos?.map((video) => (
                    <Card key={video.id} className={`p-4 border-border/50 hover:border-primary/50 transition-colors ${selectedVideos.includes(video.id) ? 'border-primary bg-primary/5' : ''}`}>
                      <div className="flex gap-4">
                        {/* Checkbox */}
                        <div className="flex items-start pt-1">
                          <Checkbox
                            checked={selectedVideos.includes(video.id)}
                            onCheckedChange={() => toggleVideoSelection(video.id)}
                          />
                        </div>
                        {/* Thumbnail */}
                        {video.original_thumbnail_url && (
                          <div className="flex-shrink-0">
                            <img
                              src={video.original_thumbnail_url}
                              alt="Thumbnail"
                              className="w-40 h-24 object-cover rounded-lg"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-foreground line-clamp-2">
                                {video.translated_title || video.original_title || "Título não disponível"}
                              </h3>
                              {video.original_title && video.translated_title && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                  Original: {video.original_title}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <TagManager
                                itemId={video.id}
                                itemType="video"
                                existingTags={getVideoTags(video.id)}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  openMoveDialog(
                                    video.id,
                                    "analyzed_videos",
                                    video.folder_id,
                                    video.translated_title || video.original_title || ""
                                  )
                                }
                                title="Mover para pasta"
                              >
                                <FolderInput className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(video.video_url, "_blank")}
                                title="Abrir no YouTube"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteVideoMutation.mutate(video.id)}
                                className="text-destructive hover:text-destructive"
                                title="Excluir análise"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Stats & Folder */}
                          <div className="flex flex-wrap items-center gap-4 mt-3">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Eye className="w-4 h-4" />
                              <span>{formatViews(video.original_views)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MessageSquare className="w-4 h-4" />
                              <span>{formatViews(video.original_comments)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{video.original_days} dias</span>
                            </div>
                            {video.detected_niche && (
                              <Badge variant="secondary">{video.detected_niche}</Badge>
                            )}
                            {video.detected_subniche && (
                              <Badge variant="outline">{video.detected_subniche}</Badge>
                            )}
                            {video.folder_id && getFolderName(video.folder_id) && (
                              <Badge variant="outline" className="border-primary/50 text-primary">
                                <FolderOpen className="w-3 h-3 mr-1" />
                                {getFolderName(video.folder_id)}
                              </Badge>
                            )}
                            {getVideoTags(video.id).map((tag) => (
                              <TagBadge
                                key={tag.id}
                                name={tag.name}
                                color={tag.color}
                                size="sm"
                              />
                            ))}
                          </div>

                          <p className="text-xs text-muted-foreground mt-2">
                            Analisado em: {formatDate(video.analyzed_at || video.created_at)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Titles Tab */}
            <TabsContent value="titles" className="space-y-4">
              {/* Selection bar */}
              {filteredTitles && filteredTitles.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedTitles.length === filteredTitles.length && filteredTitles.length > 0}
                      onCheckedChange={toggleAllTitles}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedTitles.length > 0 
                        ? `${selectedTitles.length} selecionado(s)` 
                        : "Selecionar todos"}
                    </span>
                  </div>
                  {selectedTitles.length > 0 && (
                    <div className="flex items-center gap-2">
                      {/* Move to folder dropdown for titles */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={moveMultipleVideosMutation.isPending}
                          >
                            {moveMultipleVideosMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <FolderInput className="w-4 h-4 mr-2" />
                            )}
                            Mover para Pasta
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            onClick={() => moveMultipleTitlesMutation.mutate({ ids: selectedTitles, folderId: null })}
                          >
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Remover da pasta (Geral)
                          </DropdownMenuItem>
                          {folders?.map((folder) => (
                            <DropdownMenuItem
                              key={folder.id}
                              onClick={() => moveMultipleTitlesMutation.mutate({ ids: selectedTitles, folderId: folder.id })}
                            >
                              <FolderOpen className="w-4 h-4 mr-2" />
                              {folder.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Delete button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMultipleTitlesMutation.mutate(selectedTitles)}
                        disabled={deleteMultipleTitlesMutation.isPending}
                      >
                        {deleteMultipleTitlesMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Excluir Selecionados
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {loadingTitles ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : filteredTitles?.length === 0 ? (
                <Card className="p-12 text-center border-border/50">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">Nenhum título gerado</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Analise vídeos virais para gerar títulos otimizados
                  </p>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {filteredTitles?.map((title) => (
                    <Card
                      key={title.id}
                      className={`p-4 border-border/50 transition-colors ${
                        selectedTitles.includes(title.id) ? "border-primary bg-primary/5" : title.is_favorite ? "border-primary/50 bg-primary/5" : "hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Checkbox
                            checked={selectedTitles.includes(title.id)}
                            onCheckedChange={() => toggleTitleSelection(title.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{title.title_text}</p>
                              {title.pontuacao && (
                                <Badge
                                  variant={title.pontuacao >= 90 ? "default" : "secondary"}
                                  className={title.pontuacao >= 90 ? "bg-green-500" : ""}
                                >
                                  {title.pontuacao}%
                                </Badge>
                              )}
                          </div>
                          {title.formula && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              Fórmula: {title.formula}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {title.model_used && <span>Modelo: {title.model_used}</span>}
                            <span>{formatDate(title.created_at)}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 mt-2">
                            {getTitleTags(title.id).map((tag) => (
                              <TagBadge
                                key={tag.id}
                                name={tag.name}
                                color={tag.color}
                                size="sm"
                              />
                            ))}
                          </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <TagManager
                            itemId={title.id}
                            itemType="title"
                            existingTags={getTitleTags(title.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toggleFavoriteMutation.mutate({
                                id: title.id,
                                isFavorite: title.is_favorite || false,
                              })
                            }
                            className={title.is_favorite ? "text-yellow-500" : "text-muted-foreground"}
                          >
                            <Star className={`w-4 h-4 ${title.is_favorite ? "fill-current" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(title.id, title.title_text)}
                          >
                            {copiedId === title.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Move to Folder Dialog */}
      {itemToMove && (
        <MoveToFolderDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          itemId={itemToMove.id}
          itemType={itemToMove.type}
          currentFolderId={itemToMove.folderId}
          itemTitle={itemToMove.title}
        />
      )}
    </MainLayout>
  );
}
