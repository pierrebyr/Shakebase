// Seed 4 more Casa Dragones cocktails:
//   · Michelada Dragones (Jim Meehan)
//   · Micheloma (Pablo Pasti, Limantour)
//   · Casa de Olla (Jim Meehan)
//   · Pink Panther (Chef Enrique Olvera × Jim Meehan)
//
// Idempotent: clears existing rows by slug before re-inserting.
// Creates Pablo Pasti and Enrique Olvera if missing.
//
// Run: node --env-file=.env.local _smoke/seed-casa-dragones-savory.mjs

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// ─── 1. Workspace + base product ──────────────────────────────────────
const { data: ws } = await admin
  .from('workspaces')
  .select('id, name')
  .eq('slug', 'casa-dragones')
  .maybeSingle()
if (!ws) {
  console.error('No workspace "casa-dragones"')
  process.exit(1)
}

const { data: blanco } = await admin
  .from('global_products')
  .select('id')
  .eq('brand', 'Casa Dragones')
  .eq('expression', 'Blanco')
  .maybeSingle()
if (!blanco) {
  console.error('Casa Dragones Blanco missing from global_products')
  process.exit(1)
}
const basePid = blanco.id
console.log(`→ workspace ${ws.name}`)

// ─── 2. Upsert creators ───────────────────────────────────────────────
const newCreators = [
  {
    name: 'Pablo Pasti',
    role: 'Mixologist',
    venue: 'Limantour',
    city: 'Mexico City',
    country: 'Mexico',
    bio: '#32 World\'s 50 Best Bars. Known for creative Mexican-spirited riffs that bridge classic templates and local ingredients.',
    avatar_hue: 10,
    pronouns: 'he/him',
    specialties: ['Tequila', 'Mexican classic riffs', 'Savory cocktails'],
    languages: ['Spanish', 'English'],
  },
  {
    name: 'Enrique Olvera',
    role: 'Chef · Casamata Group',
    venue: 'Pujol · Cosme · Atla · Damian · Ticuchi',
    city: 'Mexico City',
    country: 'Mexico',
    bio: 'Chef behind Pujol (#60 World\'s 50 Best Restaurants) and the Casamata Group. Collaborates on bar programs — pairing kitchen-led produce thinking with classic cocktail frames.',
    avatar_hue: 355,
    pronouns: 'he/him',
    specialties: ['Kitchen × bar collaboration', 'Mexican produce', 'Mole pairing'],
    languages: ['Spanish', 'English'],
    philosophy: 'A cocktail belongs on the table — it\'s another course.',
  },
]

const creatorIds = {}

for (const c of newCreators) {
  const { data: existing } = await admin
    .from('creators')
    .select('id')
    .eq('workspace_id', ws.id)
    .eq('name', c.name)
    .is('deleted_at', null)
    .maybeSingle()
  if (existing) {
    creatorIds[c.name] = existing.id
    console.log(`· creator ${c.name} exists`)
    continue
  }
  const { data: inserted, error } = await admin
    .from('creators')
    .insert({ workspace_id: ws.id, ...c })
    .select('id')
    .single()
  if (error) {
    console.error(`! creator insert failed for ${c.name}:`, error.message)
    process.exit(1)
  }
  creatorIds[c.name] = inserted.id
  console.log(`+ creator ${c.name}`)
}

// Jim Meehan already seeded — fetch id
const { data: jim } = await admin
  .from('creators')
  .select('id')
  .eq('workspace_id', ws.id)
  .ilike('name', 'Jim Meehan')
  .is('deleted_at', null)
  .maybeSingle()
if (jim) creatorIds['Jim Meehan'] = jim.id
else console.warn('! Jim Meehan not found — his cocktails will be unattributed')

