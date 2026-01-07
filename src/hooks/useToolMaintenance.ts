import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ToolMaintenanceStatus {
  enabled: boolean;
  message?: string;
  estimatedEndTime?: string;
  updatedAt?: string;
}

export interface ToolMaintenanceData {
  tools: Record<string, ToolMaintenanceStatus>;
}

interface UseToolMaintenanceReturn {
  isUnderMaintenance: (toolPath: string) => boolean;
  getMaintenanceInfo: (toolPath: string) => ToolMaintenanceStatus | null;
  maintenanceData: ToolMaintenanceData | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

// List of all tools with their paths and display names
export const TOOL_REGISTRY = [
  { path: '/analyzer', name: 'Analisador de Vídeo', icon: '🎬' },
  { path: '/history', name: 'Histórico de Análises', icon: '📊' },
  { path: '/channel-analyzer', name: 'Analisador de Canal', icon: '📺' },
  { path: '/channels', name: 'Canais Monitorados', icon: '👁️' },
  { path: '/search-channels', name: 'Buscar Canais', icon: '🔍' },
  { path: '/explore', name: 'Explorar Nicho', icon: '🎯' },
  { path: '/analytics', name: 'Analytics do YouTube', icon: '📈' },
  { path: '/agents', name: 'Agentes Virais', icon: '🤖' },
  { path: '/library', name: 'Biblioteca Viral', icon: '📚' },
  { path: '/scenes', name: 'Prompts para Cenas', icon: '🎨' },
  { path: '/prompts', name: 'Prompts e Imagens', icon: '🖼️' },
  { path: '/voice', name: 'Gerador de Voz', icon: '🎙️' },
  { path: '/srt', name: 'Conversor SRT', icon: '📝' },
  { path: '/youtube', name: 'Integração YouTube', icon: '🔗' },
  { path: '/folders', name: 'Pastas', icon: '📁' },
  { path: '/settings', name: 'Configurações', icon: '⚙️' },
  { path: '/plans', name: 'Planos e Créditos', icon: '💎' },
];

export const useToolMaintenance = (): UseToolMaintenanceReturn => {
  const [maintenanceData, setMaintenanceData] = useState<ToolMaintenanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMaintenanceData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'tool_maintenance')
        .maybeSingle();

      if (error) {
        console.error('Error fetching maintenance data:', error);
        return;
      }

      if (data?.value) {
        setMaintenanceData(data.value as unknown as ToolMaintenanceData);
      } else {
        setMaintenanceData({ tools: {} });
      }
    } catch (err) {
      console.error('Error in fetchMaintenanceData:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceData();
  }, [fetchMaintenanceData]);

  const isUnderMaintenance = useCallback((toolPath: string): boolean => {
    if (!maintenanceData?.tools) return false;
    const toolStatus = maintenanceData.tools[toolPath];
    return toolStatus?.enabled === true;
  }, [maintenanceData]);

  const getMaintenanceInfo = useCallback((toolPath: string): ToolMaintenanceStatus | null => {
    if (!maintenanceData?.tools) return null;
    return maintenanceData.tools[toolPath] || null;
  }, [maintenanceData]);

  return {
    isUnderMaintenance,
    getMaintenanceInfo,
    maintenanceData,
    isLoading,
    refresh: fetchMaintenanceData
  };
};
