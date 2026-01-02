import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mic, Video, Key, Download, Plus, Info, Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Json } from "@/integrations/supabase/types";

interface ApiProvider {
  id: string;
  name: string;
  provider: string;
  model: string;
  credits_per_unit: number;
  is_active: number;
}

interface ApiKeyConfig {
  key: string;
  setKey: (v: string) => void;
  keyName: string;
  displayName: string;
  provider: string;
  validated: boolean;
  setValidated: (v: boolean) => void;
  icon: React.ReactNode;
  description: string;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
}

export function AdminAPIsTab() {
  // API Keys
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiValidated, setOpenaiValidated] = useState(false);
  const [openaiShowPassword, setOpenaiShowPassword] = useState(false);
  
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiValidated, setGeminiValidated] = useState(false);
  const [geminiShowPassword, setGeminiShowPassword] = useState(false);
  
  const [claudeKey, setClaudeKey] = useState("");
  const [claudeValidated, setClaudeValidated] = useState(false);
  const [claudeShowPassword, setClaudeShowPassword] = useState(false);
  
  const [elevenlabsKey, setElevenlabsKey] = useState("");
  const [elevenlabsValidated, setElevenlabsValidated] = useState(false);
  const [elevenlabsShowPassword, setElevenlabsShowPassword] = useState(false);
  
  const [youtubeKey, setYoutubeKey] = useState("");
  const [youtubeValidated, setYoutubeValidated] = useState(false);
  const [youtubeShowPassword, setYoutubeShowPassword] = useState(false);
  
  const [downsubKey, setDownsubKey] = useState("");
  const [downsubValidated, setDownsubValidated] = useState(false);
  const [downsubShowPassword, setDownsubShowPassword] = useState(false);

  const [apiProviders, setApiProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadApiSettings();
    fetchApiProviders();
  }, []);

  const loadApiSettings = async () => {
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "api_keys")
      .maybeSingle();

    if (data?.value) {
      const keys = data.value as Record<string, unknown>;
      setOpenaiKey((keys.openai as string) || "");
      setOpenaiValidated(!!(keys.openai_validated));
      setGeminiKey((keys.gemini as string) || "");
      setGeminiValidated(!!(keys.gemini_validated));
      setClaudeKey((keys.claude as string) || "");
      setClaudeValidated(!!(keys.claude_validated));
      setElevenlabsKey((keys.elevenlabs as string) || "");
      setElevenlabsValidated(!!(keys.elevenlabs_validated));
      setYoutubeKey((keys.youtube as string) || "");
      setYoutubeValidated(!!(keys.youtube_validated));
      setDownsubKey((keys.downsub as string) || "");
      setDownsubValidated(!!(keys.downsub_validated));
    }
  };

  const fetchApiProviders = async () => {
    setLoading(true);
    const { data } = await supabase.from("api_providers").select("*");
    if (data) setApiProviders(data);
    setLoading(false);
  };

  const saveApiKey = async (keyName: string, value: string, validated: boolean, displayName: string) => {
    setSaving(keyName);
    
    try {
      const { data: current } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "api_keys")
        .maybeSingle();

      const currentValue = (current?.value as Record<string, string | boolean>) || {};
      const newValue: Json = { 
        ...currentValue, 
        [keyName]: value,
        [`${keyName}_validated`]: validated
      };

      // Check if record exists
      if (current) {
        const { error } = await supabase
          .from("admin_settings")
          .update({ 
            value: newValue,
            updated_at: new Date().toISOString() 
          })
          .eq("key", "api_keys");

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_settings")
          .insert([{ 
            key: "api_keys", 
            value: newValue
          }]);

        if (error) throw error;
      }

      toast.success(`${displayName} salva com sucesso!`);
    } catch (error) {
      console.error("Error saving API key:", error);
      toast.error(`Erro ao salvar ${displayName}`);
    } finally {
      setSaving(null);
    }
  };

  const validateApiKey = async (provider: string, apiKey: string, setValidated: (v: boolean) => void) => {
    if (!apiKey.trim()) {
      toast.error("Insira uma chave de API válida");
      return;
    }

    setValidating(provider);

    try {
      const { data, error } = await supabase.functions.invoke('validate-api-key', {
        body: { provider, apiKey }
      });

      if (error) throw error;

      if (data.valid) {
        setValidated(true);
        toast.success(`Chave ${provider.toUpperCase()} validada com sucesso!`);
      } else {
        setValidated(false);
        toast.error(`Chave ${provider.toUpperCase()} inválida: ${data.error || 'Verifique a chave'}`);
      }
    } catch (error) {
      console.error('Error validating API key:', error);
      setValidated(false);
      toast.error(`Erro ao validar chave ${provider}`);
    } finally {
      setValidating(null);
    }
  };

  const apiConfigs: ApiKeyConfig[] = [
    {
      key: openaiKey,
      setKey: setOpenaiKey,
      keyName: "openai",
      displayName: "OpenAI",
      provider: "openai",
      validated: openaiValidated,
      setValidated: setOpenaiValidated,
      icon: <Key className="w-5 h-5 text-green-500" />,
      description: "Chave para GPT-4o, GPT-4, e modelos de voz TTS. Usada para análises e geração de conteúdo.",
      showPassword: openaiShowPassword,
      setShowPassword: setOpenaiShowPassword,
    },
    {
      key: geminiKey,
      setKey: setGeminiKey,
      keyName: "gemini",
      displayName: "Google Gemini",
      provider: "gemini",
      validated: geminiValidated,
      setValidated: setGeminiValidated,
      icon: <Key className="w-5 h-5 text-blue-500" />,
      description: "Chave para Gemini Pro e Flash. Usada para análises multimodais e geração de imagens.",
      showPassword: geminiShowPassword,
      setShowPassword: setGeminiShowPassword,
    },
    {
      key: claudeKey,
      setKey: setClaudeKey,
      keyName: "claude",
      displayName: "Anthropic Claude",
      provider: "claude",
      validated: claudeValidated,
      setValidated: setClaudeValidated,
      icon: <Key className="w-5 h-5 text-orange-500" />,
      description: "Chave para Claude 3 Sonnet/Opus. Usada para análises de alta qualidade.",
      showPassword: claudeShowPassword,
      setShowPassword: setClaudeShowPassword,
    },
    {
      key: elevenlabsKey,
      setKey: setElevenlabsKey,
      keyName: "elevenlabs",
      displayName: "ElevenLabs",
      provider: "elevenlabs",
      validated: elevenlabsValidated,
      setValidated: setElevenlabsValidated,
      icon: <Mic className="w-5 h-5 text-purple-500" />,
      description: "Chave para vozes premium de alta qualidade. Usada na geração de áudio.",
      showPassword: elevenlabsShowPassword,
      setShowPassword: setElevenlabsShowPassword,
    },
    {
      key: youtubeKey,
      setKey: setYoutubeKey,
      keyName: "youtube",
      displayName: "YouTube Data API",
      provider: "youtube",
      validated: youtubeValidated,
      setValidated: setYoutubeValidated,
      icon: <Video className="w-5 h-5 text-red-500" />,
      description: "Chave para acessar dados do YouTube. Usada para análise de vídeos e canais.",
      showPassword: youtubeShowPassword,
      setShowPassword: setYoutubeShowPassword,
    },
    {
      key: downsubKey,
      setKey: setDownsubKey,
      keyName: "downsub",
      displayName: "DownSub",
      provider: "downsub",
      validated: downsubValidated,
      setValidated: setDownsubValidated,
      icon: <Download className="w-5 h-5 text-cyan-500" />,
      description: "Chave para extração de legendas/transcrições de vídeos do YouTube.",
      showPassword: downsubShowPassword,
      setShowPassword: setDownsubShowPassword,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert className="border-primary/50 bg-primary/10">
        <Info className="w-4 h-4 text-primary" />
        <AlertDescription className="text-primary">
          Configure as chaves de API do sistema. Essas chaves serão usadas como fallback quando os usuários não tiverem suas próprias chaves configuradas.
          <strong className="block mt-1">Importante:</strong> Valide cada chave antes de salvar para garantir que está funcionando.
        </AlertDescription>
      </Alert>

      {/* API Keys Cards */}
      {apiConfigs.map((config) => (
        <Card key={config.keyName} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {config.icon}
              <h3 className="font-semibold text-foreground">{config.displayName}</h3>
              {config.validated ? (
                <Badge variant="outline" className="text-success border-success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Validada
                </Badge>
              ) : config.key ? (
                <Badge variant="outline" className="text-destructive border-destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Não validada
                </Badge>
              ) : null}
            </div>
          </div>
          
          <label className="text-sm text-muted-foreground mb-2 block">Chave da API</label>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Input
                placeholder={`Cole sua chave da API ${config.displayName} aqui`}
                value={config.key}
                onChange={(e) => {
                  config.setKey(e.target.value);
                  config.setValidated(false);
                }}
                className="bg-secondary border-border pr-10"
                type={config.showPassword ? "text" : "password"}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => config.setShowPassword(!config.showPassword)}
              >
                {config.showPassword ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <Button 
              variant="outline" 
              onClick={() => validateApiKey(config.provider, config.key, config.setValidated)}
              disabled={validating === config.provider || !config.key.trim()}
            >
              {validating === config.provider ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Verificar
            </Button>
            <Button 
              onClick={() => saveApiKey(config.keyName, config.key, config.validated, config.displayName)}
              disabled={saving === config.keyName}
              className="bg-primary"
            >
              {saving === config.keyName ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Salvar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </Card>
      ))}

      {/* API Providers Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Provedores de API Configurados</h3>
          </div>
          <Button size="sm" className="bg-primary">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Provedor
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NOME</TableHead>
                <TableHead>PROVEDOR</TableHead>
                <TableHead>MODELO</TableHead>
                <TableHead>CRÉDITOS/UNIDADE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum provedor configurado
                  </TableCell>
                </TableRow>
              ) : (
                apiProviders.map((api) => (
                  <TableRow key={api.id}>
                    <TableCell className="font-medium">{api.name}</TableCell>
                    <TableCell>{api.provider}</TableCell>
                    <TableCell>{api.model}</TableCell>
                    <TableCell>{api.credits_per_unit}</TableCell>
                    <TableCell>
                      <Badge variant={api.is_active ? "default" : "secondary"}>
                        {api.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
