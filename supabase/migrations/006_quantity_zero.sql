-- Allow quantity = 0 rows so a MISSING sticker can still be pinned as a priority "want".
-- Previously CHECK (quantity >= 1) rejected these writes silently, so pinning a
-- priority on a missing sticker never persisted.
ALTER TABLE user_stickers DROP CONSTRAINT IF EXISTS user_stickers_quantity_check;
ALTER TABLE user_stickers ADD CONSTRAINT user_stickers_quantity_check CHECK (quantity >= 0);
ALTER TABLE user_stickers ALTER COLUMN quantity SET DEFAULT 0;
