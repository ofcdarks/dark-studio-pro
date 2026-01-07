import { useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserPreferences {
  theme: string;
  sidebar_order: string[] | null;
  directive_update_hours: number;
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
          .select('theme, sidebar_order, directive_update_hours')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setPreferences({
            theme: data.theme || 'dark',
            sidebar_order: data.sidebar_order,
            directive_update_hours: data.directive_update_hours ?? 24
          });
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
      
      setPreferences(prev => prev ? { ...prev, theme: newTheme } : { theme: newTheme, sidebar_order: null, directive_update_hours: 24 });
    } catch (err) {
      console.error('Error saving theme:', err);
    }
  }, [user?.id, setTheme]);

  // Save directive update frequency
  const saveDirectiveUpdateHours = useCallback(async (hours: number) => {
    if (!user?.id) return;

    try {
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_preferences')
          .update({
            directive_update_hours: hours,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            directive_update_hours: hours
          });
      }
      
      setPreferences(prev => prev ? { ...prev, directive_update_hours: hours } : { theme: 'dark', sidebar_order: null, directive_update_hours: hours });
    } catch (err) {
      console.error('Error saving directive update hours:', err);
    }
  }, [user?.id]);

  return {
    theme,
    setTheme: saveTheme,
    preferences,
    isLoading,
    directiveUpdateHours: preferences?.directive_update_hours ?? 24,
    saveDirectiveUpdateHours
  };
}
