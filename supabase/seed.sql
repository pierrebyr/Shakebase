-- ShakeBase seed data — global catalog
-- Runs after migrations in local dev (supabase db reset)
-- Production seed is applied manually once via the SQL editor or by
-- running `supabase db push` then `psql -f seed.sql`.

-- =====================================================================
-- Global ingredients
-- =====================================================================
INSERT INTO global_ingredients (name, category, default_unit, allergens) VALUES
  ('Lime juice',          'citrus',  'ml', '{}'),
  ('Lemon juice',          'citrus',  'ml', '{}'),
  ('Grapefruit juice',     'citrus',  'ml', '{}'),
  ('Orange juice',         'citrus',  'ml', '{}'),
  ('Pineapple juice',      'fruit',   'ml', '{}'),
  ('Simple syrup',         'sugar',   'ml', '{}'),
  ('Agave syrup',          'sugar',   'ml', '{}'),
  ('Demerara syrup',       'sugar',   'ml', '{}'),
  ('Honey syrup',          'sugar',   'ml', '{}'),
  ('Grenadine',            'sugar',   'ml', '{}'),
  ('Orgeat',               'sugar',   'ml', '{"nuts"}'),
  ('Angostura bitters',    'bitter',  'dash', '{}'),
  ('Orange bitters',       'bitter',  'dash', '{}'),
  ('Peychaud''s bitters',  'bitter',  'dash', '{}'),
  ('Mole bitters',         'bitter',  'dash', '{}'),
  ('Mint',                 'herb',    'leaves', '{}'),
  ('Basil',                'herb',    'leaves', '{}'),
  ('Thyme',                'herb',    'sprig', '{}'),
  ('Rosemary',             'herb',    'sprig', '{}'),
  ('Egg white',            'dairy',   'piece', '{"egg"}'),
  ('Heavy cream',          'dairy',   'ml', '{"dairy"}'),
  ('Coconut cream',        'dairy',   'ml', '{}'),
  ('Strawberry',           'fruit',   'piece', '{}'),
  ('Cucumber',             'fruit',   'slice', '{}'),
  ('Apple',                'fruit',   'piece', '{}'),
  ('Ginger',               'fruit',   'slice', '{}'),
  ('Salt',                 'garnish', 'pinch', '{}'),
  ('Tajín',                'garnish', 'pinch', '{}'),
  ('Orange zest',          'garnish', 'piece', '{}'),
  ('Lemon zest',           'garnish', 'piece', '{}'),
  ('Cherry (luxardo)',     'garnish', 'piece', '{}'),
  ('Olive',                'garnish', 'piece', '{}'),
  ('Sparkling water',      'mixer',   'ml', '{}'),
  ('Tonic water',          'mixer',   'ml', '{}'),
  ('Ginger beer',          'mixer',   'ml', '{}'),
  ('Cola',                 'mixer',   'ml', '{}'),
  ('Coffee',               'mixer',   'ml', '{}'),
  ('Cold brew',            'mixer',   'ml', '{}')
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- Global products (brands + expressions)
-- =====================================================================
INSERT INTO global_products (brand, expression, category, abv, origin, description) VALUES
  ('Casa Dragones', 'Joven',                  'tequila', 40.00, 'Jalisco, MX',     'Small-batch blend of silver + extra-añejo. Complex, smooth, floral.'),
  ('Casa Dragones', 'Blanco',                 'tequila', 40.00, 'Jalisco, MX',     'Pure silver tequila. Crisp agave, pepper, citrus.'),
  ('Casa Dragones', 'Reposado Mizunara',      'tequila', 40.00, 'Jalisco, MX',     'Aged in Mizunara oak. Sandalwood, coconut, vanilla.'),
  ('Casa Dragones', 'Añejo Barrel Blend',     'tequila', 40.00, 'Jalisco, MX',     'Aged blend of French + American oak. Caramel, spice, oak.'),
  ('Casa Dragones', 'Blanco Cask-Strength',   'tequila', 46.00, 'Jalisco, MX',     'Unfiltered, cask-strength blanco. Intense cooked agave.'),
  ('Patrón',       'Silver',                 'tequila', 40.00, 'Jalisco, MX',     NULL),
  ('Patrón',       'Reposado',               'tequila', 40.00, 'Jalisco, MX',     NULL),
  ('Patrón',       'Añejo',                  'tequila', 40.00, 'Jalisco, MX',     NULL),
  ('Don Julio',    'Blanco',                 'tequila', 40.00, 'Jalisco, MX',     NULL),
  ('Don Julio',    '1942',                   'tequila', 40.00, 'Jalisco, MX',     NULL),
  ('Del Maguey',   'Vida',                   'mezcal',  42.00, 'Oaxaca, MX',      NULL),
  ('Del Maguey',   'San Luis del Río',       'mezcal',  47.00, 'Oaxaca, MX',      NULL),
  ('Del Maguey',   'Chichicapa',             'mezcal',  46.00, 'Oaxaca, MX',      NULL),
  ('Montelobos',   'Joven',                  'mezcal',  43.20, 'Oaxaca, MX',      NULL),
  ('Hendrick''s',  'Original',               'gin',     44.00, 'Scotland, UK',    NULL),
  ('Tanqueray',    'London Dry',             'gin',     43.10, 'Scotland, UK',    NULL),
  ('Monkey 47',    'Schwarzwald Dry Gin',    'gin',     47.00, 'Black Forest, DE',NULL),
  ('Buffalo Trace','Kentucky Straight',      'whiskey', 45.00, 'Kentucky, US',    NULL),
  ('Laphroaig',    '10 Year',                'whiskey', 40.00, 'Islay, UK',       NULL),
  ('Nikka',        'Coffey Grain',           'whiskey', 45.00, 'Japan',           NULL),
  ('Diplomatico',  'Reserva Exclusiva',      'rum',     40.00, 'Venezuela',       NULL),
  ('Plantation',   '3 Stars',                'rum',     41.20, 'Caribbean blend', NULL),
  ('Dolin',        'Blanc',                  'vermouth',16.00, 'Chambéry, FR',    NULL),
  ('Dolin',        'Rouge',                  'vermouth',16.00, 'Chambéry, FR',    NULL),
  ('Carpano',      'Antica Formula',         'vermouth',16.50, 'Turin, IT',       NULL),
  ('Cointreau',    'Triple Sec',             'liqueur', 40.00, 'Angers, FR',      NULL),
  ('Chartreuse',   'Green',                  'liqueur', 55.00, 'Voiron, FR',      NULL),
  ('Chartreuse',   'Yellow',                 'liqueur', 40.00, 'Voiron, FR',      NULL),
  ('Campari',      'Original',               'liqueur', 25.00, 'Milan, IT',       NULL),
  ('Aperol',       'Original',               'liqueur', 11.00, 'Padua, IT',       NULL),
  ('Luxardo',      'Maraschino',             'liqueur', 32.00, 'Torreglia, IT',   NULL)
ON CONFLICT (brand, expression) DO NOTHING;
