import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [userStatus, setUserStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      checkUserStatus();
    }
  }, [user, loading, navigate]);

  const checkUserStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user?.id)
        .single();

      if (!error && data) {
        setUserStatus(data.status);
        
        // Se status é pending e não está na página de pending, redireciona
        if (data.status === "pending" && location.pathname !== "/pending-approval") {
          navigate("/pending-approval");
        }
      }
    } catch (e) {
      console.error("Erro ao verificar status:", e);
    } finally {
      setCheckingStatus(false);
    }
  };

  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Se usuário está pending e tentando acessar outra rota, não renderiza
  if (userStatus === "pending" && location.pathname !== "/pending-approval") {
    return null;
  }

  return <>{children}</>;
}
