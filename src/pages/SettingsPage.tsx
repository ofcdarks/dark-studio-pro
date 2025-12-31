import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings, Key, Bell, User, Shield, Palette } from "lucide-react";

const SettingsPage = () => {
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
                    <Input defaultValue="Admin" className="bg-secondary border-border" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Email</label>
                    <Input defaultValue="admin@example.com" className="bg-secondary border-border" />
                  </div>
                </div>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Salvar Alterações
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Chaves de API</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">OpenAI API Key</label>
                  <Input type="password" placeholder="sk-..." className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Claude API Key</label>
                  <Input type="password" placeholder="sk-ant-..." className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Google Gemini API Key</label>
                  <Input type="password" placeholder="AIza..." className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">ElevenLabs API Key</label>
                  <Input type="password" placeholder="..." className="bg-secondary border-border" />
                </div>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Salvar Chaves
                </Button>
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
