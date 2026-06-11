ALTER TABLE swaps
  ADD COLUMN IF NOT EXISTS swap_mode TEXT NOT NULL DEFAULT 'mail'
  CHECK (swap_mode IN ('mail', 'inperson', 'both'));
