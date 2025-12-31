import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logo.gif";
import {
  Home,
  Video,
  Compass,
  FolderOpen,
  Eye,
  BarChart3,
  Library,
  Bot,
  Image,
  Mic,
  Images,
  Film,
  Youtube,
  Search,
  TrendingUp,
  FileText,
  Settings,
  Coins,
  HardDrive,
  Crown,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const mainNavItems: NavItem[] = [
  { icon: Home, label: "Início", href: "/" },
  { icon: Video, label: "Analisador de Vídeos", href: "/analyzer" },
  { icon: Compass, label: "Explorar Nicho", href: "/explore" },
  { icon: FolderOpen, label: "Pastas e Histórico", href: "/folders" },
  { icon: Eye, label: "Canais Monitorados", href: "/channels" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Library, label: "Biblioteca Virais", href: "/library" },
  { icon: Bot, label: "Agentes Virais", href: "/agents" },
  { icon: Image, label: "Prompts e Imagens", href: "/prompts" },
  { icon: Mic, label: "Gerador de Voz", href: "/voice" },
  { icon: Images, label: "Imagens em Lote", href: "/batch-images" },
  { icon: Film, label: "Gerador de Vídeo", href: "/video-gen" },
  { icon: Youtube, label: "Integração YouTube", href: "/youtube" },
  { icon: Search, label: "Buscar Canais Semelhantes", href: "/search-channels" },
  { icon: TrendingUp, label: "Análise de Canais Virais", href: "/viral-analysis" },
  { icon: FileText, label: "Conversor SRT", href: "/srt" },
  { icon: Settings, label: "Configurações", href: "/settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();
  const { profile, role } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const credits = profile?.credits ?? 0;
  const storageUsed = profile?.storage_used ?? 0;
  const storageLimit = profile?.storage_limit ?? 1;
  const userRole = role?.role ?? "free";

  const roleLabels = {
    admin: "ADMIN",
    pro: "PRO",
    free: "FREE",
  };

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <img 
          src={logo} 
          alt="Logo" 
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-foreground">La Casa Dark</span>
            <span className="text-primary text-sm font-semibold">CORE</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                location.pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium text-left">{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-border space-y-4">
        {/* Credits */}
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Coins className="w-5 h-5 text-primary flex-shrink-0" />
          {!collapsed && (
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Créditos</span>
                <span className="text-primary font-semibold">{credits.toLocaleString()}</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Comprar Créditos
              </Button>
            </div>
          )}
        </div>

        {/* Storage */}
        {!collapsed && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Armazenamento</span>
                  <span className="text-foreground font-medium">{storageUsed.toFixed(2)} GB</span>
                </div>
                <Progress value={(storageUsed / storageLimit) * 100} className="h-1.5 mt-1" />
              </div>
            </div>
          </div>
        )}

        {/* Plan */}
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Crown className="w-5 h-5 text-primary flex-shrink-0" />
          {!collapsed && (
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Plano Atual</div>
              <div className="text-foreground font-semibold">{roleLabels[userRole]}</div>
              {userRole !== "admin" && (
                <Button className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  Fazer Upgrade
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Admin Panel */}
        {userRole === "admin" && (
          <button
            onClick={() => navigate("/admin")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-primary hover:bg-sidebar-accent transition-colors",
              collapsed && "justify-center"
            )}
          >
            <Shield className="w-5 h-5" />
            {!collapsed && <span className="text-sm font-medium">Painel Admin</span>}
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