// ─── 3. Cocktails ─────────────────────────────────────────────────────
const COCKTAILS = [
  {
    slug: 'michelada-dragones',
    name: 'Michelada Dragones',
    status: 'published',
    category: 'Michelada',
    spirit_base: 'Tequila',
    glass_type: 'Pilsner',
    garnish: 'Jalapeño slice, salt rim',
    tasting_notes:
      'Jim Meehan turns the classic Michelada into an agave-forward savory drink — green tomato, jalapeño and dry vermouth layer into Casa Dragones Blanco before a Mexican lager top. Bold, farm-driven, long.',
    flavor_profile: ['Savory', 'Spicy', 'Vegetal', 'Long'],
    orb_from: '#e8766c',
    orb_to: '#a83525',
    creator: 'Jim Meehan',
    featured: false,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '1¼ oz', amount: 37, unit: 'ml' },
      { name: 'Dry vermouth', amount_text: '¼ oz', amount: 7, unit: 'ml' },
      { name: 'Lime juice', amount_text: '¼ oz', amount: 7, unit: 'ml' },
      { name: 'Green tomato juice', amount_text: '¼ oz', amount: 7, unit: 'ml' },
      { name: 'Agave syrup', amount_text: '¼ oz', amount: 7, unit: 'ml' },
      { name: 'Seeded jalapeño slices', amount_text: '¼ oz', amount: 7, unit: 'ml' },
      { name: 'Mexican lager', amount_text: 'top', amount: null, unit: null },
    ],
    method: [
      'Muddle the jalapeño slices in a shaker tin.',
      'Add all other ingredients except the lager.',
      'Shake gently with ice just to combine.',
      'Fine-strain into a salt-rimmed pilsner glass filled with fresh ice.',
      'Top with Mexican lager, stir briefly, and garnish with a jalapeño slice.',
    ],
  },
  {
    slug: 'micheloma',
    name: 'Micheloma',
    status: 'published',
    category: 'Paloma',
    spirit_base: 'Tequila',
    glass_type: 'Highball',
    garnish: 'Pink salt & pepper rim',
    tasting_notes:
      'Pablo Pasti\'s fusion of the Paloma and the Michelada — Casa Dragones Blanco with bittersweet Cynar and grapefruit, lengthened with lager. Savory, slightly bitter, unmistakably Mexican.',
    flavor_profile: ['Bittersweet', 'Citrus', 'Savory', 'Refreshing'],
    orb_from: '#f5b8a2',
    orb_to: '#b85540',
    creator: 'Pablo Pasti',
    featured: false,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '1½ oz', amount: 45, unit: 'ml' },
      { name: 'Cynar (artichoke bittersweet liqueur)', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Grapefruit juice', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Lager beer', amount_text: '½ can', amount: null, unit: null },
      { name: 'Pink salt & pepper rim', amount_text: 'rim', amount: null, unit: null },
    ],
    method: [
      'Rim a highball glass with pink salt and cracked pepper.',
      'Combine Casa Dragones Blanco, grapefruit juice and Cynar in a shaker with ice.',
      'Shake and pour into the rimmed highball.',
      'Top with lager beer.',
    ],
  },
  {
    slug: 'casa-de-olla',
    name: 'Casa de Olla',
    status: 'published',
    category: 'Digestif',
    spirit_base: 'Tequila',
    glass_type: 'Pint',
    garnish: 'No garnish',
    tasting_notes:
      'Jim Meehan\'s riff on the Mexican carajillo — cold brew, agave and condensed milk folded around Casa Dragones Blanco and Ancho Reyes. Ground cinnamon laced through. An after-dinner shot of caffeine and warmth in one glass.',
    flavor_profile: ['Coffee', 'Spiced', 'Creamy', 'Warming'],
    orb_from: '#8b5a3c',
    orb_to: '#3a1f12',
    creator: 'Jim Meehan',
    featured: false,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Cold-brew iced coffee', amount_text: '5 oz', amount: 150, unit: 'ml' },
      { name: 'Ancho Reyes Poblano Chile Liqueur', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Agave syrup', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Sweetened condensed milk', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Ground cinnamon', amount_text: '⅛ tsp', amount: null, unit: null },
    ],
    method: [
      'Combine all ingredients in a mixing glass with ice.',
      'Stir until well chilled and integrated.',
      'Fine-strain into a chilled pint glass filled with fresh ice.',
      'Serve without garnish.',
    ],
  },
  {
    slug: 'pink-panther',
    name: 'Pink Panther',
    status: 'published',
    category: 'Paloma',
    spirit_base: 'Tequila',
    glass_type: 'Collins',
    garnish: 'Lime wheel',
    tasting_notes:
      'A Jamming Session between Chef Enrique Olvera (Pujol, Casamata Group) and Jim Meehan — a Paloma with a twist. Grapefruit and lime are lifted by a celery shrub and lengthened with Fever Tree ginger ale. Bright, floral, unexpectedly savory.',
    flavor_profile: ['Citrus', 'Floral', 'Gingery', 'Refreshing'],
    orb_from: '#f5b3c4',
    orb_to: '#c24a6a',
    creator: 'Jim Meehan',
    featured: true,
    co_creators: ['Enrique Olvera'],
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '2 oz', amount: 60, unit: 'ml' },
      { name: 'Lime juice', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Grapefruit juice', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Agave syrup', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Fever Tree ginger ale', amount_text: '1 oz', amount: 30, unit: 'ml' },
      { name: 'Orchard Street celery shrub', amount_text: '2 dashes', amount: null, unit: null },
    ],
    method: [
      'Combine Casa Dragones Blanco, lime, grapefruit, agave and celery shrub in a shaker with ice.',
      'Shake and fine-strain into a Collins glass filled with fresh ice.',
      'Top with Fever Tree ginger ale.',
      'Garnish with a lime wheel.',
    ],
  },
]

