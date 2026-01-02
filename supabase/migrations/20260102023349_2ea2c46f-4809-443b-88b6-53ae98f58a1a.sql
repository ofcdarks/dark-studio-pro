-- Add folder support to generated_titles so titles can be organized independently
ALTER TABLE public.generated_titles
ADD COLUMN IF NOT EXISTS folder_id uuid NULL;

-- Optional FK to folders (user-owned); keep nullable and set null on folder deletion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'generated_titles_folder_id_fkey'
  ) THEN
    ALTER TABLE public.generated_titles
    ADD CONSTRAINT generated_titles_folder_id_fkey
    FOREIGN KEY (folder_id)
    REFERENCES public.folders(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Helpful index for folder filtering
CREATE INDEX IF NOT EXISTS idx_generated_titles_folder_id
ON public.generated_titles(folder_id);