import { MainLayout } from "@/components/layout/MainLayout";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Youtube, Link, CheckCircle, Upload, BarChart3, Settings } from "lucide-react";

const YouTubeIntegration = () => {
  const isConnected = false;

  return (
    <MainLayout>
      <PermissionGate permission="analytics_youtube" featureName="Analytics YouTube">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Integração YouTube</h1>
            <p className="text-muted-foreground">
              Conecte seu canal e gerencie uploads diretamente
            </p>
          </div>

          {!isConnected ? (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <Youtube className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Conecte seu Canal</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Conecte sua conta do YouTube para fazer uploads automáticos, agendar publicações e acompanhar métricas em tempo real.
              </p>
              <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Youtube className="w-4 h-4 mr-2" />
                Conectar com YouTube
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                      <Youtube className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Canal Conectado</h3>
                      <p className="text-sm text-muted-foreground">@seucanal • 245K inscritos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="text-sm text-success">Conectado</span>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Upload de Vídeo</h3>
                  <p className="text-sm text-muted-foreground">Faça upload direto para seu canal</p>
                </Card>
                <Card className="p-5 hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Analytics</h3>
                  <p className="text-sm text-muted-foreground">Veja métricas do seu canal</p>
                </Card>
                <Card className="p-5 hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Configurações</h3>
                  <p className="text-sm text-muted-foreground">Gerencie a integração</p>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
      </PermissionGate>
    </MainLayout>
  );
};

export default YouTubeIntegration;
