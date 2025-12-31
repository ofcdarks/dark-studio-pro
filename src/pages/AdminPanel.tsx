import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Database, Activity, Settings, Trash2 } from "lucide-react";

const AdminPanel = () => {
  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Painel Admin</h1>
            <p className="text-muted-foreground">
              Gerenciamento avançado da plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground text-sm">Usuários</span>
              </div>
              <p className="text-3xl font-bold text-foreground">1,234</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground text-sm">Armazenamento</span>
              </div>
              <p className="text-3xl font-bold text-foreground">45.2 GB</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground text-sm">Requisições/dia</span>
              </div>
              <p className="text-3xl font-bold text-foreground">12.5K</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground text-sm">Uptime</span>
              </div>
              <p className="text-3xl font-bold text-foreground">99.9%</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Usuários Recentes</h3>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Usuário #{index + 1}</p>
                        <p className="text-xs text-muted-foreground">user{index + 1}@email.com</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">Há {index + 1}h</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Ações Rápidas</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto py-4 border-border text-foreground hover:bg-secondary flex-col">
                  <Database className="w-5 h-5 mb-2 text-primary" />
                  <span className="text-sm">Backup DB</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 border-border text-foreground hover:bg-secondary flex-col">
                  <Trash2 className="w-5 h-5 mb-2 text-primary" />
                  <span className="text-sm">Limpar Cache</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 border-border text-foreground hover:bg-secondary flex-col">
                  <Activity className="w-5 h-5 mb-2 text-primary" />
                  <span className="text-sm">Ver Logs</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 border-border text-foreground hover:bg-secondary flex-col">
                  <Shield className="w-5 h-5 mb-2 text-primary" />
                  <span className="text-sm">Segurança</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminPanel;
