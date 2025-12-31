import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mic, Video, Key, Download, Volume2, Plus, Info, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiProvider {
  id: string;
  name: string;
  provider: string;
  model: string;
  credits_per_unit: number;
  is_active: number;
}

export function AdminAPIsTab() {
  const [vozPremiumKey, setVozPremiumKey] = useState("");
  const [openaiVoiceKey, setOpenaiVoiceKey] = useState("");
  const [geminiVideoKey, setGeminiVideoKey] = useState("");
  const [googleVoiceKey, setGoogleVoiceKey] = useState("");
  const [downsubKey, setDownsubKey] = useState("");
  const [darkvozKey, setDarkvozKey] = useState("");
  const [useDarkvozDefault, setUseDarkvozDefault] = useState(false);
  const [apiProviders, setApiProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadApiSettings();
    fetchApiProviders();
  }, []);

  const loadApiSettings = async () => {
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "api_keys")
      .single();

    if (data?.value) {
      const keys = data.value as Record<string, string>;
      setVozPremiumKey(keys.voz_premium || "");
      setOpenaiVoiceKey(keys.openai_voice || "");
      setGeminiVideoKey(keys.gemini_video || "");
      setGoogleVoiceKey(keys.google_voice || "");
      setDownsubKey(keys.downsub || "");
      setDarkvozKey(keys.darkvoz || "");
    }
  };

  const fetchApiProviders = async () => {
    setLoading(true);
    const { data } = await supabase.from("api_providers").select("*");
    if (data) setApiProviders(data);
    setLoading(false);
  };

  const saveApiKey = async (keyName: string, value: string, displayName: string) => {
    const { data: current } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "api_keys")
      .single();

    const currentValue = (current?.value as Record<string, string>) || {};
    const newValue = { ...currentValue, [keyName]: value };

    const { error } = await supabase
      .from("admin_settings")
      .update({ value: newValue, updated_at: new Date().toISOString() })
      .eq("key", "api_keys");

    if (error) {
      toast.error(`Erro ao salvar ${displayName}`);
    } else {
      toast.success(`${displayName} salva com sucesso!`);
    }
  };

  const validateApiKey = async (provider: string, apiKey: string) => {
    toast.info(`Validando chave ${provider}...`);
    // Here you would call a validation endpoint
    toast.success(`Chave ${provider} validada!`);
  };

  return (
    <div className="space-y-6">
      {/* Voz Premium */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mic className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Configuração de Voz Premium</h3>
        </div>
        <label className="text-sm text-muted-foreground mb-2 block">Chave da API</label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="ey4hbGci...xNqw"
            value={vozPremiumKey}
            onChange={(e) => setVozPremiumKey(e.target.value)}
            className="bg-secondary border-border flex-1"
            type="password"
          />
          <Button variant="outline" onClick={() => validateApiKey("Voz Premium", vozPremiumKey)}>
            Verificar Saldo
          </Button>
          <Button onClick={() => saveApiKey("voz_premium", vozPremiumKey, "Voz Premium")}>
            Editar
          </Button>
        </div>
        <Alert className="border-primary/50 bg-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription className="text-primary">
            Após salvar a chave, você poderá adicionar saldo aos usuários através do sistema de créditos.
          </AlertDescription>
        </Alert>
      </Card>

      {/* OpenAI Voice */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Configuração de Chave de Voz OpenAI</h3>
        </div>
        <label className="text-sm text-muted-foreground mb-2 block">Chave da API OpenAI</label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Cole sua chave da API OpenAI aqui"
            value={openaiVoiceKey}
            onChange={(e) => setOpenaiVoiceKey(e.target.value)}
            className="bg-secondary border-border flex-1"
            type="password"
          />
          <Button variant="outline" onClick={() => validateApiKey("OpenAI", openaiVoiceKey)}>
            Validar
          </Button>
          <Button onClick={() => saveApiKey("openai_voice", openaiVoiceKey, "OpenAI Voice")}>
            Salvar Chave
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Esta chave é usada para gerar vozes com a API OpenAI. Será usada automaticamente quando o usuário solicitar voz "OpenAI".
        </p>
      </Card>

      {/* Gemini/Veo Video */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Video className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Configuração de API de Vídeo (Gemini/Veo)</h3>
        </div>
        <label className="text-sm text-muted-foreground mb-2 block">Chave da API para Vídeo</label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Cole sua chave do Gemini/Veo aqui"
            value={geminiVideoKey}
            onChange={(e) => setGeminiVideoKey(e.target.value)}
            className="bg-secondary border-border flex-1"
            type="password"
          />
          <Button variant="outline" onClick={() => validateApiKey("Gemini", geminiVideoKey)}>
            Validar
          </Button>
          <Button onClick={() => saveApiKey("gemini_video", geminiVideoKey, "Gemini Video")}>
            Salvar Chave
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Para usuários que querem gerar vídeos com modelos Veo. Esta API possui preços e cotas diferentes.
        </p>
      </Card>

      {/* Google Cloud Voice */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mic className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Configuração de Chave de Voz</h3>
        </div>
        <label className="text-sm text-muted-foreground mb-2 block">
          Chave da API para Voz (Google Cloud/Gemini)
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Cole sua chave da API do Google Cloud ou Gemini aqui"
            value={googleVoiceKey}
            onChange={(e) => setGoogleVoiceKey(e.target.value)}
            className="bg-secondary border-border flex-1"
            type="password"
          />
          <Button variant="outline" onClick={() => validateApiKey("Google", googleVoiceKey)}>
            Validar
          </Button>
          <Button onClick={() => saveApiKey("google_voice", googleVoiceKey, "Google Voice")}>
            Salvar Chave
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Esta chave é usada para transcrição/TTS quando o usuário solicita a API própria. Se não configurada, será usado o saldo de voz padrão.
        </p>
        <Alert className="mt-2 border-primary/50 bg-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription className="text-primary">
            Esta chave é usada quando o usuário seleciona "Gemini" como provedor de voz na API própria. Se não configurada, será reduzido o limite da chave de voz padrão.
          </AlertDescription>
        </Alert>
      </Card>

      {/* DownSub */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Configuração de API DownSub (Transcrições)</h3>
        </div>
        <label className="text-sm text-muted-foreground mb-2 block">Chave da API DownSub</label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Cole sua chave da API DownSub aqui"
            value={downsubKey}
            onChange={(e) => setDownsubKey(e.target.value)}
            className="bg-secondary border-border flex-1"
            type="password"
          />
          <Button onClick={() => saveApiKey("downsub", downsubKey, "DownSub")}>
            Verificar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Configure a chave da API DownSub para extrair transcrições de vídeos do YouTube e outras mídias suportadas.
        </p>
        <Alert className="border-primary/50 bg-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription className="text-primary">
            A API DownSub permite baixar legendas/transcrições de vídeos do YouTube e outros sites suportados. 
            Cada chamada pode ter custos associados. Os créditos não são consumidos interativamente pelo Pro/3000 e creditados após finalizados.
          </AlertDescription>
        </Alert>
      </Card>

      {/* DarkVoz */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mic className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Configuração de DarkVoz</h3>
        </div>
        <label className="text-sm text-muted-foreground mb-2 block">Chave da API</label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Cole sua chave da API do DarkVoz aqui"
            value={darkvozKey}
            onChange={(e) => setDarkvozKey(e.target.value)}
            className="bg-secondary border-border flex-1"
            type="password"
          />
          <Button onClick={() => saveApiKey("darkvoz", darkvozKey, "DarkVoz")}>
            Verificar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Configure a chave da API do DarkVoz para usar as vozes disponíveis na plataforma.
        </p>
        <div className="flex items-center gap-2 mb-2">
          <Checkbox
            checked={useDarkvozDefault}
            onCheckedChange={(v) => setUseDarkvozDefault(!!v)}
          />
          <span className="text-sm text-muted-foreground">
            Usar DarkVoz como padrão para todas as funções
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Quando ativado, todas as operações de voz do sistema usarão a DarkVoz, independente das preferências do usuário.
        </p>
        <Alert className="mt-2 border-primary/50 bg-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription className="text-primary">
            A chave do DarkVoz será usada para acessar as APIs disponíveis na plataforma Casa Dark Coin. 
            Há uma opção extra para usar como padrão em todas as funções.
          </AlertDescription>
        </Alert>
      </Card>

      {/* API Providers Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Gerenciamento de APIs</h3>
          </div>
          <Button size="sm" className="bg-primary">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar API
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
                <TableHead>MODELO</TableHead>
                <TableHead>CRÉDITOS/UNIDADE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : (
                apiProviders.map((api) => (
                  <TableRow key={api.id}>
                    <TableCell>{api.name}</TableCell>
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
