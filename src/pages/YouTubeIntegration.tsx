import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Youtube, CheckCircle, Upload, BarChart3, Settings, Loader2, LogOut, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface YouTubeConnection {
  id: string;
  channel_id: string;
  channel_name: string;
  channel_thumbnail: string;
  subscribers_count: number;
  connected_at: string;
}

const YouTubeIntegration = () => {
  const { user } = useAuth();
  const [connection, setConnection] = useState<YouTubeConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Check for OAuth callback params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      toast.error('Erro ao conectar: ' + error);
      window.history.replaceState({}, '', '/youtube');
      return;
    }

    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, []);

  // Fetch existing connection
  useEffect(() => {
    if (user) {
      fetchConnection();
    }
  }, [user]);

  const fetchConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('youtube_connections')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setConnection(data);
    } catch (error) {
      console.error('Error fetching connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-auth-url');
      
      if (error) throw error;
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL returned');
      }
    } catch (error: any) {
      console.error('Error starting OAuth:', error);
      toast.error('Erro ao iniciar conexão: ' + error.message);
      setConnecting(false);
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    setConnecting(true);
    // Clean URL
    window.history.replaceState({}, '', '/youtube');
    
    try {
      const { data, error } = await supabase.functions.invoke('youtube-oauth-callback', {
        body: { code, state }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success('Canal conectado com sucesso!');
        fetchConnection();
      } else {
        throw new Error(data.error || 'Erro ao conectar');
      }
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      toast.error('Erro ao finalizar conexão: ' + error.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar seu canal do YouTube?')) return;
    
    setDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke('youtube-disconnect');
      
      if (error) throw error;
      
      setConnection(null);
      toast.success('Canal desconectado com sucesso');
    } catch (error: any) {
      console.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar: ' + error.message);
    } finally {
      setDisconnecting(false);
    }
  };

  const formatSubscribers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <MainLayout>
      <SEOHead
        title="Integração YouTube"
        description="Conecte seu canal do YouTube e gerencie uploads diretamente pela plataforma."
        noindex={true}
      />
      <PermissionGate permission="analytics_youtube" featureName="Analytics YouTube">
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Integração YouTube</h1>
              <p className="text-muted-foreground">
                Conecte seu canal e gerencie uploads diretamente
              </p>
            </div>

            {loading ? (
              <Card className="p-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </Card>
            ) : !connection ? (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                  <Youtube className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Conecte seu Canal</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Conecte sua conta do YouTube para fazer uploads automáticos, agendar publicações e acompanhar métricas em tempo real.
                </p>
                <Button 
                  onClick={handleConnect}
                  disabled={connecting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {connecting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Youtube className="w-4 h-4 mr-2" />
                  )}
                  {connecting ? 'Conectando...' : 'Conectar com YouTube'}
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {connection.channel_thumbnail ? (
                        <img 
                          src={connection.channel_thumbnail} 
                          alt={connection.channel_name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                          <Youtube className="w-6 h-6 text-destructive" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-foreground">{connection.channel_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatSubscribers(connection.subscribers_count)} inscritos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-500">Conectado</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                      >
                        {disconnecting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-5 hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Upload de Vídeo</h3>
                    <p className="text-sm text-muted-foreground">Faça upload direto para seu canal</p>
                    <span className="text-xs text-muted-foreground/60 mt-2 block">Em breve</span>
                  </Card>
                  
                  <Card 
                    className="p-5 hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={() => window.open(`https://studio.youtube.com/channel/${connection.channel_id}`, '_blank')}
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                      Analytics
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-muted-foreground">Abrir YouTube Studio</p>
                  </Card>
                  
                  <Card className="p-5 hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                      <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Configurações</h3>
                    <p className="text-sm text-muted-foreground">Gerencie a integração</p>
                    <span className="text-xs text-muted-foreground/60 mt-2 block">Em breve</span>
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
