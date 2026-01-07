import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useToolMaintenance, TOOL_REGISTRY } from "@/hooks/useToolMaintenance";
import { MaintenanceModal } from "./MaintenanceModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const { isUnderMaintenance, getMaintenanceInfo, isLoading } = useToolMaintenance();
  const [showModal, setShowModal] = useState(false);
  const [currentToolName, setCurrentToolName] = useState("");
  const [maintenanceMessage, setMaintenanceMessage] = useState<string | undefined>();
  const [estimatedEndTime, setEstimatedEndTime] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        return;
      }
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!data);
    };
    
    checkAdmin();
  }, [user?.id]);

  useEffect(() => {
    // Don't check maintenance for admins
    if (isAdmin) {
      setShowModal(false);
      return;
    }

    // Skip if still loading or no user
    if (isLoading || !user) return;

    const currentPath = location.pathname;
    
    // Find the tool that matches the current path
    const matchingTool = TOOL_REGISTRY.find(tool => currentPath.startsWith(tool.path));
    
    if (matchingTool && isUnderMaintenance(matchingTool.path)) {
      const info = getMaintenanceInfo(matchingTool.path);
      setCurrentToolName(matchingTool.name);
      setMaintenanceMessage(info?.message);
      setEstimatedEndTime(info?.estimatedEndTime);
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [location.pathname, isUnderMaintenance, getMaintenanceInfo, isLoading, isAdmin, user]);

  return (
    <>
      {children}
      <MaintenanceModal
        isOpen={showModal}
        toolName={currentToolName}
        message={maintenanceMessage}
        estimatedEndTime={estimatedEndTime}
      />
    </>
  );
};
