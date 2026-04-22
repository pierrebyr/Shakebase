// Seed 4 Casa Dragones Blanco signature cocktails from real recipes:
//   - Ginger Margarita (Pujol team, Mexico City)
//   - Margarita Royale (Yana Volfson)
//   - Stumblebee (Jim Meehan)
//   - Margarita al Pastor (José Luis León — existing creator)
//
// Idempotent: deletes existing rows by slug before insert.
// Run: node --env-file=.env.local _smoke/seed-casa-dragones-classics.mjs

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// ─── 1. Locate workspace ───────────────────────────────────────────────
const { data: ws } = await admin
  .from('workspaces')
  .select('id, name')
  .eq('slug', 'casa-dragones')
  .maybeSingle()
if (!ws) {
  console.error('No workspace "casa-dragones"')
  process.exit(1)
}
console.log(`→ workspace ${ws.name}`)

// ─── 2. Casa Dragones Blanco global product ───────────────────────────
const { data: blanco } = await admin
  .from('global_products')
  .select('id')
  .eq('brand', 'Casa Dragones')
  .eq('expression', 'Blanco')
  .maybeSingle()
if (!blanco) {
  console.error('Casa Dragones Blanco not in global_products — run initial seed first')
  process.exit(1)
}
const basePid = blanco.id

// ─── 3. Upsert creators ───────────────────────────────────────────────
const creatorSpecs = [
  {
    name: 'Pujol Bar Team',
    role: 'Restaurant cocktail program',
    venue: 'Pujol',
    city: 'Mexico City',
    country: 'Mexico',
    bio: '#60 World\'s 50 Best Restaurants · #27 Latin America\'s 50 Best. Pujol\'s bar program pairs mezcal-forward drinks with the restaurant\'s celebrated mole.',
    avatar_hue: 28,
    specialties: ['Mexican spirits', 'Classic template riffs', 'Restaurant pairing'],
    languages: ['Spanish', 'English'],
  },
  {
    name: 'Yana Volfson',
    role: 'Mixologist & Tequila Expert',
    venue: 'Independent',
    city: 'New York',
    country: 'USA',
    bio: 'Tequila expert and beverage consultant. Known for elegant, precisely balanced riffs on the Margarita template.',
    avatar_hue: 340,
    pronouns: 'she/her',
    specialties: ['Tequila', 'Margarita variations', 'Sparkling cocktails'],
    languages: ['English', 'Russian'],
    philosophy: 'A great Margarita is a ratio you trust — then you find the one extra thing that makes it yours.',
  },
  {
    name: 'Jim Meehan',
    role: 'Mixologist & Author',
    venue: 'Prev. PDT (NYC)',
    city: 'Portland',
    country: 'USA',
    bio: 'James Beard Foundation winner. Author of The PDT Cocktail Book and Meehan\'s Bartender Manual. Consultant and former beverage director.',
    avatar_hue: 40,
    pronouns: 'he/him',
    specialties: ['Classic cocktail revival', 'Honey syrups', 'Bar operations'],
    languages: ['English'],
    awards: [
      { title: 'James Beard Foundation — Outstanding Bar Program', year: '2009', venue: 'PDT' },
    ],
    book: { title: "The PDT Cocktail Book", year: '2011', publisher: 'Sterling Epicure' },
  },
]

