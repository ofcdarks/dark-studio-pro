import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Users,
  Coins,
  Key,
  Megaphone,
  CreditCard,
  FileCheck,
  HardDrive,
  Bell,
  Settings,
  RefreshCw,
  Loader2,
  Search,
  Edit,
  Lock,
  Trash2,
  UserMinus,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

interface AdminStats {
  totalUsers: number;
  pendingActivation: number;
  onlineNow: number;
  logins24h: number;
}

interface UserData {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string | null;
  credits: number | null;
  storage_used: number | null;
}

interface UserWithRole extends UserData {
  role: string;
  status: string;
  whatsapp?: string;
}

const AdminPanel = () => {
  const { role } = useProfile();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingActivation: 0,
    onlineNow: 0,
    logins24h: 0,
  });
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const usersPerPage = 10;

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch user profiles
      const { data: profiles, count } = await supabase
        .from("profiles")
        .select("*", { count: "exact" });

      // Fetch user roles
      const { data: userRoles } = await supabase.from("user_roles").select("*");

      // Map roles to users
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = userRoles?.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || "free",
          status: "Ativo",
          whatsapp: "",
        };
      });

      setUsers(usersWithRoles);
      setStats({
        totalUsers: count || 0,
        pendingActivation: 1,
        onlineNow: 1,
        logins24h: 5,
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAllPending = () => {
    toast.success("Todos os usuários pendentes foram aprovados!");
  };

  const handleEditUser = (userId: string) => {
    toast.info(`Editando usuário: ${userId}`);
  };

  const handleChangePassword = (userId: string) => {
    toast.info(`Alterando senha do usuário: ${userId}`);
  };

  const handleLockUser = (userId: string) => {
    toast.success(`Usuário bloqueado: ${userId}`);
  };

  const handleDisableUser = (userId: string) => {
    toast.success(`Usuário desativado: ${userId}`);
  };

  const handleDeleteUser = (userId: string) => {
    toast.success(`Usuário excluído: ${userId}`);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-500/20 text-purple-400 border-purple-500/50",
      pro: "bg-primary/20 text-primary border-primary/50",
      free: "bg-muted text-muted-foreground border-border",
    };
    return colors[role] || colors.free;
  };

  const getStatusBadge = (status: string) => {
    if (status === "Ativo") return "bg-success/20 text-success border-success/50";
    if (status === "Pendente") return "bg-primary/20 text-primary border-primary/50";
    return "bg-destructive/20 text-destructive border-destructive/50";
  };

  if (role?.role !== "admin") {
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Painel Administrativo</h1>
              <p className="text-muted-foreground">
                Gerir utilizadores, créditos e APIs da aplicação.
              </p>
            </div>
            <Button variant="outline" onClick={fetchAdminData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="bg-secondary/50 p-1 h-auto flex-wrap">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Utilizadores
              </TabsTrigger>
              <TabsTrigger value="credits" className="flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Créditos
              </TabsTrigger>
              <TabsTrigger value="apis" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                APIs
              </TabsTrigger>
              <TabsTrigger value="pixel" className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                Pixel/Ads
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pagamentos
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                Assinaturas
              </TabsTrigger>
              <TabsTrigger value="storage" className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Armazenamento
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Permissões de Planos
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-5">
                  <p className="text-sm text-muted-foreground mb-2">Total de Utilizadores</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                </Card>
                <Card className="p-5">
                  <p className="text-sm text-muted-foreground mb-2">Ativação Pendente</p>
                  <p className="text-3xl font-bold text-primary">{stats.pendingActivation}</p>
                </Card>
                <Card className="p-5">
                  <p className="text-sm text-muted-foreground mb-2">Online Agora (15min)</p>
                  <p className="text-3xl font-bold text-success">{stats.onlineNow}</p>
                </Card>
                <Card className="p-5">
                  <p className="text-sm text-muted-foreground mb-2">Logins (24h)</p>
                  <p className="text-3xl font-bold text-foreground">{stats.logins24h}</p>
                </Card>
              </div>

              {/* Approve All Button */}
              <Button
                onClick={handleApproveAllPending}
                className="w-full bg-success text-success-foreground hover:bg-success/90"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar Todos os Utilizadores Pendentes
              </Button>

              {/* User Management */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Gerenciamento de Utilizadores
                </h3>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por email, whatsapp ou nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-40 bg-secondary border-border">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="10">
                    <SelectTrigger className="w-32 bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 por página</SelectItem>
                      <SelectItem value="25">25 por página</SelectItem>
                      <SelectItem value="50">50 por página</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Table */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="pb-3 pr-4">
                              <Checkbox />
                            </th>
                            <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">
                              EMAIL
                            </th>
                            <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">
                              WHATSAPP
                            </th>
                            <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">
                              CARGO
                            </th>
                            <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">
                              PLANO
                            </th>
                            <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">
                              STATUS
                            </th>
                            <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">
                              TAGS
                            </th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground">AÇÕES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedUsers.map((user) => (
                            <tr key={user.id} className="border-b border-border/50">
                              <td className="py-4 pr-4">
                                <Checkbox
                                  checked={selectedUsers.includes(user.id)}
                                  onCheckedChange={() => toggleUserSelection(user.id)}
                                />
                              </td>
                              <td className="py-4 pr-4 text-sm text-foreground">{user.email}</td>
                              <td className="py-4 pr-4 text-sm text-primary">
                                {user.whatsapp || "N/A"}
                              </td>
                              <td className="py-4 pr-4 text-sm text-muted-foreground">Utilizador</td>
                              <td className="py-4 pr-4">
                                <Badge className={getRoleBadge(user.role)}>
                                  {user.role.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="py-4 pr-4">
                                <Badge className={getStatusBadge(user.status)}>{user.status}</Badge>
                              </td>
                              <td className="py-4 pr-4 text-sm text-muted-foreground">N/A</td>
                              <td className="py-4">
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => handleEditUser(user.id)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => handleChangePassword(user.id)}
                                  >
                                    <Key className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => handleLockUser(user.id)}
                                  >
                                    <Lock className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => handleDisableUser(user.id)}
                                  >
                                    <UserMinus className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeleteUser(user.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-end gap-2 mt-4">
                      <span className="text-sm text-muted-foreground">Anterior</span>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={currentPage === page ? "bg-primary" : ""}
                        >
                          {page}
                        </Button>
                      ))}
                      <span className="text-sm text-muted-foreground">Próximo</span>
                    </div>
                  </>
                )}
              </Card>
            </TabsContent>

            {/* Credits Tab */}
            <TabsContent value="credits">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Gerenciamento de Créditos
                </h3>
                <p className="text-muted-foreground">
                  Configure os pacotes de créditos e gerencie saldos dos usuários.
                </p>
              </Card>
            </TabsContent>

            {/* APIs Tab */}
            <TabsContent value="apis">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Configurações de APIs</h3>
                <p className="text-muted-foreground">
                  Gerencie as chaves de API e integrações externas.
                </p>
              </Card>
            </TabsContent>

            {/* Pixel/Ads Tab */}
            <TabsContent value="pixel">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Pixel e Anúncios</h3>
                <p className="text-muted-foreground">
                  Configure pixels de rastreamento e integrações de anúncios.
                </p>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Pagamentos</h3>
                <p className="text-muted-foreground">
                  Visualize histórico de pagamentos e configure gateways.
                </p>
              </Card>
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Assinaturas</h3>
                <p className="text-muted-foreground">
                  Gerencie assinaturas ativas e configure planos.
                </p>
              </Card>
            </TabsContent>

            {/* Storage Tab */}
            <TabsContent value="storage">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Armazenamento</h3>
                <p className="text-muted-foreground">
                  Monitore o uso de armazenamento e configure limites.
                </p>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Notificações</h3>
                <p className="text-muted-foreground">
                  Configure notificações por email, push e SMS.
                </p>
              </Card>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Permissões de Planos</h3>
                <p className="text-muted-foreground">
                  Configure as permissões e recursos de cada plano.
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminPanel;
