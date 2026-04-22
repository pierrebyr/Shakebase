// Seed 23 cocktails + 5 more creators into the Casa Dragones workspace.
// Idempotent: clears prior seed rows by slug before inserting.
// Run: node --env-file=.env.local _smoke/seed-library.mjs

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const { data: ws } = await admin
  .from('workspaces')
  .select('id, owner_user_id')
  .eq('slug', 'casa-dragones')
  .maybeSingle()
if (!ws) {
  console.error('No workspace "casa-dragones"')
  process.exit(1)
}

// ─── CREATORS ──────────────────────────────────────────────────────────
const CREATORS = [
  {
    key: 'c4',
    name: 'Dimitri Volkov',
    role: 'Senior Bartender',
    venue: 'The Vestry',
    city: 'London',
    country: 'UK',
    joined_year: '2020',
    bio: 'Classicist. Every build starts with a 1920s stirred template and ends somewhere surprising.',
    avatar_hue: 32,
    pronouns: 'he/him',
    languages: ['English', 'Russian'],
    signature: 'Oak-rested stirred drinks',
    philosophy: 'You earn the right to modernise a classic by first making it flawlessly for ten years.',
    specialties: ['Stirred drinks', 'Cask aging', 'Sherry program', 'Classic vermouth'],
    career: [
      { year: '2011', role: 'Bar Back', place: 'Nightjar, London' },
      { year: '2014', role: 'Junior Bartender', place: 'Dukes Bar, London' },
      { year: '2017', role: 'Head Bartender', place: 'Artesian, London' },
      { year: '2020', role: 'Senior Bartender', place: 'The Vestry', current: true },
    ],
    awards: [
      { year: 2023, title: 'Best Hotel Bar — UK', org: 'Class Bar Awards', medal: 'gold' },
      { year: 2022, title: 'Classic Cocktail Master', org: 'Spirited Awards', medal: 'silver' },
      { year: 2021, title: 'UK Bartender of the Year', org: 'Imbibe UK', medal: 'bronze' },
    ],
    certifications: [
      { name: 'WSET Spirits — Level 3', year: 2019, issuer: 'WSET' },
      { name: 'BII Personal Licence', year: 2015, issuer: 'BII' },
    ],
    competitions: [
      { year: 2023, name: 'Diageo World Class UK', placement: 'Semi-final' },
      { year: 2022, name: 'Bols Around the World', placement: 'UK Top 5' },
    ],
    press: [
      { outlet: 'Financial Times', title: 'The Quiet Revival of the Martinez', year: 2023 },
      { outlet: "Difford's Guide", title: 'A Vestry Education', year: 2022 },
    ],
    socials: { instagram: '@volkov.stirs', linkedin: 'dimitri-volkov' },
    mentors: ['Alex Kratena', 'Salvatore Calabrese'],
  },
  {
    key: 'c5',
    name: 'Noa Cassar',
    role: 'Beverage Director',
    venue: 'Levanta',
    city: 'Tel Aviv',
    country: 'Israel',
    joined_year: '2018',
    bio: "Mediterranean pantry — labneh washes, za'atar cordials, sumac salt rims.",
    avatar_hue: 340,
    pronouns: 'she/her',
    languages: ['Hebrew', 'English', 'Arabic'],
    signature: "Labneh and za'atar builds",
    philosophy: 'My pantry is a market. Everything starts with what arrived fresh this morning.',
    specialties: ['Dairy washing', 'Mediterranean herbs', 'Salt & acid', 'Menu development'],
    career: [
      { year: '2012', role: 'Bar Back', place: 'Imperial Craft, Tel Aviv' },
      { year: '2015', role: 'Bartender', place: 'Spicehaus, Tel Aviv' },
      { year: '2018', role: 'Beverage Director', place: 'Levanta', current: true },
    ],
    awards: [
      { year: 2025, title: 'Middle East Bar Program of the Year', org: '50 Best Bars MENA', medal: 'gold' },
      { year: 2024, title: 'Best Regional Menu', org: 'Tel Aviv Food Awards', medal: 'silver' },
      { year: 2022, title: 'Rising Bar Leader', org: 'Star Chefs', medal: 'bronze' },
    ],
    certifications: [{ name: 'WSET Spirits — Level 2', year: 2019, issuer: 'WSET' }],
    competitions: [{ year: 2024, name: 'Campari Bartender Competition', placement: 'MENA Finalist' }],
    press: [
      { outlet: 'GQ', title: 'The Flavour of Tel Aviv Nightlife', year: 2024 },
      { outlet: 'Saveur', title: "Za'atar in a Glass", year: 2023 },
    ],
    socials: { instagram: '@noa.cassar', linkedin: 'noa-cassar', website: 'levanta.co.il' },
    mentors: ['Lior Lev Sercarz'],
  },
  {
    key: 'c6',
    name: 'Theo Mensah',
    role: 'Consulting Bartender',
    venue: 'Freelance',
    city: 'Accra',
    country: 'Ghana',
    joined_year: '2023',
    bio: 'West African produce program. Hibiscus, baobab, palm, fonio orgeat.',
    avatar_hue: 28,
    pronouns: 'he/him',
    languages: ['English', 'Twi', 'French'],
    signature: 'West African pantry translations',
    philosophy: "The pantry I grew up with was never on a cocktail menu. That's the only reason I needed to put it there.",
    specialties: ['Hibiscus (sobolo)', 'Baobab', 'Fonio orgeat', 'Menu consulting'],
    career: [
      { year: '2016', role: 'Bartender', place: 'Republic Bar, Accra' },
      { year: '2019', role: 'Head Bartender', place: 'Skybar 25, Accra' },
      { year: '2023', role: 'Consulting Bartender', place: 'Freelance', current: true },
    ],
    awards: [
      { year: 2025, title: 'Tales Visiting Industry Expert', org: 'Tales of the Cocktail', medal: 'silver' },
      { year: 2024, title: 'Best Cocktail Consultant — Africa', org: 'Africa Bar Awards', medal: 'gold' },
    ],
    certifications: [{ name: 'BarSmarts Advanced', year: 2021, issuer: 'BarSmarts' }],
    competitions: [{ year: 2024, name: 'World Class Africa', placement: 'Africa Champion' }],
    press: [
      { outlet: 'Travel + Leisure', title: "Accra's Cocktail Reinvention", year: 2024 },
      { outlet: 'Imbibe', title: 'The Case for Fonio', year: 2023 },
    ],
    socials: { instagram: '@theomensah', linkedin: 'theo-mensah', website: 'theomensah.co' },
    mentors: ['Selassie Atadika', 'Kwame Onwuachi'],
  },
  {
    key: 'c7',
    name: 'Clémence Aubry',
    role: 'Pastry x Bar',
    venue: 'Petite Perle',
    city: 'Paris',
    country: 'France',
    joined_year: '2022',
    bio: 'Approaches every cocktail as a dessert course. Textures first.',
    avatar_hue: 320,
    pronouns: 'she/her',
    languages: ['French', 'English'],
    signature: 'Texture-led dessert cocktails',
    philosophy: 'Flavour is almost finished work. Texture is the whole meal.',
    specialties: ['Espumas & foams', 'Pastry infusions', 'Brûlée & char', 'Plating'],
    career: [
      { year: '2013', role: 'Commis Pâtissier', place: 'Ladurée, Paris' },
      { year: '2017', role: 'Chef de Partie', place: 'Septime, Paris' },
      { year: '2020', role: 'Pastry Chef', place: 'Le Clarence, Paris' },
      { year: '2022', role: 'Pastry x Bar Lead', place: 'Petite Perle', current: true },
    ],
    awards: [
      { year: 2024, title: 'Best Dessert Pairing — France', org: 'Gault & Millau', medal: 'gold' },
      { year: 2023, title: 'Pastry Innovator of the Year', org: 'Omnivore', medal: 'silver' },
    ],
    certifications: [
      { name: 'CAP Pâtissier', year: 2013, issuer: 'Éducation Nationale' },
      { name: 'Bac Pro Cuisine', year: 2015, issuer: 'Éducation Nationale' },
    ],
    competitions: [{ year: 2023, name: 'Coupe de France des Barmen', placement: 'Finalist' }],
    press: [
      { outlet: 'Le Figaro', title: 'Quand la pâtisserie descend au bar', year: 2024 },
      { outlet: 'Le Monde', title: 'La mixologie des textures', year: 2023 },
    ],
    socials: { instagram: '@clem.aubry', linkedin: 'clemence-aubry' },
    mentors: ['Cédric Grolet', 'Pierre Hermé'],
  },
  {
    key: 'c8',
    name: 'Rafael Quiroga',
    role: 'Guest Creator',
    venue: 'Botica',
    city: 'Mexico City',
    country: 'Mexico',
    joined_year: '2024',
    bio: 'Agave obsessive. Wild yeast, ancestral mezcals, and desert botanicals.',
    avatar_hue: 80,
    pronouns: 'he/him',
    languages: ['Spanish', 'English', 'Mixtec'],
    signature: 'Terroir-driven agave service',
    philosophy: "The palenque is the bar. Everything I do is a translation of someone else's fire.",
    specialties: ['Agave terroir', 'Wild fermentation', 'Flight service', 'Sourcing ethics'],
    career: [
      { year: '2012', role: 'Sourcing Apprentice', place: 'Palenque Real Minero, Oaxaca' },
      { year: '2016', role: 'Bar Lead', place: 'Licorería Limantour, CDMX' },
      { year: '2020', role: 'Sourcing Director', place: 'Pujol, CDMX' },
      { year: '2024', role: 'Guest Creator', place: 'Botica', current: true },
    ],
    awards: [
      { year: 2025, title: 'Best Agave Program — Americas', org: '50 Best Bars', medal: 'gold' },
      { year: 2024, title: 'Sustainability Award', org: 'Spirited Awards', medal: 'silver' },
      { year: 2023, title: 'Agave Spirit Advocate of the Year', org: 'Mezcalistas', medal: 'gold' },
    ],
    certifications: [
      { name: 'Mezcal Educator', year: 2019, issuer: 'CRM' },
      { name: 'Agave Spirits Sommelier', year: 2021, issuer: 'ASS' },
    ],
    competitions: [],
    press: [
      { outlet: 'Punch', title: 'The Ethics of Ancestral Mezcal', year: 2024 },
      { outlet: 'Food & Wine', title: '10 Bartenders Shaping Agave', year: 2024 },
      { outlet: 'The Guardian', title: "Mezcal's Next Chapter", year: 2023 },
    ],
    socials: { instagram: '@rquiroga.agave', linkedin: 'rafael-quiroga', website: 'boticamx.com' },
    mentors: ['Graciela Ángeles Carreño'],
  },
]

