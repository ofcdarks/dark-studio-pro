import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Globe, Save, Loader2, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Json } from "@/integrations/supabase/types";

interface GlobalMaintenanceSettings {
  is_active: boolean;
  message: string;
  estimated_end_time: string | null;
  show_countdown: boolean;
}

const DEFAULT_SETTINGS: GlobalMaintenanceSettings = {
  is_active: false,
  message: "Estamos realizando uma atualização programada. Voltamos em breve!",
  estimated_end_time: null,
  show_countdown: true,
};

export const AdminGlobalMaintenanceTab = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<GlobalMaintenanceSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'global_maintenance')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
        const value = data.value as Record<string, unknown>;
        setSettings({
          is_active: Boolean(value.is_active),
          message: String(value.message || DEFAULT_SETTINGS.message),
          estimated_end_time: value.estimated_end_time ? String(value.estimated_end_time) : null,
          show_countdown: value.show_countdown !== false,
        });
      }
    } catch (error) {
      console.error('Error fetching global maintenance settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Check if the setting exists
      const { data: existing } = await supabase
        .from('admin_settings')
        .select('id')
        .eq('key', 'global_maintenance')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('admin_settings')
          .update({
            value: settings as unknown as Json,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq('key', 'global_maintenance');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admin_settings')
          .insert([{
            key: 'global_maintenance',
            value: settings as unknown as Json,
            updated_by: user?.id,
          }]);

        if (error) throw error;
      }

      toast.success('Configurações salvas!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMaintenance = async (enabled: boolean) => {
    const newSettings = { ...settings, is_active: enabled };
    setSettings(newSettings);

    // Auto-save when toggling
    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from('admin_settings')
        .select('id')
        .eq('key', 'global_maintenance')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('admin_settings')
          .update({
            value: newSettings as unknown as Json,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq('key', 'global_maintenance');
      } else {
        await supabase
          .from('admin_settings')
          .insert([{
            key: 'global_maintenance',
            value: newSettings as unknown as Json,
            updated_by: user?.id,
          }]);
      }

      if (enabled) {
        toast.warning('🚧 Modo manutenção ATIVADO! Todos os usuários serão redirecionados.');
      } else {
        toast.success('✅ Modo manutenção desativado. Plataforma online!');
      }
    } catch (error) {
      console.error('Error toggling maintenance:', error);
      toast.error('Erro ao salvar');
      setSettings(settings); // Revert
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Manutenção Global
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ative para redirecionar todos os usuários para a página de manutenção
          </p>
        </div>
        {settings.is_active && (
          <Badge variant="destructive" className="animate-pulse">
            <AlertTriangle className="w-3 h-3 mr-1" />
            MODO MANUTENÇÃO ATIVO
          </Badge>
        )}
      </div>

      {/* Main Toggle Card */}
      <Card className={`p-6 ${settings.is_active ? 'bg-destructive/10 border-destructive/30' : 'bg-card'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              settings.is_active ? 'bg-destructive/20' : 'bg-primary/20'
            }`}>
              <Globe className={`w-6 h-6 ${settings.is_active ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div>
              <p className="font-medium text-lg text-foreground">
                {settings.is_active ? 'Plataforma em Manutenção' : 'Plataforma Online'}
              </p>
              <p className="text-sm text-muted-foreground">
                {settings.is_active 
                  ? 'Todos os usuários estão sendo redirecionados para /maintenance'
                  : 'Usuários podem acessar normalmente'}
              </p>
            </div>
          </div>
          <Switch
            checked={settings.is_active}
            onCheckedChange={toggleMaintenance}
            disabled={isSaving}
            className="scale-125"
          />
        </div>
      </Card>

      {/* Settings */}
      <Card className="p-6 space-y-6">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Configurações da Página
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem para Usuários</Label>
            <Textarea
              id="message"
              value={settings.message}
              onChange={(e) => setSettings({ ...settings, message: e.target.value })}
              placeholder="Descreva o motivo da manutenção..."
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endTime">Previsão de Retorno</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={settings.estimated_end_time || ''}
                onChange={(e) => setSettings({ ...settings, estimated_end_time: e.target.value || null })}
              />
            </div>

            <div className="space-y-2">
              <Label>Mostrar Contador</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  checked={settings.show_countdown}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_countdown: checked })}
                />
                <span className="text-sm text-muted-foreground">
                  {settings.show_countdown ? 'Sim, exibir contador regressivo' : 'Não, apenas mostrar data'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => window.open('/maintenance', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Visualizar Página
          </Button>

          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </Card>

      {/* Info */}
      <Card className="p-4 bg-secondary/30 border-dashed">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Quando usar?</p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• Durante deploys ou atualizações críticas</li>
              <li>• Manutenção de banco de dados</li>
              <li>• Migrações que podem causar instabilidade</li>
              <li>• Administradores ainda podem navegar normalmente</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
