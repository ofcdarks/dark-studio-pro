import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Key, Bell, User, Shield, CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useApiSettings } from "@/hooks/useApiSettings";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SettingsPage = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { settings, loading: settingsLoading, validating, validateApiKey, saveSettings, isValidated } = useApiSettings();

  const [profileData, setProfileData] = useState({ full_name: '', email: '' });
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    claude: '',
    gemini: '',
    elevenlabs: '',
    youtube: '',
  });
  const [showKeys, setShowKeys] = useState({
    openai: false,
    claude: false,
    gemini: false,
    elevenlabs: false,
    youtube: false,
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        email: profile.email || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setApiKeys({
        openai: settings.openai_api_key || '',
        claude: settings.claude_api_key || '',
        gemini: settings.gemini_api_key || '',
        elevenlabs: settings.elevenlabs_api_key || '',
        youtube: settings.youtube_api_key || '',
      });
    }
  }, [settings]);

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          email: profileData.email,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Perfil atualizado!');
      refetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handleValidateAndSave = async (provider: string) => {
    const key = apiKeys[provider as keyof typeof apiKeys];
    if (!key.trim()) {
      toast.error('Insira uma chave de API');
      return;
    }

    const valid = await validateApiKey(provider, key);
    
    const updateData: Record<string, string | boolean> = {};
    updateData[`${provider}_api_key`] = key;
    updateData[`${provider}_validated`] = valid;
    
    await saveSettings(updateData);
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider as keyof typeof prev] }));
  };

  const renderApiKeyField = (
    provider: string,
    label: string,
    placeholder: string
  ) => {
    const key = apiKeys[provider as keyof typeof apiKeys];
    const validated = isValidated(provider);
    const isValidating = validating === provider;
    const showKey = showKeys[provider as keyof typeof showKeys];

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-muted-foreground">{label}</label>
          {key && (
            <div className="flex items-center gap-1">
              {validated ? (
                <span className="flex items-center gap-1 text-xs text-green-500">
                  <CheckCircle className="w-3 h-3" /> Validada
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-500">
                  <XCircle className="w-3 h-3" /> Não validada
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              placeholder={placeholder}
              value={key}
              onChange={(e) => setApiKeys(prev => ({ ...prev, [provider]: e.target.value }))}
              className="bg-secondary border-border pr-10"
            />
            <button
              type="button"
              onClick={() => toggleShowKey(provider)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button
            onClick={() => handleValidateAndSave(provider)}
            disabled={isValidating || !key.trim()}
            variant="outline"
            className="border-border"
          >
            {isValidating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Validar'
            )}
          </Button>
        </div>
      </div>
    );
  };

  if (profileLoading || settingsLoading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Configurações</h1>
            <p className="text-muted-foreground">
              Gerencie suas preferências e integrações
            </p>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Perfil</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Nome</label>
                    <Input
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Email</label>
                    <Input
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <Button onClick={handleSaveProfile} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Salvar Alterações
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Chaves de API</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Configure suas chaves de API para usar funcionalidades avançadas. As chaves são validadas automaticamente.
              </p>
              <div className="space-y-4">
                {renderApiKeyField('openai', 'OpenAI API Key', 'sk-...')}
                {renderApiKeyField('claude', 'Claude API Key', 'sk-ant-...')}
                {renderApiKeyField('gemini', 'Google Gemini API Key', 'AIza...')}
                {renderApiKeyField('elevenlabs', 'ElevenLabs API Key', '...')}
                {renderApiKeyField('youtube', 'YouTube Data API Key', 'AIza...')}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Notificações</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Alertas de Vídeos Virais</p>
                    <p className="text-sm text-muted-foreground">Receba notificações quando um vídeo viralizar</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Relatórios Semanais</p>
                    <p className="text-sm text-muted-foreground">Resumo semanal de performance</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Novos Recursos</p>
                    <p className="text-sm text-muted-foreground">Atualizações sobre novos recursos</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Segurança</h3>
              </div>
              <div className="space-y-4">
                <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
                  Alterar Senha
                </Button>
                <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
                  Ativar 2FA
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