const keyToId = new Map() // key (c1-c8) → creator uuid

async function upsertCreator(c) {
  const { key, ...data } = c
  const { data: existing } = await admin
    .from('creators')
    .select('id')
    .eq('workspace_id', ws.id)
    .eq('name', c.name)
    .maybeSingle()
  if (existing) {
    await admin.from('creators').update(data).eq('id', existing.id)
    keyToId.set(key, existing.id)
    console.log(`  ✓ updated ${c.name}`)
  } else {
    const { data: inserted } = await admin
      .from('creators')
      .insert({ workspace_id: ws.id, ...data })
      .select('id')
      .single()
    keyToId.set(key, inserted.id)
    console.log(`  ✓ inserted ${c.name}`)
  }
}

console.log('→ seeding creators')
for (const c of CREATORS) await upsertCreator(c)

// Also map the existing c1, c2, c3 so cocktails can link to them
for (const name of ['Mirela Sato', 'Halsey Brenner', 'Yui Tachibana']) {
  const { data } = await admin
    .from('creators')
    .select('id')
    .eq('workspace_id', ws.id)
    .eq('name', name)
    .maybeSingle()
  if (data) {
    const map = { 'Mirela Sato': 'c1', 'Halsey Brenner': 'c2', 'Yui Tachibana': 'c3' }
    keyToId.set(map[name], data.id)
  }
}

