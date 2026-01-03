import { useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserPreferences {
  theme: string;
  sidebar_order: string[] | null;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  // Load preferences from database
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('theme, sidebar_order')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setPreferences(data);
          // Apply saved theme
          if (data.theme && data.theme !== theme) {
            setTheme(data.theme);
          }
        }
      } catch (err) {
        console.error('Error loading preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user?.id]);

  // Save theme to database
  const saveTheme = useCallback(async (newTheme: string) => {
    setTheme(newTheme);

    if (!user?.id) return;

    try {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          theme: newTheme,
          updated_at: new Date().toISOString()
        });
      
      setPreferences(prev => prev ? { ...prev, theme: newTheme } : { theme: newTheme, sidebar_order: null });
    } catch (err) {
      console.error('Error saving theme:', err);
    }
  }, [user?.id, setTheme]);

  return {
    theme,
    setTheme: saveTheme,
    preferences,
    isLoading
  };
}