const creatorIds = {}
for (const c of creatorSpecs) {
  // Try to find by name first
  const { data: existing } = await admin
    .from('creators')
    .select('id')
    .eq('workspace_id', ws.id)
    .eq('name', c.name)
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

// José Luis León is already seeded
const { data: jll } = await admin
  .from('creators')
  .select('id')
  .eq('workspace_id', ws.id)
  .ilike('name', 'José Luis León')
  .maybeSingle()
if (jll) creatorIds['José Luis León'] = jll.id
else console.warn('! José Luis León not found — Al Pastor will have no creator link')

// ─── 4. Cocktails ─────────────────────────────────────────────────────
const COCKTAILS = [
  {
    slug: 'ginger-margarita',
    name: 'Ginger Margarita',
    status: 'published',
    category: 'Margarita',
    spirit_base: 'Tequila',
    glass_type: 'Rocks',
    garnish: 'Hibiscus salt rim',
    tasting_notes:
      'Pujol brightens the classic Margarita with fresh ginger — the bite draws out the citrus and agave notes in Casa Dragones Blanco, with a hibiscus-salt rim for earthy tart depth.',
    flavor_profile: ['Citrus', 'Spicy', 'Agave', 'Tart'],
    orb_from: '#f7c9a8',
    orb_to: '#b85540',
    creator: 'Pujol Bar Team',
    featured: true,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '2 oz', amount: 60, unit: 'ml' },
      { name: 'Lemon juice', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Agave honey', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Fresh ginger, cut-crushed', amount_text: '3 slices', amount: 3, unit: 'pc' },
      { name: 'Hibiscus salt', amount_text: 'rim', amount: null, unit: null },
    ],
    method: [
      'Rim a rocks glass with hibiscus salt.',
      'Muddle the fresh ginger slices with lemon juice and agave honey in a cocktail shaker.',
      'Add Casa Dragones Blanco and ice, shake well.',
      'Strain into the rimmed rocks glass filled with fresh ice.',
    ],
  },
  {
    slug: 'margarita-royale',
    name: 'Margarita Royale',
    status: 'published',
    category: 'Margarita',
    spirit_base: 'Tequila',
    glass_type: 'Nick & Nora',
    garnish: 'Lime twist, optional',
    tasting_notes:
      'Yana Volfson\'s festive riff folds Champagne into a precise Margarita frame — Casa Dragones Blanco holds its citrus and agave through the sparkle, Triple Sec keeps it bright.',
    flavor_profile: ['Citrus', 'Sparkling', 'Crisp', 'Elegant'],
    orb_from: '#fdf3d4',
    orb_to: '#e8c97a',
    creator: 'Yana Volfson',
    featured: true,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '1 oz', amount: 30, unit: 'ml' },
      { name: 'Giffard Triple Sec', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Lime juice', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Champagne', amount_text: '2½ oz', amount: 75, unit: 'ml' },
    ],
    method: [
      'Combine Casa Dragones Blanco, Triple Sec and lime juice in a cocktail shaker with ice.',
      'Shake until well chilled.',
      'Strain into a chilled Nick & Nora glass.',
      'Top with Champagne.',
    ],
  },
  {
    slug: 'stumblebee',
    name: 'Stumblebee',
    status: 'published',
    category: 'Sour',
    spirit_base: 'Tequila',
    glass_type: 'Rocks',
    garnish: 'Lemon wheel',
    tasting_notes:
      'Jim Meehan\'s three-ingredient sour swaps simple syrup for honey and rims the glass with cracked black pepper — sweet, spicy, and disarmingly simple. Lemon wheel keeps it honest.',
    flavor_profile: ['Honey', 'Citrus', 'Peppery', 'Balanced'],
    orb_from: '#f8dd9b',
    orb_to: '#a6732b',
    creator: 'Jim Meehan',
    featured: false,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '2 oz', amount: 60, unit: 'ml' },
      { name: 'Lemon juice', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Honey syrup (2:1)', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Salt & black peppercorn mix', amount_text: 'rim', amount: null, unit: null },
    ],
    method: [
      'Rim a rocks glass with a salt and cracked black peppercorn mix.',
      'Combine Casa Dragones Blanco, lemon juice and honey syrup in a shaker with ice.',
      'Shake well and fine-strain into the rimmed rocks glass over fresh ice.',
      'Garnish with a lemon wheel.',
    ],
  },
  {
    slug: 'margarita-al-pastor',
    name: 'Margarita al Pastor',
    status: 'published',
    category: 'Margarita',
    spirit_base: 'Tequila',
    glass_type: 'Rocks',
    garnish: 'Pineapple triangle, salt rim',
    tasting_notes:
      'A riff on the taqueria classic — pineapple, fresh herbs, serrano and agave stand in for the trompo. Casa Dragones Blanco carries the taco-mix without getting lost: it tastes like drinking tequila and eating tacos at the same time.',
    flavor_profile: ['Tropical', 'Herbal', 'Spicy', 'Umami'],
    orb_from: '#ffca8a',
    orb_to: '#cc6a28',
    creator: 'José Luis León',
    featured: true,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '1½ oz', amount: 45, unit: 'ml' },
      { name: 'Cointreau', amount_text: '⅔ oz', amount: 20, unit: 'ml' },
      { name: 'Lime juice', amount_text: '½ oz', amount: 15, unit: 'ml' },
      {
        name: 'Taco mix (pineapple, coriander, mint, basil, serrano-agave)',
        amount_text: '1½ oz',
        amount: 45,
        unit: 'ml',
        notes:
          '1½ oz pineapple juice, ⅔ oz water, 3 g coriander, 3 g mint, 3 g basil, ½ oz serrano-chile agave syrup',
      },
      { name: 'Pineapple triangle', amount_text: 'garnish', amount: 1, unit: 'pc' },
    ],
    method: [
      'Rim a rocks glass with salt.',
      'Combine Casa Dragones Blanco, Cointreau, lime juice and taco mix in a shaker with ice.',
      'Shake hard and double-strain into the rimmed rocks glass over fresh ice.',
      'Garnish with a pineapple triangle.',
    ],
  },
]

// ─── 5. Idempotent re-insert ──────────────────────────────────────────
const slugs = COCKTAILS.map((c) => c.slug)

// Delete existing rows by slug (cascades ingredients via FK ON DELETE CASCADE)
const { data: existing } = await admin
  .from('cocktails')
  .select('id, slug')
  .eq('workspace_id', ws.id)
  .in('slug', slugs)
if (existing && existing.length > 0) {
  console.log(`→ removing ${existing.length} existing rows for re-seed`)
  const ids = existing.map((r) => r.id)
  await admin.from('cocktail_ingredients').delete().in('cocktail_id', ids)
  await admin.from('cocktails').delete().in('id', ids)
}

for (const c of COCKTAILS) {
  const creatorId = creatorIds[c.creator] ?? null
  const methodSteps = c.method.map((text, i) => ({ step: i + 1, text }))

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

// Final sanity check
const { data: after } = await admin
  .from('cocktails')
  .select('slug, name')
  .eq('workspace_id', ws.id)
  .order('name')
console.log(`\n→ workspace now has ${after?.length ?? 0} cocktails:`)
for (const c of after ?? []) console.log(`   · ${c.name}`)