// ─── COCKTAILS ─────────────────────────────────────────────────────────
const COCKTAILS = [
  {
    slug: 'clarified-paloma',
    name: 'Clarified Paloma',
    creator: 'c2',
    venue: 'ShakeBase Lab',
    category: 'Highball',
    spirit: 'Tequila',
    glass: 'Collins',
    garnish: 'Dehydrated grapefruit wheel, pink salt rim',
    gradient: ['#ffd9c2', '#f58a6e'],
    flavor: ['Citrus', 'Saline', 'Crisp'],
    notes: 'Milk-clarified grapefruit for silk texture without opacity. Reads like still water until you drink it.',
    ingredients: [
      { name: 'Blanco tequila', amount: '50 ml' },
      { name: 'Clarified grapefruit', amount: '40 ml' },
      { name: 'Lime', amount: '15 ml' },
      { name: 'Agave syrup (1:1)', amount: '10 ml' },
      { name: 'Saline solution', amount: '3 dashes' },
      { name: 'Soda', amount: 'Top' },
    ],
    method: [
      'Build tequila, clarified grapefruit, lime, agave, and saline in a chilled Collins over one block.',
      'Top with soda, two gentle stirs only.',
      'Express grapefruit oil, discard peel, place dehydrated wheel.',
    ],
    season: ['Summer'],
    occasions: ['Brunch', 'Everyday'],
    featured: true,
    menu_price_cents: 1700,
    cost_cents: 380,
  },
  {
    slug: 'shio-highball',
    name: 'Shio Highball',
    creator: 'c3',
    venue: 'Kogane',
    category: 'Highball',
    spirit: 'Whisky',
    glass: 'Highball',
    garnish: 'Shiso leaf, lemon disc',
    gradient: ['#f4efe0', '#d9c98a'],
    flavor: ['Umami', 'Citrus', 'Mineral'],
    notes: 'Japanese whisky, shio-koji cordial, sudachi. Tall, dry, almost savory. Finishes with rice paper sweetness.',
    ingredients: [
      { name: 'Japanese whisky', amount: '45 ml' },
      { name: 'Shio-koji cordial', amount: '15 ml' },
      { name: 'Sudachi juice', amount: '10 ml' },
      { name: 'Soda (Premium)', amount: '90 ml' },
    ],
    method: [
      'Chill highball glass with a single clear ice spear.',
      'Pour whisky, koji cordial, sudachi. Stir once.',
      'Add soda down the spear. Garnish.',
    ],
    season: ['All year'],
    occasions: ['Pre-dinner', 'Everyday'],
    featured: true,
    menu_price_cents: 1900,
    cost_cents: 410,
  },
  {
    slug: 'verde-martini',
    name: 'Verde Martini',
    creator: 'c1',
    venue: 'Aurelia Bar',
    category: 'Stirred',
    spirit: 'Gin',
    glass: 'Nick & Nora',
    garnish: 'Olive leaf',
    gradient: ['#e8f2dc', '#9bbf84'],
    flavor: ['Herbal', 'Saline', 'Dry'],
    notes: 'Olive-leaf-washed gin, fino sherry, drop of olive brine. Cleaner than a dirty martini, greener than a dry one.',
    ingredients: [
      { name: 'Olive leaf gin', amount: '60 ml' },
      { name: 'Fino sherry', amount: '15 ml' },
      { name: 'Dry vermouth', amount: '10 ml' },
      { name: 'Olive brine', amount: '2 dashes' },
    ],
    method: [
      'Stir all ingredients over ice for 22 seconds.',
      'Strain into a chilled Nick & Nora.',
      'Garnish with a single fresh olive leaf.',
    ],
    season: ['Spring'],
    occasions: ['Apéritif', 'Tasting menu'],
    menu_price_cents: 1800,
    cost_cents: 340,
  },
  {
    slug: 'hibiscus-sour',
    name: 'Hibiscus Sour',
    creator: 'c6',
    venue: 'Freelance',
    category: 'Sour',
    spirit: 'Rum',
    glass: 'Coupe',
    garnish: 'Dried hibiscus, cacao dust',
    gradient: ['#ffb3b3', '#c2185b'],
    flavor: ['Floral', 'Tart', 'Rich'],
    notes: 'Sobolo (hibiscus) reduction, aged rum, lime, egg white. West African pantry meeting the classic sour template.',
    ingredients: [
      { name: 'Aged rum', amount: '45 ml' },
      { name: 'Sobolo reduction', amount: '20 ml' },
      { name: 'Lime', amount: '20 ml' },
      { name: 'Cane syrup', amount: '10 ml' },
      { name: 'Egg white', amount: '1 × 15 ml' },
    ],
    method: [
      'Dry shake all ingredients for 10 seconds.',
      'Add ice, shake hard for 12 seconds.',
      'Double strain into chilled coupe. Garnish.',
    ],
    season: ['Summer'],
    occasions: ["Valentine's Day", 'Date night'],
    event_origin: 'Tales of the Cocktail 2025',
    featured: true,
    menu_price_cents: 1600,
    cost_cents: 320,
  },
  {
    slug: 'labneh-old-fashioned',
    name: 'Labneh Old Fashioned',
    creator: 'c5',
    venue: 'Levanta',
    category: 'Stirred',
    spirit: 'Whisky',
    glass: 'Rocks',
    garnish: "Burnt orange, za'atar dust",
    gradient: ['#f3e4cc', '#a87749'],
    flavor: ['Rich', 'Savory', 'Warm'],
    notes: 'Labneh-washed bourbon stripped of solids. Creamy mouthfeel, zero opacity. Date syrup replaces sugar.',
    ingredients: [
      { name: 'Labneh-washed bourbon', amount: '60 ml' },
      { name: 'Date syrup', amount: '7 ml' },
      { name: 'Angostura', amount: '3 dashes' },
      { name: 'Orange bitters', amount: '1 dash' },
    ],
    method: [
      'Stir over ice for 25 seconds.',
      'Strain onto single large rock.',
      "Express burnt orange oil, dust with za'atar.",
    ],
    season: ['Winter'],
    occasions: ['Fireside', 'Nightcap'],
    menu_price_cents: 2200,
    cost_cents: 450,
  },
  {
    slug: 'sansho-gimlet',
    name: 'Sansho Gimlet',
    creator: 'c3',
    venue: 'Kogane',
    category: 'Shaken',
    spirit: 'Gin',
    glass: 'Coupe',
    garnish: 'Sansho pepper, lime zest',
    gradient: ['#dff0e0', '#6db38a'],
    flavor: ['Peppery', 'Citrus', 'Bright'],
    notes: 'Sansho-infused gin, lime cordial cut with rice vinegar for a cleaner pucker.',
    ingredients: [
      { name: 'Sansho gin', amount: '55 ml' },
      { name: 'Lime cordial', amount: '20 ml' },
      { name: 'Rice vinegar', amount: '3 ml' },
    ],
    method: [
      'Shake hard for 8 seconds over dense ice.',
      'Fine strain into a frozen coupe.',
      'Grate sansho over the surface.',
    ],
    season: ['Spring'],
    occasions: ['Everyday'],
    menu_price_cents: 1700,
    cost_cents: 360,
  },
  {
    slug: 'fonio-horchata',
    name: 'Fonio Horchata',
    creator: 'c6',
    venue: 'Freelance',
    category: 'Built',
    spirit: 'Rum',
    glass: 'Rocks',
    garnish: 'Toasted fonio, cinnamon',
    gradient: ['#f7ecd5', '#d4a574'],
    flavor: ['Nutty', 'Creamy', 'Spiced'],
    notes: 'Fonio grain orgeat, aged rum, cold brew of roasted cacao shell. Horchata with a West African accent.',
    ingredients: [
      { name: 'Aged rum', amount: '40 ml' },
      { name: 'Fonio orgeat', amount: '25 ml' },
      { name: 'Cacao shell cold brew', amount: '30 ml' },
      { name: 'Oat milk', amount: '15 ml' },
    ],
    method: [
      'Build in a rocks glass over pebble ice.',
      'Swizzle until frost forms.',
      'Top with toasted fonio and cinnamon.',
    ],
    season: ['Winter'],
    occasions: ['Brunch', 'Holiday'],
    event_origin: 'Accra Food & Drink Fest',
    menu_price_cents: 1800,
    cost_cents: 390,
  },
  {
    slug: 'vestry-martinez',
    name: 'Vestry Martinez',
    creator: 'c4',
    venue: 'The Vestry',
    category: 'Stirred',
    spirit: 'Gin',
    glass: 'Nick & Nora',
    garnish: 'Lemon twist',
    gradient: ['#fde3b4', '#c8813e'],
    flavor: ['Rich', 'Botanical', 'Bitter'],
    notes: 'House ratio Martinez — Old Tom forward, Maraschino restrained. Cask-aged one week in oloroso.',
    ingredients: [
      { name: 'Old Tom gin', amount: '40 ml' },
      { name: 'Sweet vermouth', amount: '30 ml' },
      { name: 'Maraschino', amount: '5 ml' },
      { name: 'Orange bitters', amount: '2 dashes' },
    ],
    method: [
      'Stir cold for 30 seconds.',
      'Strain into chilled Nick & Nora.',
      'Lemon twist, express and drop.',
    ],
    season: ['Autumn'],
    occasions: ['Pre-dinner'],
    menu_price_cents: 2000,
    cost_cents: 420,
  },
  {
    slug: 'petite-tarte',
    name: 'Petite Tarte',
    creator: 'c7',
    venue: 'Petite Perle',
    category: 'Shaken',
    spirit: 'Brandy',
    glass: 'Coupe',
    garnish: 'Brûléed lemon disc',
    gradient: ['#fff3c9', '#e6b93a'],
    flavor: ['Bright', 'Buttery', 'Sweet-tart'],
    notes: 'Lemon tart in a glass. Brown-butter-washed cognac, lemon curd reduction, meringue foam on top.',
    ingredients: [
      { name: 'Brown butter cognac', amount: '45 ml' },
      { name: 'Lemon curd reduction', amount: '20 ml' },
      { name: 'Lemon juice', amount: '15 ml' },
      { name: 'Meringue foam', amount: 'Top' },
    ],
    method: [
      'Shake cognac, curd, lemon over ice.',
      'Fine strain into a frozen coupe.',
      'Spoon meringue foam; brûlée with torch.',
    ],
    season: ['Spring'],
    occasions: ["Valentine's Day", 'Dessert'],
    menu_price_cents: 2100,
    cost_cents: 480,
  },
  {
    slug: 'fig-leaf-negroni',
    name: 'Fig Leaf Negroni',
    creator: 'c1',
    venue: 'Aurelia Bar',
    category: 'Stirred',
    spirit: 'Gin',
    glass: 'Rocks',
    garnish: 'Fig leaf',
    gradient: ['#f7c2a8', '#b8442a'],
    flavor: ['Bitter', 'Herbal', 'Rich'],
    notes: 'Equal parts, fig-leaf-infused gin. The leaf contributes coconut/green hay notes that soften Campari.',
    ingredients: [
      { name: 'Fig leaf gin', amount: '30 ml' },
      { name: 'Campari', amount: '30 ml' },
      { name: 'Sweet vermouth', amount: '30 ml' },
    ],
    method: [
      'Stir over ice until very cold.',
      'Strain over a single large rock.',
      'Slap fig leaf, garnish.',
    ],
    season: ['Autumn'],
    occasions: ['Apéritif', 'Everyday'],
    menu_price_cents: 1900,
    cost_cents: 400,
  },
  {
    slug: 'ancestral-oaxacan',
    name: 'Ancestral Oaxacan',
    creator: 'c8',
    venue: 'Botica',
    category: 'Stirred',
    spirit: 'Mezcal',
    glass: 'Rocks',
    garnish: 'Worm salt rim',
    gradient: ['#efe3d2', '#7d8a67'],
    flavor: ['Smoky', 'Earthy', 'Herbal'],
    notes: 'Ancestral mezcal, carrot-top oleo, yellow Chartreuse. Built for sipping, not social.',
    ingredients: [
      { name: 'Ancestral mezcal', amount: '45 ml' },
      { name: 'Yellow Chartreuse', amount: '15 ml' },
      { name: 'Carrot-top oleo', amount: '10 ml' },
      { name: 'Saline', amount: '2 drops' },
    ],
    method: [
      "Stir gently (don't bruise the mezcal).",
      'Strain over half-rim of worm salt.',
      'No garnish beyond the rim.',
    ],
    season: ['All year'],
    occasions: ['Tasting menu', 'Nightcap'],
    featured: true,
    menu_price_cents: 2400,
    cost_cents: 540,
  },
  {
    slug: 'cold-brew-espresso',
    name: 'Cold Brew Espresso',
    creator: 'c2',
    venue: 'ShakeBase Lab',
    category: 'Shaken',
    spirit: 'Vodka',
    glass: 'Coupe',
    garnish: 'Three coffee beans',
    gradient: ['#d8c5ab', '#3d2a1e'],
    flavor: ['Roasted', 'Rich', 'Bitter'],
    notes: 'Our R&D take: 24hr cold brew concentrate replaces espresso. Less acidity, deeper chocolate.',
    ingredients: [
      { name: 'Vodka', amount: '45 ml' },
      { name: 'Coffee liqueur', amount: '15 ml' },
      { name: 'Cold brew concentrate', amount: '30 ml' },
      { name: 'Demerara syrup', amount: '5 ml' },
    ],
    method: [
      'Shake hard with dense ice for a full 12 seconds.',
      'Double strain into a frozen coupe.',
      'Float three beans.',
    ],
    season: ['All year'],
    occasions: ['After dinner', 'Nightcap'],
    menu_price_cents: 1600,
    cost_cents: 330,
  },
  {
    slug: 'sumac-daiquiri',
    name: 'Sumac Daiquiri',
    creator: 'c5',
    venue: 'Levanta',
    category: 'Shaken',
    spirit: 'Rum',
    glass: 'Coupe',
    garnish: 'Sumac dusted half-rim',
    gradient: ['#fcd0c0', '#c2533f'],
    flavor: ['Tart', 'Tannic', 'Bright'],
    notes: 'White rum, lime, sumac-infused demerara. The sumac doubles down on sourness in a totally different register.',
    ingredients: [
      { name: 'White rum', amount: '60 ml' },
      { name: 'Lime', amount: '25 ml' },
      { name: 'Sumac demerara', amount: '15 ml' },
    ],
    method: [
      'Shake hard over pellet ice for 7 seconds.',
      'Fine strain into a frozen coupe.',
      'Sumac half-rim.',
    ],
    season: ['Summer'],
    occasions: ['Everyday', 'Beach'],
    menu_price_cents: 1500,
    cost_cents: 310,
  },
  {
    slug: 'koji-highball-2',
    name: 'Koji Highball №2',
    creator: 'c3',
    venue: 'Kogane',
    category: 'Highball',
    spirit: 'Shochu',
    glass: 'Highball',
    garnish: 'Yuzu peel',
    gradient: ['#eaf3ff', '#8fb8e0'],
    flavor: ['Light', 'Saline', 'Bright'],
    notes: 'Low-ABV session highball. Barley shochu, koji-fermented grapefruit, yuzu soda.',
    ingredients: [
      { name: 'Barley shochu', amount: '40 ml' },
      { name: 'Koji grapefruit cordial', amount: '15 ml' },
      { name: 'Yuzu soda', amount: '100 ml' },
    ],
    method: ['Build over spear ice.', 'Stir once.', 'Express yuzu peel.'],
    season: ['Summer'],
    occasions: ['Everyday', 'Lunch'],
    menu_price_cents: 1400,
    cost_cents: 290,
  },
  {
    slug: 'vestry-sazerac',
    name: 'Vestry Sazerac',
    creator: 'c4',
    venue: 'The Vestry',
    category: 'Stirred',
    spirit: 'Rye',
    glass: 'Rocks',
    garnish: 'Lemon peel, absinthe rinse',
    gradient: ['#f2dfb4', '#a76b2e'],
    flavor: ['Bold', 'Anise', 'Warm'],
    notes: 'Our house Sazerac with a house absinthe blend: 3 herbs, one week maceration.',
    ingredients: [
      { name: 'Rye whiskey', amount: '60 ml' },
      { name: 'Demerara', amount: '5 ml' },
      { name: "Peychaud's", amount: '4 dashes' },
      { name: 'House absinthe', amount: 'Rinse' },
    ],
    method: [
      'Rinse chilled glass with absinthe, discard.',
      'Stir remaining ingredients cold.',
      'Strain into the rinsed glass. Lemon peel.',
    ],
    season: ['Winter'],
    occasions: ['Nightcap', 'Holiday'],
    menu_price_cents: 2200,
    cost_cents: 460,
  },
  {
    slug: 'whipped-pina',
    name: 'Whipped Piña',
    creator: 'c7',
    venue: 'Petite Perle',
    category: 'Blended',
    spirit: 'Rum',
    glass: 'Tiki mug',
    garnish: 'Toasted coconut, pineapple frond',
    gradient: ['#fff5d8', '#f0c24b'],
    flavor: ['Tropical', 'Creamy', 'Sweet'],
    notes: 'Espuma rum-pineapple foam on top of clarified pineapple. Textural piña colada.',
    ingredients: [
      { name: 'Aged rum', amount: '45 ml' },
      { name: 'Clarified pineapple', amount: '40 ml' },
      { name: 'Coconut cream', amount: '20 ml' },
      { name: 'Lime', amount: '10 ml' },
    ],
    method: [
      'Shake base with crushed ice.',
      'Pour into tiki mug.',
      'Top with pineapple espuma, toast coconut on top.',
    ],
    season: ['Summer'],
    occasions: ['Beach', 'Party'],
    event_origin: 'Monaco Launch Event 2024',
    menu_price_cents: 1700,
    cost_cents: 370,
  },
  {
    slug: 'fermented-pear',
    name: 'Fermented Pear',
    creator: 'c2',
    venue: 'ShakeBase Lab',
    category: 'Shaken',
    spirit: 'Brandy',
    glass: 'Coupe',
    garnish: 'Dehydrated pear chip',
    gradient: ['#f4efd8', '#b6c47a'],
    flavor: ['Funky', 'Fruity', 'Dry'],
    notes: 'Wild-fermented pear kombucha, pear eau de vie, white port. 3-week mother, finished carbonated.',
    ingredients: [
      { name: 'Pear eau de vie', amount: '35 ml' },
      { name: 'Pear kombucha', amount: '45 ml' },
      { name: 'White port', amount: '15 ml' },
      { name: 'Citric solution', amount: '2 drops' },
    ],
    method: [
      'Stir (do not shake — kombucha is carbonated).',
      'Strain into coupe.',
      'Garnish with pear chip.',
    ],
    season: ['Autumn'],
    occasions: ['Tasting menu'],
    menu_price_cents: 2000,
    cost_cents: 490,
  },
  {
    slug: 'baobab-collins',
    name: 'Baobab Collins',
    creator: 'c6',
    venue: 'Freelance',
    category: 'Collins',
    spirit: 'Gin',
    glass: 'Collins',
    garnish: 'Baobab fruit',
    gradient: ['#fff2d8', '#e3a14b'],
    flavor: ['Tart', 'Tropical', 'Bright'],
    notes: "Baobab powder gives vitamin-C tang and silkiness that lime alone can't match. Session long-drink.",
    ingredients: [
      { name: 'London dry gin', amount: '40 ml' },
      { name: 'Baobab cordial', amount: '20 ml' },
      { name: 'Lime', amount: '15 ml' },
      { name: 'Soda', amount: '80 ml' },
    ],
    method: [
      'Build in a Collins over a single spear.',
      'Top with soda.',
      'Baobab fruit garnish.',
    ],
    season: ['Summer'],
    occasions: ['Everyday', 'Brunch'],
    event_origin: 'Afro Nation Bar Program 2025',
    menu_price_cents: 1500,
    cost_cents: 300,
  },
  {
    slug: 'oloroso-manhattan',
    name: 'Oloroso Manhattan',
    creator: 'c4',
    venue: 'The Vestry',
    category: 'Stirred',
    spirit: 'Rye',
    glass: 'Nick & Nora',
    garnish: 'Luxardo cherry',
    gradient: ['#f4c59c', '#8c4220'],
    flavor: ['Rich', 'Nutty', 'Warm'],
    notes: 'Split-base vermouth with oloroso sherry. Walnut, dried fig, warm spice.',
    ingredients: [
      { name: 'Rye', amount: '60 ml' },
      { name: 'Sweet vermouth', amount: '15 ml' },
      { name: 'Oloroso sherry', amount: '15 ml' },
      { name: 'Angostura', amount: '2 dashes' },
    ],
    method: ['Stir cold for 30 seconds.', 'Strain into chilled Nick & Nora.', 'Cherry.'],
    season: ['Winter'],
    occasions: ['Nightcap', 'Holiday'],
    menu_price_cents: 2200,
    cost_cents: 470,
  },
  {
    slug: 'tomato-leaf-gin',
    name: 'Tomato Leaf Gin',
    creator: 'c1',
    venue: 'Aurelia Bar',
    category: 'Shaken',
    spirit: 'Gin',
    glass: 'Rocks',
    garnish: 'Cherry tomato',
    gradient: ['#e9f0d5', '#7da86a'],
    flavor: ['Vegetal', 'Savory', 'Bright'],
    notes: 'Tomato-leaf-tincture gin, yellow tomato water, basil oil drop. Garden on a summer morning.',
    ingredients: [
      { name: 'Tomato leaf gin', amount: '45 ml' },
      { name: 'Yellow tomato water', amount: '30 ml' },
      { name: 'Lemon', amount: '10 ml' },
      { name: 'Basil oil', amount: '1 drop' },
    ],
    method: [
      "Shake lightly — don't bruise.",
      'Strain over one rock.',
      'Basil oil drop on top.',
    ],
    season: ['Summer'],
    occasions: ['Apéritif', 'Garden party'],
    menu_price_cents: 1600,
    cost_cents: 350,
  },
  {
    slug: 'amaro-spritz',
    name: 'Amaro Spritz',
    creator: 'c5',
    venue: 'Levanta',
    category: 'Spritz',
    spirit: 'Amaro',
    glass: 'Wine glass',
    garnish: 'Rosemary sprig, olive',
    gradient: ['#ffe1c9', '#e37242'],
    flavor: ['Bitter', 'Herbal', 'Light'],
    notes: 'Lower-bitter spritz — split amaro base with bianco vermouth. Mediterranean aperitivo profile.',
    ingredients: [
      { name: 'Amaro', amount: '40 ml' },
      { name: 'Bianco vermouth', amount: '30 ml' },
      { name: 'Prosecco', amount: '60 ml' },
      { name: 'Soda', amount: '30 ml' },
    ],
    method: [
      'Build over cubed ice.',
      'Stir gently twice.',
      'Garnish with rosemary and olive.',
    ],
    season: ['Summer'],
    occasions: ['Apéritif', 'Everyday'],
    menu_price_cents: 1300,
    cost_cents: 260,
  },
  {
    slug: 'rose-cardamom',
    name: 'Rose & Cardamom',
    creator: 'c7',
    venue: 'Petite Perle',
    category: 'Shaken',
    spirit: 'Gin',
    glass: 'Coupe',
    garnish: 'Cardamom pod, rose petal',
    gradient: ['#ffd9e0', '#c96f8c'],
    flavor: ['Floral', 'Spiced', 'Silky'],
    notes: 'Rose-petal-infused gin, green cardamom cordial, lychee. Perfume the glass, never the drink.',
    ingredients: [
      { name: 'Rose gin', amount: '45 ml' },
      { name: 'Cardamom cordial', amount: '15 ml' },
      { name: 'Lychee', amount: '15 ml' },
      { name: 'Lemon', amount: '10 ml' },
    ],
    method: [
      'Shake over ice for 6 seconds only.',
      'Fine strain into a misted coupe.',
      'Rose petal floated.',
    ],
    season: ['Spring'],
    occasions: ["Valentine's Day", 'Date night'],
    menu_price_cents: 1800,
    cost_cents: 380,
  },
  {
    slug: 'charred-pineapple-mezcal',
    name: 'Charred Pineapple Mezcal',
    creator: 'c8',
    venue: 'Botica',
    category: 'Shaken',
    spirit: 'Mezcal',
    glass: 'Rocks',
    garnish: 'Charred pineapple wedge',
    gradient: ['#ffe8a8', '#c47a33'],
    flavor: ['Smoky', 'Sweet', 'Charred'],
    notes: 'Pineapple blackened on the plancha, juiced while warm, matched to espadín mezcal. Lime & agave clean it up.',
    ingredients: [
      { name: 'Espadín mezcal', amount: '50 ml' },
      { name: 'Charred pineapple juice', amount: '25 ml' },
      { name: 'Lime', amount: '15 ml' },
      { name: 'Agave', amount: '10 ml' },
    ],
    method: [
      'Shake with one large cube.',
      'Strain onto rocks.',
      'Garnish with charred wedge.',
    ],
    season: ['Autumn'],
    occasions: ['Party'],
    event_origin: 'Casa Dragones Summit 2026',
    menu_price_cents: 1900,
    cost_cents: 390,
  },
  {
    slug: 'milk-punch-7',
    name: 'Milk Punch №7',
    creator: 'c2',
    venue: 'ShakeBase Lab',
    category: 'Clarified',
    spirit: 'Blend',
    glass: 'Nick & Nora',
    garnish: 'Nutmeg',
    gradient: ['#f6efe2', '#c9b89a'],
    flavor: ['Silky', 'Spiced', 'Complex'],
    notes: 'Seventh iteration of the house milk punch. Rum, cognac, black tea, citrus, whole milk. 18-hour clarification.',
    ingredients: [
      { name: 'Aged rum', amount: '30 ml' },
      { name: 'Cognac', amount: '30 ml' },
      { name: 'Black tea', amount: '20 ml' },
      { name: 'Clarified citrus', amount: '20 ml' },
      { name: 'Whole milk', amount: '25 ml' },
    ],
    method: [
      'Curdle with acid mixture; rest 8 hours.',
      'Filter twice through paper.',
      'Bottle; serve 30 ml measures straight.',
    ],
    season: ['Winter'],
    occasions: ['Holiday', 'Nightcap'],
    featured: true,
    menu_price_cents: 2300,
    cost_cents: 510,
  },
]

