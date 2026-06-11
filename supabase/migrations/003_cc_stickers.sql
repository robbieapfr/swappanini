-- Spécial Coca-Cola stickers (CC1–CC12)
INSERT INTO stickers (code, country, number, name, type) VALUES
  ('CC', 'Spécial Coca-Cola',  1,  'Lamine Yamal',       'Foil/Spécial'),
  ('CC', 'Spécial Coca-Cola',  2,  'Joshua Kimmich',     'Foil/Spécial'),
  ('CC', 'Spécial Coca-Cola',  3,  'Eduardo Camavinga',  'Foil/Spécial'),
  ('CC', 'Spécial Coca-Cola',  4,  'Josko Gvardiol',     'Foil/Spécial'),
  ('CC', 'Spécial Coca-Cola',  5,  'Frederico Valverde', 'Foil/Spécial'),
  ('CC', 'Spécial Coca-Cola',  6,  'Virgil van Dijk',    'Foil/Spécial'),
  ('CC', 'Spécial Coca-Cola',  7,  'Alphonso Davies',    'Foil/Spécial'),
  ('CC', 'Spécial Coca-Cola',  8,  'Raul Jimenez',       'Foil/Spécial'),
  ('CC', 'Spécial Coca-Cola',  9,  'William Saliba',     'Foil/Spécial'),
  ('CC', 'Spécial Coca-Cola', 10,  'Lautaro Martinez',   'Foil/Spécial'),
  ('CC', 'Spécial Coca-Cola', 11,  'Harry Kane',         'Foil/Spécial'),
  ('CC', 'Spécial Coca-Cola', 12,  'Antonee Robinson',   'Foil/Spécial')
ON CONFLICT (country, number) DO NOTHING;
