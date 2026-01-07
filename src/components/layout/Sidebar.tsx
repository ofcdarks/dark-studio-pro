import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useStorage } from "@/hooks/useStorage";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
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
  HardDrive,
  Crown,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  History,
  GripVertical,
  RotateCcw,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreditsDisplay } from "./CreditsDisplay";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CreditHistoryModal } from "@/components/credits/CreditHistoryModal";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  id: string;
  category?: string;
}

// Categorias para separadores visuais
const categories: Record<string, string> = {
  home: "",
  pesquisa: "Pesquisa",
  planejamento: "Planejamento",
  analise: "Análise",
  criacao: "Criação",
  producao: "Produção",
  publicacao: "Publicação",
  metricas: "Métricas",
  organizacao: "Organização",
};

// Ordem cronológica de produção de vídeo
const defaultNavItems: NavItem[] = [
  { id: "home", icon: Home, label: "Início", href: "/", category: "home" },
  // Pesquisa e Análise
  { id: "explore", icon: Compass, label: "Explorar Nicho", href: "/explore", category: "pesquisa" },
  { id: "channel-analyzer", icon: BarChart3, label: "Análise de Canais", href: "/channel-analyzer", category: "pesquisa" },
  // Planejamento
  { id: "library", icon: Library, label: "Biblioteca Virais", href: "/library", category: "planejamento" },
  { id: "channels", icon: Eye, label: "Canais Monitorados", href: "/channels", category: "planejamento" },
  // Análise de conteúdo
  { id: "analyzer", icon: Video, label: "Analisador de Vídeos", href: "/analyzer", category: "analise" },
  { id: "history", icon: History, label: "Histórico de Análises", href: "/history", category: "analise" },
  // Criação
  { id: "agents", icon: Bot, label: "Agentes Virais", href: "/agents", category: "criacao" },
  { id: "scenes", icon: Film, label: "Gerador de Cenas", href: "/scenes", category: "criacao" },
  { id: "prompts", icon: Image, label: "Prompts e Imagens", href: "/prompts", category: "criacao" },
  // Produção
  { id: "voice", icon: Mic, label: "Gerador de Voz", href: "/voice", category: "producao" },
  // { id: "video-gen", icon: Film, label: "Gerador de Vídeo", href: "/video-gen", category: "producao" }, // Em Breve
  { id: "srt", icon: FileText, label: "Conversor SRT", href: "/srt", category: "producao" },
  // Publicação
  { id: "youtube", icon: Youtube, label: "Integração YouTube", href: "/youtube", category: "publicacao" },
  // Métricas
  { id: "analytics", icon: BarChart3, label: "Analytics", href: "/analytics", category: "metricas" },
  // Organização
  { id: "folders", icon: FolderOpen, label: "Pastas e Histórico", href: "/folders", category: "organizacao" },
  { id: "settings", icon: Settings, label: "Configurações", href: "/settings", category: "organizacao" },
];

