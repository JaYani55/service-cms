ALTER TABLE public.plugins
  ADD COLUMN IF NOT EXISTS kind VARCHAR(50) NOT NULL DEFAULT 'plugin';

ALTER TABLE public.plugins
  ADD COLUMN IF NOT EXISTS external_url VARCHAR(2048);

ALTER TABLE public.plugins
  ADD COLUMN IF NOT EXISTS icon_url VARCHAR(2048);

ALTER TABLE public.plugins
  ALTER COLUMN repo_url DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'plugins_kind_check'
  ) THEN
    ALTER TABLE public.plugins
      ADD CONSTRAINT plugins_kind_check
      CHECK (kind IN ('plugin', 'webapp'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'plugins_kind_url_consistency'
  ) THEN
    ALTER TABLE public.plugins
      ADD CONSTRAINT plugins_kind_url_consistency
      CHECK (
        (kind = 'plugin' AND repo_url IS NOT NULL)
        OR (kind = 'webapp' AND external_url IS NOT NULL)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_plugins_kind ON public.plugins (kind);
