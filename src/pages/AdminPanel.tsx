import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Database, Activity, Settings, Trash2, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

interface AdminStats {
  totalUsers: number;
  totalVideos: number;
  totalImages: number;
  totalAudios: number;
}

interface RecentUser {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string | null;
}

const AdminPanel = () => {
  const { role } = useProfile();
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalVideos: 0, totalImages: 0, totalAudios: 0 });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch counts
      const [usersRes, videosRes, imagesRes, audiosRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('video_analyses').select('id', { count: 'exact', head: true }),
        supabase.from('generated_images').select('id', { count: 'exact', head: true }),
        supabase.from('generated_audios').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalVideos: videosRes.count || 0,
        totalImages: imagesRes.count || 0,
        totalAudios: audiosRes.count || 0,
      });

      // Fetch recent users
      const { data: users } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentUsers(users || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    // Clear local storage cache
    const keys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));
    keys.forEach(k => localStorage.removeItem(k));
    toast.success('Cache limpo com sucesso!');
  };

  const handleViewLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      console.log('Activity Logs:', data);
      toast.info(`${data?.length || 0} logs encontrados. Veja o console.`);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Erro ao carregar logs');
    }
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Há menos de 1h';
    if (diffHours < 24) return `Há ${diffHours}h`;
    return `Há ${Math.floor(diffHours / 24)}d`;
  };

  if (role?.role !== 'admin') {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar o painel administrativo.
            </p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Painel Admin</h1>
              <p className="text-muted-foreground">
                Gerenciamento avançado da plataforma
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchAdminData}
              disabled={loading}
              className="border-border"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-muted-foreground text-sm">Usuários</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-muted-foreground text-sm">Análises</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats.totalVideos}</p>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-muted-foreground text-sm">Imagens</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats.totalImages}</p>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-muted-foreground text-sm">Áudios</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats.totalAudios}</p>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Usuários Recentes</h3>
                  </div>
                  <div className="space-y-3">
                    {recentUsers.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Nenhum usuário</p>
                    ) : (
                      recentUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                              <Users className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {user.full_name || 'Sem nome'}
                              </p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(user.created_at)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Ações Rápidas</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 border-border text-foreground hover:bg-secondary flex-col"
                      onClick={() => toast.info('Backup não disponível nesta versão')}
                    >
                      <Database className="w-5 h-5 mb-2 text-primary" />
                      <span className="text-sm">Backup DB</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 border-border text-foreground hover:bg-secondary flex-col"
                      onClick={handleClearCache}
                    >
                      <Trash2 className="w-5 h-5 mb-2 text-primary" />
                      <span className="text-sm">Limpar Cache</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 border-border text-foreground hover:bg-secondary flex-col"
                      onClick={handleViewLogs}
                    >
                      <Activity className="w-5 h-5 mb-2 text-primary" />
                      <span className="text-sm">Ver Logs</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 border-border text-foreground hover:bg-secondary flex-col"
                      onClick={() => window.location.href = '/settings'}
                    >
                      <Shield className="w-5 h-5 mb-2 text-primary" />
                      <span className="text-sm">Segurança</span>
                    </Button>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminPanel;
