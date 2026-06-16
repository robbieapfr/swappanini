-- Replace the static `age` column with `birth_year` so age never goes stale
-- (it's computed from the year at display time).
ALTER TABLE users DROP COLUMN IF EXISTS age;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_year INT
  CHECK (birth_year IS NULL OR (birth_year >= 1900 AND birth_year <= 2025));
