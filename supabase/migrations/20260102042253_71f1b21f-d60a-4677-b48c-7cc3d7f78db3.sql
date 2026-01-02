-- Add is_used column to generated_titles table
ALTER TABLE public.generated_titles 
ADD COLUMN is_used boolean DEFAULT false;