const SIDEBAR_ORDER_KEY = "sidebar-nav-order";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>(defaultNavItems);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { profile, role } = useProfile();
  const { storageUsed, storageLimit, usagePercent } = useStorage();
  const { balance: creditsBalance, loading: creditsLoading } = useCredits();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isLowCredits = creditsBalance < 50;

  // Reorder items based on saved order
  const reorderItems = useCallback((orderIds: string[]) => {
    const reorderedItems = orderIds
      .map(id => defaultNavItems.find(item => item.id === id))
      .filter((item): item is NavItem => item !== undefined);
    
    // Add any new items that weren't in saved order
    defaultNavItems.forEach(item => {
      if (!reorderedItems.find(i => i.id === item.id)) {
        reorderedItems.push(item);
      }
    });
    
    return reorderedItems;
  }, []);

  // Load saved order from database or localStorage fallback
  useEffect(() => {
    const loadOrder = async () => {
      if (!user?.id) {
        // Fallback to localStorage for non-authenticated users
        const savedOrder = localStorage.getItem(SIDEBAR_ORDER_KEY);
        if (savedOrder) {
          try {
            const orderIds: string[] = JSON.parse(savedOrder);
            setNavItems(reorderItems(orderIds));
          } catch {
            setNavItems(defaultNavItems);
          }
        }
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('sidebar_order')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.sidebar_order && data.sidebar_order.length > 0) {
          setNavItems(reorderItems(data.sidebar_order));
        } else {
          // Check localStorage and migrate to database
          const savedOrder = localStorage.getItem(SIDEBAR_ORDER_KEY);
          if (savedOrder) {
            const orderIds: string[] = JSON.parse(savedOrder);
            setNavItems(reorderItems(orderIds));
            // Migrate to database
            await supabase
              .from('user_preferences')
              .upsert({ user_id: user.id, sidebar_order: orderIds });
            localStorage.removeItem(SIDEBAR_ORDER_KEY);
          }
        }
      } catch (err) {
        console.error('Error loading sidebar order:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [user?.id, reorderItems]);

  // Save order to database
  const saveOrder = useCallback(async (orderIds: string[]) => {
    if (!user?.id) {
      localStorage.setItem(SIDEBAR_ORDER_KEY, JSON.stringify(orderIds));
      return;
    }

    try {
      await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: user.id, 
          sidebar_order: orderIds,
          updated_at: new Date().toISOString()
        });
    } catch (err) {
      console.error('Error saving sidebar order:', err);
      // Fallback to localStorage
      localStorage.setItem(SIDEBAR_ORDER_KEY, JSON.stringify(orderIds));
    }
  }, [user?.id]);

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = navItems.findIndex(item => item.id === draggedItem);
    const targetIndex = navItems.findIndex(item => item.id === targetId);

    const newItems = [...navItems];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    setNavItems(newItems);
    saveOrder(newItems.map(i => i.id));
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const resetOrder = async () => {
    setNavItems(defaultNavItems);
    if (user?.id) {
      await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: user.id, 
          sidebar_order: null,
          updated_at: new Date().toISOString()
        });
    }
    localStorage.removeItem(SIDEBAR_ORDER_KEY);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const userRole = role?.role ?? "free";

  const roleLabels = {
    admin: "ADMIN",
    pro: "PRO",
    free: "FREE",
  };

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300 hidden md:flex",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full ring-2 ring-primary overflow-hidden">
            <img 
              src={logo} 
              alt="Logo" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-playfair text-lg font-semibold text-foreground tracking-wide">La Casa Dark</span>
            <span className="text-primary text-sm font-bold tracking-widest">CORE</span>
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
        {!collapsed && (
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs text-muted-foreground">Arraste para reordenar</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={resetOrder}
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Restaurar ordem padrão</TooltipContent>
            </Tooltip>
          </div>
        )}
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(item.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(item.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group cursor-grab active:cursor-grabbing",
                draggedItem === item.id && "opacity-50"
              )}
            >
              <button
                onClick={() => navigate(item.href)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                {!collapsed && (
                  <GripVertical className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
                )}
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium text-left flex-1">{item.label}</span>}
              </button>
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-border space-y-4">
        {/* Credits Section */}
        {!collapsed ? (
          <div className={cn(
            "p-3 rounded-xl bg-secondary/50 border space-y-2 transition-all",
            isLowCredits 
              ? "border-primary/50 animate-pulse shadow-[0_0_15px_hsl(var(--primary)/0.3)]" 
              : "border-border"
          )}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coins className={cn("w-4 h-4", isLowCredits ? "text-destructive" : "text-primary")} />
              <span className="text-sm">Créditos</span>
              {isLowCredits && (
                <span className="ml-auto text-xs text-destructive font-medium">Baixo!</span>
              )}
            </div>
            <div className={cn(
              "text-2xl font-bold",
              isLowCredits ? "text-destructive" : "text-primary"
            )}>
              {creditsLoading ? "..." : creditsBalance.toLocaleString()}
            </div>
            <Button 
              className={cn(
                "w-full",
                isLowCredits 
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              size="sm"
              onClick={() => navigate("/plans")}
            >
              Comprar Créditos
            </Button>
            <button
              onClick={() => setHistoryModalOpen(true)}
              className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Ver Histórico
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button onClick={() => setHistoryModalOpen(true)}>
              <Coins className={cn(
                "w-5 h-5 cursor-pointer hover:scale-110 transition-transform",
                isLowCredits ? "text-destructive animate-pulse" : "text-primary"
              )} />
            </button>
          </div>
        )}

        <CreditHistoryModal 
          open={historyModalOpen} 
          onOpenChange={setHistoryModalOpen} 
        />

        {/* Storage Section */}
        {!collapsed ? (
          <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HardDrive className="w-4 h-4" />
              <span className="text-sm">Armazenamento</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {storageUsed.toFixed(2)} GB
            </div>
            <div className="text-xs text-muted-foreground">
              de {storageLimit.toFixed(1)} GB
            </div>
            <Progress value={Math.min(usagePercent, 100)} className="h-1.5" />
          </div>
        ) : (
          <div className="flex justify-center">
            <HardDrive className="w-5 h-5 text-muted-foreground" />
          </div>
        )}

        {/* Plan */}
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Crown className="w-5 h-5 text-primary flex-shrink-0" />
          {!collapsed && (
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Plano Atual</div>
              <div className="text-foreground font-semibold">{roleLabels[userRole]}</div>
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
