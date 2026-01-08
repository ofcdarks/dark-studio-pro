-- Drop the old trigger that references the wrong column name
DROP TRIGGER IF EXISTS update_pomodoro_state_updated_at ON public.pomodoro_state;

-- Recreate the trigger with the correct column name (last_updated_at)
CREATE OR REPLACE FUNCTION public.update_pomodoro_last_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pomodoro_last_updated_at
BEFORE UPDATE ON public.pomodoro_state
FOR EACH ROW
EXECUTE FUNCTION public.update_pomodoro_last_updated_at();