// ─── 4. Idempotent re-insert ──────────────────────────────────────────
const slugs = COCKTAILS.map((c) => c.slug)
const { data: existing } = await admin
  .from('cocktails')
  .select('id')
  .eq('workspace_id', ws.id)
  .in('slug', slugs)
if (existing && existing.length > 0) {
  const ids = existing.map((r) => r.id)
  await admin.from('cocktail_ingredients').delete().in('cocktail_id', ids)
  await admin.from('cocktails').delete().in('id', ids)
  console.log(`→ removed ${existing.length} existing for re-seed`)
}

for (const c of COCKTAILS) {
  const creatorId = creatorIds[c.creator] ?? null
  const methodSteps = c.method.map((text, i) => ({ step: i + 1, text }))

  // Co-creators go into event_origin text so it shows in the UI without
  // changing the schema. Cleaner than dropping the attribution on the floor.
  const eventOrigin = c.co_creators
    ? `Co-created with ${c.co_creators.join(' & ')}`
    : null

  const { data: inserted, error: insertErr } = await admin
    .from('cocktails')
    .insert({
      workspace_id: ws.id,
      slug: c.slug,
      name: c.name,
      status: c.status,
      category: c.category,
      spirit_base: c.spirit_base,
      base_product_id: basePid,
      glass_type: c.glass_type,
      garnish: c.garnish,
      tasting_notes: c.tasting_notes,
      flavor_profile: c.flavor_profile,
      orb_from: c.orb_from,
      orb_to: c.orb_to,
      method_steps: methodSteps,
      creator_id: creatorId,
      featured: c.featured,
      event_origin: eventOrigin,
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    console.error(`! insert failed for ${c.slug}:`, insertErr?.message)
    continue
  }

  const ingRows = c.ingredients.map((ing, idx) => ({
    cocktail_id: inserted.id,
    position: idx + 1,
    custom_name: ing.name,
    amount_text: ing.amount_text,
    amount: ing.amount,
    unit: ing.unit,
    notes: ing.notes ?? null,
  }))

  const { error: ingErr } = await admin.from('cocktail_ingredients').insert(ingRows)
  if (ingErr) {
    console.error(`! ingredient insert failed for ${c.slug}:`, ingErr.message)
    continue
  }

  console.log(`+ ${c.name} (${c.ingredients.length} ing · ${c.method.length} steps)`)
}

const { data: after } = await admin
  .from('cocktails')
  .select('slug, name')
  .eq('workspace_id', ws.id)
  .neq('status', 'archived')
  .order('name')
console.log(`\n→ workspace now has ${after?.length ?? 0} cocktails:`)
for (const c of after ?? []) console.log(`   · ${c.name}`)
