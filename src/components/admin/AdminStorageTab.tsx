import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HardDrive, Image, Database, Loader2, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserStorage {
  id: string;
  email: string | null;
  full_name: string | null;
  whatsapp: string | null;
  storage_used: number | null;
  storage_limit: number | null;
}

export function AdminStorageTab() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserStorage[]>([]);
  const [stats, setStats] = useState({
    totalSpace: 0,
    usedSpace: 0,
    freeSpace: 0,
    imagesSize: 0,
  });

  useEffect(() => {
    fetchStorageData();
  }, []);

  const fetchStorageData = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, whatsapp, storage_used, storage_limit")
        .order("storage_used", { ascending: false });

      if (profiles) {
        setUsers(profiles);
        
        const totalUsed = profiles.reduce((acc, p) => acc + (p.storage_used || 0), 0);
        const totalLimit = profiles.reduce((acc, p) => acc + (p.storage_limit || 1), 0);
        
        setStats({
          totalSpace: totalLimit,
          usedSpace: totalUsed,
          freeSpace: totalLimit - totalUsed,
          imagesSize: totalUsed * 0.7, // Approximate
        });
      }
    } catch (error) {
      console.error("Error fetching storage data:", error);
      toast.error("Erro ao carregar dados de armazenamento");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic search filter
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(term) ||
        u.full_name?.toLowerCase().includes(term) ||
        u.whatsapp?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const formatSize = (gb: number) => {
    if (gb < 0.001) return `${(gb * 1024 * 1024).toFixed(2)} KB`;
    if (gb < 1) return `${(gb * 1024).toFixed(2)} MB`;
    return `${gb.toFixed(2)} GB`;
  };

  const getUsagePercent = (used: number | null, limit: number | null) => {
    if (!limit || limit === 0) return 0;
    return ((used || 0) / limit) * 100;
  };

  const handleResetStorage = async (userId: string) => {
    try {
      // Delete all file upload records for this user
      const { error: deleteError } = await supabase
        .from("user_file_uploads")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Reset storage in profile (trigger will also update this, but let's be explicit)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ storage_used: 0 })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast.success("Armazenamento resetado!");
      fetchStorageData();
    } catch (error) {
      console.error("Error resetting storage:", error);
      toast.error("Erro ao resetar armazenamento");
    }
  };

  const handleUpdateLimit = async (userId: string, newLimit: number) => {
    const { error } = await supabase
      .from("profiles")
      .update({ storage_limit: newLimit })
      .eq("id", userId);

    if (error) {
      toast.error("Erro ao atualizar limite");
    } else {
      toast.success("Limite atualizado!");
      fetchStorageData();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Estatísticas do Servidor</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Espaço Total</p>
            <p className="text-2xl font-bold text-foreground">{formatSize(stats.totalSpace)}</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg border-l-4 border-l-primary">
            <p className="text-sm text-muted-foreground mb-1">Espaço Usado (Total Usuários)</p>
            <p className="text-2xl font-bold text-foreground">{formatSize(stats.usedSpace)}</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Espaço Disponível (Livre)</p>
            <p className="text-2xl font-bold text-success">{formatSize(stats.freeSpace)}</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Imagens Geradas</p>
            <p className="text-2xl font-bold text-primary">{formatSize(stats.imagesSize)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Armazenamento por Usuário</h3>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, nome ou whatsapp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 bg-secondary border-border pl-10"
              />
            </div>
            <Button variant="outline" onClick={fetchStorageData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {searchTerm && (
          <p className="text-xs text-muted-foreground mb-4">
            {filteredUsers.length} resultado(s) encontrado(s)
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EMAIL</TableHead>
                <TableHead>WHATSAPP</TableHead>
                <TableHead>NOME</TableHead>
                <TableHead>USO</TableHead>
                <TableHead>LIMITE</TableHead>
                <TableHead>%</TableHead>
                <TableHead>AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {searchTerm ? "Nenhum usuário encontrado" : "Nenhum dado de armazenamento"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const percent = getUsagePercent(user.storage_used, user.storage_limit);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="text-primary">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">{user.whatsapp || "N/A"}</TableCell>
                      <TableCell className="text-muted-foreground">{user.full_name || "N/A"}</TableCell>
                      <TableCell>{formatSize(user.storage_used || 0)}</TableCell>
                      <TableCell>{formatSize(user.storage_limit || 1)}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            percent > 90 
                              ? "bg-destructive/20 text-destructive" 
                              : percent > 70 
                                ? "bg-primary/20 text-primary" 
                                : "bg-success/20 text-success"
                          }
                        >
                          {percent.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleResetStorage(user.id)}
                          >
                            Resetar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => {
                              const newLimit = prompt("Novo limite (GB):", String(user.storage_limit || 1));
                              if (newLimit) handleUpdateLimit(user.id, Number(newLimit));
                            }}
                          >
                            Limite
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
