import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Key, Bell, User, Shield, CheckCircle, XCircle, Loader2, Eye, EyeOff, Coins, Lock, Image, AlertCircle, Camera, Upload, History, Video, FileText, Play, Rocket, Mic, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useApiSettings } from "@/hooks/useApiSettings";
import { useStorage } from "@/hooks/useStorage";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { resetAllTutorials } from "@/hooks/useTutorial";

type UserPlan = 'free' | 'pro' | 'admin' | 'master' | 'annual';

interface NotificationPrefs {
  notify_viral_videos: boolean;
  notify_weekly_reports: boolean;
  notify_new_features: boolean;
}

const SettingsPage = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { settings, loading: settingsLoading, validating, validateApiKey, saveSettings, isValidated } = useApiSettings();
  const { registerUpload, unregisterUpload, canUpload } = useStorage();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [profileData, setProfileData] = useState({ full_name: '', email: '' });
  const [usePlatformCredits, setUsePlatformCredits] = useState(true);
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    claude: '',
    gemini: '',
    youtube: '',
    imagefx: '',
  });
  const [showKeys, setShowKeys] = useState({
    openai: false,
    claude: false,
    gemini: false,
    youtube: false,
    imagefx: false,
  });
  
  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    notify_viral_videos: true,
    notify_weekly_reports: true,
    notify_new_features: true,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Password change modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Avatar upload
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Activity logs
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Fetch user plan/role
  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user) return;
      
      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (roleData?.role) {
          const role = roleData.role as string;
          if (role === 'admin') {
            setUserPlan('admin');
          } else if (role === 'pro') {
            setUserPlan('pro');
          } else {
            setUserPlan('free');
          }
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
      }
    };
    
    fetchUserPlan();
  }, [user]);

  // Fetch notification preferences
  useEffect(() => {
    const fetchNotificationPrefs = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('notify_viral_videos, notify_weekly_reports, notify_new_features')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          setNotificationPrefs({
            notify_viral_videos: data.notify_viral_videos ?? true,
            notify_weekly_reports: data.notify_weekly_reports ?? true,
            notify_new_features: data.notify_new_features ?? true,
          });
        }
      } catch (error) {
        console.error('Error fetching notification prefs:', error);
      }
    };
    
    fetchNotificationPrefs();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        email: profile.email || '',
      });
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  // Fetch activity logs
  useEffect(() => {
    const fetchActivityLogs = async () => {
      if (!user) return;
      
      setLoadingLogs(true);
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        setActivityLogs(data || []);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      } finally {
        setLoadingLogs(false);
      }
    };
    
    fetchActivityLogs();
  }, [user]);

  useEffect(() => {
    if (settings) {
      setApiKeys({
        openai: settings.openai_api_key || '',
        claude: settings.claude_api_key || '',
        gemini: settings.gemini_api_key || '',
        youtube: settings.youtube_api_key || '',
        imagefx: settings.imagefx_cookies || '',
      });
      setUsePlatformCredits(settings.use_platform_credits);
    }
  }, [settings]);

  const canUseOwnApiKeys = hasPermission('usar_api_propria');

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    // Check storage limit
    const hasSpace = await canUpload(file.size);
    if (!hasSpace) {
      toast.error("Limite de armazenamento atingido! Faça upgrade do seu plano.");
      return;
    }
    
    setUploadingAvatar(true);
    
    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
          await unregisterUpload('avatars', oldPath);
        }
      }
      
      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { contentType: file.type });
      
      if (uploadError) throw uploadError;

      // Register upload for storage tracking
      await registerUpload({
        bucket_name: 'avatars',
        file_path: fileName,
        file_size: file.size,
        file_type: file.type
      });
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      setAvatarUrl(urlData.publicUrl);
      toast.success('Foto de perfil atualizada!');
      refetchProfile();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !avatarUrl) return;
    
    setUploadingAvatar(true);
    
    try {
      const oldPath = avatarUrl.split('/avatars/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
        await unregisterUpload('avatars', oldPath);
      }
      
      await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
      
      setAvatarUrl(null);
      toast.success('Foto removida!');
      refetchProfile();
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Erro ao remover foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleToggleCredits = async (checked: boolean) => {
    if (!canUseOwnApiKeys && !checked) {
      toast.error('Seu plano não permite usar API própria. Faça upgrade para um plano anual ou Master.');
      return;
    }
    
    setUsePlatformCredits(checked);
    await saveSettings({ use_platform_credits: checked } as any);
  };

  const handleValidateAndSave = async (provider: string) => {
    const key = apiKeys[provider as keyof typeof apiKeys];
    if (!key.trim()) {
      toast.error('Insira uma chave de API');
      return;
    }

    const valid = await validateApiKey(provider, key);
    
    const updateData: Record<string, string | boolean> = {};
    
    if (provider === 'imagefx') {
      updateData['imagefx_cookies'] = key;
      updateData['imagefx_validated'] = valid;
    } else {
      updateData[`${provider}_api_key`] = key;
      updateData[`${provider}_validated`] = valid;
    }
    
    await saveSettings(updateData as any);
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider as keyof typeof prev] }));
  };

  // Save notification preferences
  const handleNotificationChange = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!user) return;
    
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    setSavingNotifications(true);
    
    try {
      // Check if user has preferences record
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        await supabase
          .from('user_preferences')
          .update({
            [key]: value,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            [key]: value,
          });
      }
      
      toast.success('Preferência atualizada!');
    } catch (error) {
      console.error('Error saving notification pref:', error);
      toast.error('Erro ao salvar preferência');
      // Revert on error
      setNotificationPrefs(prev => ({ ...prev, [key]: !value }));
    } finally {
      setSavingNotifications(false);
    }
  };

  // Change password
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'video_analysis':
        return <Video className="w-4 h-4 text-primary" />;
      case 'script_generated':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'image_generated':
        return <Rocket className="w-4 h-4 text-purple-500" />;
      case 'tts_generated':
        return <Mic className="w-4 h-4 text-blue-500" />;
      case 'scene_generated':
        return <Play className="w-4 h-4 text-orange-500" />;
      default:
        return <History className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityLabel = (action: string) => {
    switch (action) {
      case 'video_analysis':
        return 'Vídeo analisado';
      case 'script_generated':
        return 'Roteiro gerado';
      case 'image_generated':
        return 'Imagem gerada';
      case 'tts_generated':
        return 'Áudio gerado';
      case 'scene_generated':
        return 'Cenas geradas';
      case 'thumbnail_generated':
        return 'Thumbnail gerada';
      case 'channel_analysis':
        return 'Canal analisado';
      default:
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      
      toast.success('Senha alterada com sucesso!');
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  const renderApiKeyField = (
    provider: string,
    label: string,
    placeholder: string,
    isLocked: boolean = false,
    isTextarea: boolean = false
  ) => {
    const key = apiKeys[provider as keyof typeof apiKeys];
    const validated = isValidated(provider);
    const isValidating = validating === provider;
    const showKey = showKeys[provider as keyof typeof showKeys];

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">{label}</label>
            {isLocked && (
              <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">
                <Lock className="w-3 h-3 mr-1" />
                Plano Anual/Master
              </Badge>
            )}
          </div>
          {key && !isLocked && (
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
        <div className={`flex gap-2 ${isTextarea ? 'flex-col' : ''}`}>
          <div className={`relative ${isTextarea ? 'w-full' : 'flex-1'}`}>
            {isTextarea ? (
              <Textarea
                placeholder={placeholder}
                value={key}
                onChange={(e) => setApiKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                className="bg-secondary border-border min-h-[100px] font-mono text-xs"
                disabled={isLocked}
              />
            ) : (
              <>
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder={placeholder}
                  value={key}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                  className="bg-secondary border-border pr-10"
                  disabled={isLocked}
                />
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => toggleShowKey(provider)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </>
            )}
          </div>
          <Button
            onClick={() => handleValidateAndSave(provider)}
            disabled={isValidating || !key.trim() || isLocked}
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
        {isLocked && (
          <p className="text-xs text-muted-foreground">
            Disponível apenas para planos anuais ou Master. <a href="/plans" className="text-primary hover:underline">Fazer upgrade</a>
          </p>
        )}
      </div>
    );
  };

  if (profileLoading || settingsLoading || permissionsLoading) {
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
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-2 border-border">
                      <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                      <AvatarFallback className="bg-secondary text-2xl">
                        {profileData.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">Foto de Perfil</p>
                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border"
                          disabled={uploadingAvatar}
                          asChild
                        >
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Enviar Foto
                          </span>
                        </Button>
                      </label>
                      {avatarUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={handleRemoveAvatar}
                          disabled={uploadingAvatar}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP. Máximo 2MB.</p>
                  </div>
                </div>

                {/* Name and Email */}
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

            {/* Credit Mode Selection */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Coins className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Modo de Uso</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Usar Créditos da Plataforma</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {usePlatformCredits 
                        ? 'Suas operações consomem créditos da plataforma. Simples e sem configuração.'
                        : 'Você está usando suas próprias chaves de API. Sem consumo de créditos.'}
                    </p>
                  </div>
                  <Switch 
                    checked={usePlatformCredits} 
                    onCheckedChange={handleToggleCredits}
                  />
                </div>
                
                {!canUseOwnApiKeys && (
                  <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <Lock className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-500">Recurso Premium</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Usar suas próprias chaves de API está disponível apenas para planos anuais ou Master. 
                        <a href="/plans" className="text-primary hover:underline ml-1">Fazer upgrade</a>
                      </p>
                    </div>
                  </div>
                )}
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
                {/* YouTube is available for all plans */}
                {renderApiKeyField('youtube', 'YouTube Data API Key', 'AIza...', false)}
                
                {/* AI APIs - locked for non-premium plans */}
                {renderApiKeyField('openai', 'OpenAI API Key', 'sk-...', !canUseOwnApiKeys)}
                {renderApiKeyField('claude', 'Claude API Key', 'sk-ant-...', !canUseOwnApiKeys)}
                {renderApiKeyField('gemini', 'Google Gemini API Key', 'AIza...', !canUseOwnApiKeys)}
                
              </div>
            </Card>

            {/* ImageFX Section */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Image className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">ImageFX (Geração de Imagens)</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Cole os cookies do ImageFX para gerar imagens. Para obter os cookies, acesse{' '}
                <a href="https://aitestkitchen.withgoogle.com/tools/image-fx" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  ImageFX
                </a>
                , faça login e extraia os cookies usando uma extensão como "EditThisCookie" ou "Cookie-Editor".
              </p>
              <div className="space-y-4">
                {renderApiKeyField('imagefx', 'Cookies do ImageFX', 'Cole seus cookies aqui (ex: __Secure-1PSID=xxx; ...)', !canUseOwnApiKeys, true)}
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
                  <Switch 
                    checked={notificationPrefs.notify_viral_videos}
                    onCheckedChange={(checked) => handleNotificationChange('notify_viral_videos', checked)}
                    disabled={savingNotifications}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Relatórios Semanais</p>
                    <p className="text-sm text-muted-foreground">Resumo semanal de performance</p>
                  </div>
                  <Switch 
                    checked={notificationPrefs.notify_weekly_reports}
                    onCheckedChange={(checked) => handleNotificationChange('notify_weekly_reports', checked)}
                    disabled={savingNotifications}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Novos Recursos</p>
                    <p className="text-sm text-muted-foreground">Atualizações sobre novos recursos</p>
                  </div>
                  <Switch 
                    checked={notificationPrefs.notify_new_features}
                    onCheckedChange={(checked) => handleNotificationChange('notify_new_features', checked)}
                    disabled={savingNotifications}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Segurança</h3>
              </div>
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="border-border text-foreground hover:bg-secondary"
                  onClick={() => setPasswordModalOpen(true)}
                >
                  Alterar Senha
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-foreground hover:bg-secondary opacity-50 cursor-not-allowed"
                  disabled
                  title="2FA não disponível no momento"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Ativar 2FA (Em breve)
                </Button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-medium text-foreground mb-3">Tutoriais</h4>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Resetar Tutoriais</p>
                    <p className="text-sm text-muted-foreground">Ver novamente todos os tutoriais guiados</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-border text-foreground hover:bg-secondary"
                    onClick={() => {
                      resetAllTutorials();
                      toast.success('Tutoriais resetados! Eles aparecerão novamente ao visitar cada página.');
                    }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resetar
                  </Button>
                </div>
              </div>
            </Card>

            {/* Activity Logs Section */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <History className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Histórico de Atividades</h3>
              </div>
              
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma atividade registrada ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getActivityIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm text-foreground">
                            {getActivityLabel(log.action)}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {log.created_at && format(new Date(log.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {log.description && (
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {log.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite sua nova senha abaixo. A senha deve ter pelo menos 6 caracteres.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Nova Senha</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Confirmar Nova Senha</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-secondary border-border"
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                As senhas não coincidem
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setPasswordModalOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {changingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Alterar Senha
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default SettingsPage;