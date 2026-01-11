import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Plus,
  X,
  Flame,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Film,
  Clapperboard,
  Globe,
  TrendingUp,
  Youtube,
  Link2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link } from "react-router-dom";

const COUNTRIES = [
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "ES", name: "Espanha", flag: "🇪🇸" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧" },
  { code: "FR", name: "França", flag: "🇫🇷" },
  { code: "DE", name: "Alemanha", flag: "🇩🇪" },
  { code: "IT", name: "Itália", flag: "🇮🇹" },
  { code: "JP", name: "Japão", flag: "🇯🇵" },
  { code: "IN", name: "Índia", flag: "🇮🇳" },
];

interface ViralMonitoringConfigData {
  id: string;
  user_id: string;
  niches: string[];
  is_active: boolean;
  check_interval_hours: number;
  viral_threshold: number;
  last_checked_at: string | null;
  video_types: string[];
  country: string;
}

export const ViralMonitoringConfig = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNiche, setNewNiche] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Fetch viral monitoring config
  const { data: config, isLoading } = useQuery({
    queryKey: ["viral-monitoring-config", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("viral_monitoring_config")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as ViralMonitoringConfigData | null;
    },
    enabled: !!user,
  });

  // Fetch user's YouTube API key status
  const { data: apiSettings } = useQuery({
    queryKey: ["api-settings-youtube", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_api_settings")
        .select("youtube_api_key, youtube_validated")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch saved analytics channels (pinned channels from Analytics page)
  const { data: savedAnalyticsChannels } = useQuery({
    queryKey: ["saved-analytics-channels", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("saved_analytics_channels")
        .select("id, channel_name, channel_thumbnail, notes")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const hasYouTubeApiKey = !!apiSettings?.youtube_api_key;

  // Create or update config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (updates: Partial<ViralMonitoringConfigData>) => {
      if (!user) throw new Error("User not authenticated");

      if (config) {
        // Update existing
        const { error } = await supabase
          .from("viral_monitoring_config")
          .update(updates)
          .eq("id", config.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("viral_monitoring_config")
          .insert({
            user_id: user.id,
            ...updates,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viral-monitoring-config"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddNiche = () => {
    if (!newNiche.trim()) return;

    const currentNiches = config?.niches || [];
    if (currentNiches.length >= 5) {
      toast({
        title: "Limite atingido",
        description: "Você pode monitorar no máximo 5 nichos",
        variant: "destructive",
      });
      return;
    }

    if (currentNiches.includes(newNiche.trim().toLowerCase())) {
      toast({
        title: "Nicho duplicado",
        description: "Este nicho já está na sua lista",
        variant: "destructive",
      });
      return;
    }

    saveConfigMutation.mutate({
      niches: [...currentNiches, newNiche.trim().toLowerCase()],
    });
    setNewNiche("");
    toast({ title: "Nicho adicionado!" });
  };

  const handleRemoveNiche = (nicheToRemove: string) => {
    const currentNiches = config?.niches || [];
    saveConfigMutation.mutate({
      niches: currentNiches.filter((n) => n !== nicheToRemove),
    });
    toast({ title: "Nicho removido" });
  };

  const handleToggleActive = (checked: boolean) => {
    saveConfigMutation.mutate({ is_active: checked });
    toast({
      title: checked ? "Monitoramento ativado" : "Monitoramento pausado",
    });
  };

  const handleToggleVideoType = (type: string, checked: boolean) => {
    const currentTypes = config?.video_types || ["long", "short"];
    let newTypes: string[];
    
    if (checked) {
      newTypes = [...currentTypes, type];
    } else {
      newTypes = currentTypes.filter((t) => t !== type);
    }
    
    // Ensure at least one type is selected
    if (newTypes.length === 0) {
      toast({
        title: "Selecione pelo menos um tipo",
        variant: "destructive",
      });
      return;
    }
    
    saveConfigMutation.mutate({ video_types: newTypes });
  };

  const handleCountryChange = (countryCode: string) => {
    saveConfigMutation.mutate({ country: countryCode });
    toast({ title: "País atualizado!" });
  };

  const handleViralThresholdChange = (value: string) => {
    const threshold = parseInt(value, 10);
    if (isNaN(threshold) || threshold < 100) return;
    saveConfigMutation.mutate({ viral_threshold: threshold });
  };

  const niches = config?.niches || [];
  const isActive = config?.is_active ?? false;
  const videoTypes = config?.video_types || ["long", "short"];
  const country = config?.country || "BR";
  const viralThreshold = config?.viral_threshold || 1000;

  return (
    <Card className="p-4 mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Detecção de Virais
                </h3>
                <p className="text-sm text-muted-foreground">
                  {niches.length > 0
                    ? `Monitorando ${niches.length} nicho(s)`
                    : "Configure nichos para monitorar"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isActive && niches.length > 0 && (
                <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
              )}
              <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4">
          {/* Status da API Key */}
          {!hasYouTubeApiKey && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-500">
                  YouTube API Key necessária
                </p>
                <p className="text-xs text-muted-foreground">
                  Configure sua chave de API do YouTube em{" "}
                  <a href="/settings" className="text-primary underline">
                    Configurações → APIs
                  </a>{" "}
                  para detectar vídeos virais.
                </p>
              </div>
            </div>
          )}

          {/* Toggle Ativo/Inativo */}
          <div className="flex items-center justify-between">
            <Label htmlFor="viral-active" className="text-sm">
              Ativar monitoramento automático
            </Label>
            <Switch
              id="viral-active"
              checked={isActive}
              onCheckedChange={handleToggleActive}
              disabled={!hasYouTubeApiKey || niches.length === 0}
            />
          </div>

          {/* País */}
          <div>
            <Label className="text-sm mb-2 block flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-muted-foreground" />
              País para busca
            </Label>
            <Select value={country} onValueChange={handleCountryChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o país" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="flex items-center gap-2">
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Vídeos serão buscados em tendência neste país
            </p>
          </div>

          {/* Threshold de VPH */}
          <div>
            <Label className="text-sm mb-2 block flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              Threshold VPH (Views Por Hora)
            </Label>
            <Input
              type="number"
              min={100}
              step={100}
              value={viralThreshold}
              onChange={(e) => handleViralThresholdChange(e.target.value)}
              onBlur={(e) => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val) || val < 100) {
                  saveConfigMutation.mutate({ viral_threshold: 1000 });
                }
              }}
              className="w-full"
              placeholder="1000"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Vídeos com mais views/hora que este valor serão considerados virais
            </p>
          </div>

          {/* Tipo de Vídeo */}
          <div>
            <Label className="text-sm mb-3 block">Tipos de vídeo</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="video-type-long"
                  checked={videoTypes.includes("long")}
                  onCheckedChange={(checked) => handleToggleVideoType("long", !!checked)}
                />
                <Label htmlFor="video-type-long" className="text-sm flex items-center gap-1.5 cursor-pointer">
                  <Film className="w-4 h-4 text-muted-foreground" />
                  Vídeos Longos
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="video-type-short"
                  checked={videoTypes.includes("short")}
                  onCheckedChange={(checked) => handleToggleVideoType("short", !!checked)}
                />
                <Label htmlFor="video-type-short" className="text-sm flex items-center gap-1.5 cursor-pointer">
                  <Clapperboard className="w-4 h-4 text-muted-foreground" />
                  Shorts
                </Label>
              </div>
            </div>
          </div>

          {/* Nichos atuais */}
          <div>
            <Label className="text-sm mb-2 block">
              Nichos monitorados ({niches.length}/5)
            </Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : niches.length > 0 ? (
                niches.map((niche) => (
                  <Badge
                    key={niche}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    {niche}
                    <button
                      onClick={() => handleRemoveNiche(niche)}
                      className="ml-1 hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum nicho configurado
                </p>
              )}
            </div>
          </div>

          {/* Adicionar novo nicho */}
          {niches.length < 5 && (
            <div className="flex gap-2">
              <Input
                placeholder="Ex: dark channel, motivacional, curiosidades..."
                value={newNiche}
                onChange={(e) => setNewNiche(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNiche()}
                className="flex-1"
              />
              <Button
                onClick={handleAddNiche}
                disabled={!newNiche.trim() || saveConfigMutation.isPending}
                size="sm"
              >
                {saveConfigMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}

          {/* Sugestões de nichos dos canais fixados no Analytics */}
          {savedAnalyticsChannels && savedAnalyticsChannels.length > 0 && niches.length < 5 && (() => {
            // Extract niches from notes of saved channels
            const allNicheKeywords: string[] = [];
            
            savedAnalyticsChannels.forEach((channel) => {
              const notes = channel.notes?.trim() || "";
              if (!notes) return;
              
              // 1. Try to find "PALAVRAS-CHAVE DO NICHO:" section
              const keywordsMatch = notes.match(/palavras[- ]chave do nicho[:\s]*\n?([^\n═]+)/i);
              if (keywordsMatch) {
                const keywords = keywordsMatch[1]
                  .split(',')
                  .map(k => k.trim().toLowerCase())
                  .filter(k => k.length >= 3 && k.length <= 30);
                allNicheKeywords.push(...keywords.slice(0, 5)); // Take top 5 keywords from each channel
                return;
              }
              
              // 2. Try to find niche from title strategy section
              const estrategiaMatch = notes.match(/estratégia viral para[:\s]+([^\n]+)/i);
              if (estrategiaMatch) {
                // Extract context from the notes - look for common niche words
                const contentLower = notes.toLowerCase();
                const nichePatterns = [
                  'historia', 'documentário', 'documental', 'misterios', 'mistérios',
                  'curiosidades', 'dark', 'terror', 'motivacional', 'finanças',
                  'tecnologia', 'ciência', 'gaming', 'música', 'esportes',
                  'educação', 'tutorial', 'lifestyle', 'viagem', 'culinária',
                  'animação', '3d', 'anime', 'true crime', 'conspirações'
                ];
                
                for (const pattern of nichePatterns) {
                  if (contentLower.includes(pattern) && !allNicheKeywords.includes(pattern)) {
                    allNicheKeywords.push(pattern);
                  }
                }
              }
              
              // 3. Fallback: look for hashtags
              const hashtagMatch = notes.match(/#(\w+)/g);
              if (hashtagMatch && hashtagMatch.length > 0) {
                const hashtags = hashtagMatch
                  .map(h => h.replace('#', '').toLowerCase())
                  .filter(h => h.length >= 3 && h.length <= 25);
                allNicheKeywords.push(...hashtags.slice(0, 3));
              }
            });
            
            // Remove duplicates and filter already added niches
            const suggestedNiches = [...new Set(allNicheKeywords)]
              .filter(niche => !niches.includes(niche))
              .slice(0, 8); // Show up to 8 suggestions
            
            if (suggestedNiches.length === 0) return null;
            
            return (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Youtube className="w-4 h-4 text-primary" />
                  <p className="text-xs font-medium text-foreground">
                    Nichos detectados dos seus canais:
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {suggestedNiches.map((niche) => (
                    <Button
                      key={niche}
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs bg-background"
                      onClick={() => {
                        const currentNiches = config?.niches || [];
                        if (currentNiches.length >= 5) {
                          toast({
                            title: "Limite atingido",
                            description: "Máximo de 5 nichos",
                            variant: "destructive",
                          });
                          return;
                        }
                        saveConfigMutation.mutate({
                          niches: [...currentNiches, niche],
                        });
                        toast({ title: "Nicho adicionado!" });
                      }}
                      disabled={saveConfigMutation.isPending}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {niche}
                    </Button>
                  ))}
                </div>
                <Link 
                  to="/analytics" 
                  className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
                >
                  <Link2 className="w-3 h-3" />
                  Gerenciar canais e nichos
                </Link>
              </div>
            );
          })()}

          {/* Link para Analytics se não tiver canais fixados */}
          {(!savedAnalyticsChannels || savedAnalyticsChannels.length === 0) && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Youtube className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">
                  Vincule canais do Analytics
                </p>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Fixe canais no Analytics para sugerir nichos automaticamente
              </p>
              <Link to="/analytics">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Link2 className="w-3 h-3 mr-1" />
                  Ir para Analytics
                </Button>
              </Link>
            </div>
          )}

          {/* Sugestões populares */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Sugestões populares:
            </p>
            <div className="flex flex-wrap gap-1">
              {[
                "dark channel",
                "motivacional",
                "curiosidades",
                "história",
                "mistério",
                "finanças",
                "tecnologia",
                "true crime",
              ]
                .filter((s) => !niches.includes(s))
                .slice(0, 5)
                .map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setNewNiche(suggestion);
                    }}
                  >
                    +{suggestion}
                  </Button>
                ))}
            </div>
          </div>

          {/* Info sobre como funciona */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 Como funciona:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Nossa automação busca sua config de nichos automaticamente</li>
              <li>Usa sua própria YouTube API Key para pesquisar</li>
              <li>Detecta vídeos com +1000 views/hora no nicho</li>
              <li>A IA analisa por que o vídeo está viralizando</li>
              <li>Você recebe notificação em tempo real</li>
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