console.log(`→ seeding ${COCKTAILS.length} cocktails`)

// Find grapefruit juice global ingredient if present for proper linking
const { data: gi } = await admin
  .from('global_ingredients')
  .select('id, name')
const globalIngByName = new Map((gi ?? []).map((r) => [r.name.toLowerCase(), r.id]))

let seeded = 0
for (const c of COCKTAILS) {
  // Clear prior by slug so the script is re-runnable
  const { data: prior } = await admin
    .from('cocktails')
    .select('id')
    .eq('workspace_id', ws.id)
    .eq('slug', c.slug)
    .maybeSingle()
  if (prior) await admin.from('cocktails').delete().eq('id', prior.id)

  const methodSteps = c.method.map((text, i) => ({ step: i + 1, text }))

  const { data: inserted, error } = await admin
    .from('cocktails')
    .insert({
      workspace_id: ws.id,
      slug: c.slug,
      name: c.name,
      status: 'published',
      category: c.category,
      spirit_base: c.spirit,
      glass_type: c.glass,
      garnish: c.garnish,
      tasting_notes: c.notes,
      flavor_profile: c.flavor,
      season: c.season,
      occasions: c.occasions,
      event_origin: c.event_origin ?? null,
      venue: c.venue,
      orb_from: c.gradient[0],
      orb_to: c.gradient[1],
      method_steps: methodSteps,
      creator_id: keyToId.get(c.creator) ?? null,
      created_by: ws.owner_user_id,
      featured: Boolean(c.featured),
      menu_price_cents: c.menu_price_cents ?? null,
      cost_cents: c.cost_cents ?? null,
    })
    .select('id')
    .single()
  if (error) {
    console.error(`  ✗ ${c.name}: ${error.message}`)
    continue
  }

  // Ingredients — try to link to global_ingredients by name, else custom
  const ingRows = c.ingredients.map((ing, i) => {
    const lookup = globalIngByName.get(ing.name.toLowerCase())
    const amount = parseFloat(ing.amount)
    const numericAmount = Number.isFinite(amount) ? amount : null
    const unitMatch = ing.amount.match(/^\d+(?:[.,]\d+)?\s*(.*)$/)
    const unit = unitMatch ? unitMatch[1].trim() : null
    return {
      cocktail_id: inserted.id,
      position: i + 1,
      global_ingredient_id: lookup ?? null,
      custom_name: lookup ? null : ing.name,
      amount: numericAmount,
      unit: unit || null,
      amount_text: ing.amount,
    }
  })
  await admin.from('cocktail_ingredients').insert(ingRows)
  seeded++
  process.stdout.write('.')
}

console.log(`\n✅ ${seeded} cocktails seeded.`)
