import { useEffect, useState, useCallback, useRef } from 'react';
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
  const { theme, setTheme: setNextTheme, resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const isInitialized = useRef(false);
  const isSavingTheme = useRef(false);

  // Load preferences from database ONCE on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id || isInitialized.current) {
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
          
          // Apply saved theme from DB only on first load
          if (data.theme && !isInitialized.current) {
            setNextTheme(data.theme);
          }
        }
        
        isInitialized.current = true;
      } catch (err) {
        console.error('Error loading preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user?.id, setNextTheme]);

  // Save theme to database when user changes it
  const saveTheme = useCallback(async (newTheme: string) => {
    // Prevent double saves
    if (isSavingTheme.current) return;
    isSavingTheme.current = true;

    // Apply theme immediately via next-themes
    setNextTheme(newTheme);

    // Update local state
    setPreferences(prev => prev 
      ? { ...prev, theme: newTheme } 
      : { theme: newTheme, sidebar_order: null, directive_update_hours: 24 }
    );

    // Save to database if user is logged in
    if (user?.id) {
      try {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            theme: newTheme,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
      } catch (err) {
        console.error('Error saving theme:', err);
      }
    }

    // Allow new saves after a small delay
    setTimeout(() => {
      isSavingTheme.current = false;
    }, 100);
  }, [user?.id, setNextTheme]);

  // Save directive update frequency
  const saveDirectiveUpdateHours = useCallback(async (hours: number) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          directive_update_hours: hours,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      setPreferences(prev => prev 
        ? { ...prev, directive_update_hours: hours } 
        : { theme: 'dark', sidebar_order: null, directive_update_hours: hours }
      );
    } catch (err) {
      console.error('Error saving directive update hours:', err);
    }
  }, [user?.id]);

  return {
    theme: resolvedTheme || theme || 'dark',
    setTheme: saveTheme,
    preferences,
    isLoading,
    directiveUpdateHours: preferences?.directive_update_hours ?? 24,
    saveDirectiveUpdateHours
  };
}
