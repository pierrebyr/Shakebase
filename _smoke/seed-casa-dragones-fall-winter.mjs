// Seed 12 more Casa Dragones cocktails spanning Blanco, Añejo Barrel Blend,
// and Reposado Mizunara. Adds the two missing products to the global
// catalog. Creates 3 new creators (Luis Franklin Hernández, Leo
// Robitschek, PDT Bar Team) and reuses Yana / Jim / José Luis.
//
// Run: node --env-file=.env.local _smoke/seed-casa-dragones-fall-winter.mjs

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// ─── 1. Workspace ─────────────────────────────────────────────────────
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

// ─── 2. Ensure all three Casa Dragones products exist ────────────────
const productsSpec = [
  {
    brand: 'Casa Dragones',
    expression: 'Blanco',
    category: 'Tequila',
    abv: 40.0,
    origin: 'Tequila, Jalisco, Mexico',
    description: '100% Blue Agave. Small-batch joven tequila.',
  },
  {
    brand: 'Casa Dragones',
    expression: 'Añejo Barrel Blend',
    category: 'Tequila',
    abv: 40.0,
    origin: 'Tequila, Jalisco, Mexico',
    description:
      'Aged in new American oak and used French oak for a layered, spirit-forward añejo with fresh agave undertones.',
  },
  {
    brand: 'Casa Dragones',
    expression: 'Reposado Mizunara',
    category: 'Tequila',
    abv: 40.0,
    origin: 'Tequila, Jalisco, Mexico',
    description:
      'Rested in rare Japanese Mizunara oak — elegant sweetness, soft wood spice, refined agave.',
  },
]

const productIds = {}
for (const p of productsSpec) {
  const { data: existing } = await admin
    .from('global_products')
    .select('id')
    .eq('brand', p.brand)
    .eq('expression', p.expression)
    .maybeSingle()
  if (existing) {
    productIds[p.expression] = existing.id
    console.log(`· product ${p.brand} ${p.expression} exists`)
    continue
  }
  const { data: inserted, error } = await admin
    .from('global_products')
    .insert(p)
    .select('id')
    .single()
  if (error || !inserted) {
    console.error(`! product insert failed for ${p.expression}:`, error?.message)
    process.exit(1)
  }
  productIds[p.expression] = inserted.id
  console.log(`+ product ${p.brand} ${p.expression}`)
}

// ─── 3. Creators (upsert) ─────────────────────────────────────────────
const creatorSpecs = [
  {
    name: 'Luis Franklin Hernández',
    role: 'Mixologist',
    venue: 'Independent',
    city: 'Mexico City',
    country: 'Mexico',
    bio: 'Mixologist known for cocktails that honour Day-of-the-Dead ritual and Mexican kitchen traditions — horchata, cacao, pipian — inside a cocktail frame.',
    avatar_hue: 350,
    specialties: ['Mexican spirits', 'Day-of-the-Dead inspired builds', 'Egg-rich cocktails'],
    languages: ['Spanish', 'English'],
  },
  {
    name: 'Leo Robitschek',
    role: 'Partner & VP of F&B',
    venue: 'The NoMad Hotel',
    city: 'New York',
    country: 'USA',
    bio: 'Partner and VP of F&B at The NoMad Hotel, New York. Architect of the award-winning NoMad Bar cocktail program. Known for elegant, seasonal builds rooted in classic technique.',
    avatar_hue: 30,
    pronouns: 'he/him',
    specialties: ['Seasonal cocktail programs', 'Hotel bar operations', 'Classic technique'],
    languages: ['English'],
    awards: [
      { title: 'Tales of the Cocktail — World\'s Best Hotel Bar', year: 'Multiple', venue: 'NoMad Bar' },
    ],
  },
  {
    name: 'PDT Bar Team',
    role: 'Speakeasy cocktail program',
    venue: "Please Don't Tell",
    city: 'New York',
    country: 'USA',
    bio: 'James Beard Foundation Award — Outstanding Bar Program. The PDT house team behind the hot-dog-shop entrance and its decade of influential drinks.',
    avatar_hue: 0,
    specialties: ['Classic revival', 'Riffing on forgotten templates', 'Guest collaborations'],
    languages: ['English'],
    awards: [
      {
        title: 'James Beard Foundation — Outstanding Bar Program',
        year: '2009',
        venue: "Please Don't Tell",
      },
    ],
  },
]

const creatorIds = {}
for (const c of creatorSpecs) {
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

// Reuse existing creators
for (const name of ['Yana Volfson', 'Jim Meehan', 'José Luis León']) {
  const { data } = await admin
    .from('creators')
    .select('id')
    .eq('workspace_id', ws.id)
    .ilike('name', name)
    .is('deleted_at', null)
    .maybeSingle()
  if (data) creatorIds[name] = data.id
}

// ─── 4. Cocktails ─────────────────────────────────────────────────────
const COCKTAILS = [
  {
    slug: 'la-catrina',
    name: 'La Catrina',
    category: 'Aperitif',
    spirit_base: 'Tequila',
    product: 'Blanco',
    glass_type: 'Old Fashioned',
    garnish: 'None',
    tasting_notes:
      'Luis Franklin Hernández\'s Day-of-the-Dead homage — rice horchata, cacao agua fresca, ancho chili and pipian wrapped in egg, poured over Casa Dragones Blanco. Creamy, spiced, culturally dense.',
    flavor_profile: ['Creamy', 'Spiced', 'Earthy', 'Chocolate'],
    orb_from: '#d9b896',
    orb_to: '#7c5a34',
    creator: 'Luis Franklin Hernández',
    featured: false,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '2 oz', amount: 60, unit: 'ml' },
      { name: 'Rice agua fresca (horchata)', amount_text: '2 oz', amount: 60, unit: 'ml' },
      { name: 'Cacao agua fresca (chocolate)', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Ancho Reyes Ancho Chili Liqueur', amount_text: '¼ oz', amount: 7, unit: 'ml' },
      { name: 'Pepita paste (pipian)', amount_text: '¹⁄₁₆ tsp', amount: null, unit: null },
      { name: 'Whole egg', amount_text: '1', amount: 1, unit: 'pc' },
    ],
    method: [
      'Combine Casa Dragones Blanco, horchata, cacao agua fresca, Ancho Reyes and pipian in a shaker and stir.',
      'Add the whole egg and dry-shake to emulsify.',
      'Shake again with ice.',
      'Strain into an old-fashioned glass and serve.',
    ],
  },
  {
    slug: 'the-obsidian',
    name: 'The Obsidian',
    category: 'Spritz',
    spirit_base: 'Tequila',
    product: 'Blanco',
    glass_type: 'Rocks',
    garnish: 'Edible flower',
    tasting_notes:
      'A dark spritz — edible charcoal laces a cinnamon-star-anise syrup, lime brightens, Prosecco lifts. Casa Dragones Blanco holds the herbaceous centre.',
    flavor_profile: ['Spiced', 'Sparkling', 'Smoky', 'Floral'],
    orb_from: '#4a4747',
    orb_to: '#1a1817',
    creator: null,
    featured: false,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '1½ oz', amount: 45, unit: 'ml' },
      {
        name: 'Cinnamon bark & star anise syrup',
        amount_text: '¾ oz',
        amount: 22,
        unit: 'ml',
      },
      { name: 'Lime juice', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Edible charcoal', amount_text: 'pinch', amount: null, unit: null },
      { name: 'Prosecco', amount_text: 'top', amount: null, unit: null },
    ],
    method: [
      'Dry-shake Casa Dragones Blanco, cinnamon-anise syrup, lime and charcoal.',
      'Add ice and shake again.',
      'Double-strain into a rocks glass with one large ice cube.',
      'Top with Prosecco and garnish with an edible flower.',
    ],
  },
  {
    slug: 'rococo',
    name: 'Rococo',
    category: 'Hot cocktail',
    spirit_base: 'Tequila',
    product: 'Añejo Barrel Blend',
    glass_type: 'Mug',
    garnish: 'None',
    tasting_notes:
      'Yana Volfson\'s cold-weather indulgence — whole milk, cream, canela water and chocolate dust simmered together before the Añejo Barrel Blend arrives. Fresh agave undertones cut through the richness.',
    flavor_profile: ['Creamy', 'Chocolate', 'Spiced', 'Warming'],
    orb_from: '#a07358',
    orb_to: '#3a2012',
    creator: 'Yana Volfson',
    featured: true,
    ingredients: [
      {
        name: 'Casa Dragones Añejo Barrel Blend',
        amount_text: '2 oz',
        amount: 60,
        unit: 'ml',
      },
      { name: 'Whole milk', amount_text: '2 oz', amount: 60, unit: 'ml' },
      { name: 'Heavy cream', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Canela water', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Chocolate dust (SOS Chefs)', amount_text: '18 g', amount: 18, unit: 'g' },
    ],
    method: [
      'In a small pot, heat whole milk, cream and canela water on low-medium heat.',
      'Slowly whisk in the chocolate dust until fully folded.',
      'Turn heat to simmer and continue to whisk until smooth.',
      'Finally add Casa Dragones Añejo Barrel Blend and serve in a warm mug.',
    ],
  },
  {
    slug: 'winter-flower',
    name: 'Winter Flower',
    category: 'Hot toddy',
    spirit_base: 'Tequila',
    product: 'Blanco',
    glass_type: 'Mug',
    garnish: 'Clove-studded lemon wheel',
    tasting_notes:
      'Jim Meehan\'s tequila hot toddy — hibiscus tea and grenadine accentuate the floral, aromatic side of Casa Dragones Blanco. A clove-studded lemon wheel ties it together.',
    flavor_profile: ['Floral', 'Warming', 'Herbal', 'Tart'],
    orb_from: '#e28fa0',
    orb_to: '#7a2a40',
    creator: 'Jim Meehan',
    featured: false,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '1½ oz', amount: 45, unit: 'ml' },
      { name: 'Hot hibiscus tea', amount_text: '4½ oz', amount: 135, unit: 'ml' },
      { name: 'Herbal liqueur', amount_text: '¼ oz', amount: 7, unit: 'ml' },
      { name: 'Grenadine syrup', amount_text: '¼ oz', amount: 7, unit: 'ml' },
    ],
    method: [
      'Stir all ingredients in a mixing glass.',
      'Serve in a pre-heated mug.',
      'Garnish with a clove-studded lemon wheel.',
    ],
  },
  {
    slug: 'fake-sauvignon',
    name: 'Fake Sauvignon',
    category: 'Aperitif',
    spirit_base: 'Tequila',
    product: 'Blanco',
    glass_type: 'Wine',
    garnish: 'Slice of pear',
    tasting_notes:
      'José Luis León borrows from classic white-wine cues — dry sherry, pear and green grape — to accent the crisp herbaceous notes of Casa Dragones Blanco. A bright, stirred welcome into fall.',
    flavor_profile: ['Crisp', 'Fruity', 'Herbal', 'Refreshing'],
    orb_from: '#d7e0b8',
    orb_to: '#7d9651',
    creator: 'José Luis León',
    featured: false,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '1½ oz', amount: 45, unit: 'ml' },
      { name: 'Fino-style sherry', amount_text: '1 oz', amount: 30, unit: 'ml' },
      { name: 'Green grape juice', amount_text: '1 oz', amount: 30, unit: 'ml' },
      { name: 'Pear juice', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Pear slice', amount_text: 'garnish', amount: 1, unit: 'pc' },
    ],
    method: [
      'Stir all ingredients in a mixing glass with ice.',
      'Strain into a chilled wine glass or coupe.',
      'Garnish with a slice of pear.',
    ],
  },
  {
    slug: 'dragones-velvet',
    name: 'Dragones Velvet',
    category: 'Sour',
    spirit_base: 'Tequila',
    product: 'Blanco',
    glass_type: 'Coupe',
    garnish: 'None',
    tasting_notes:
      'A fall sour from the PDT team — pumpkin purée, velvet falernum and turmeric wrapped in a milk-and-egg-white frame. Casa Dragones Blanco keeps the earth from getting heavy.',
    flavor_profile: ['Earthy', 'Spiced', 'Creamy', 'Velvety'],
    orb_from: '#e8a866',
    orb_to: '#8f4c18',
    creator: 'PDT Bar Team',
    featured: false,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '1½ oz', amount: 45, unit: 'ml' },
      {
        name: "Farmer's Market Organic Pumpkin Purée",
        amount_text: '¾ tsp',
        amount: null,
        unit: null,
      },
      {
        name: "Taylor's Velvet Falernum",
        amount_text: '¼ oz',
        amount: 7,
        unit: 'ml',
      },
      { name: 'Skim milk', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Egg white', amount_text: '1', amount: 1, unit: 'pc' },
      { name: 'Ground turmeric', amount_text: '⅛ tsp', amount: null, unit: null },
    ],
    method: [
      'Dry-shake all ingredients to emulsify.',
      'Shake again with ice.',
      'Fine-strain into a chilled coupe.',
      'No garnish.',
    ],
  },
  {
    slug: 'crypto-tonic',
    name: 'Crypto Tonic',
    category: 'Highball',
    spirit_base: 'Tequila',
    product: 'Blanco',
    glass_type: 'Highball',
    garnish: 'Lime wheel',
    tasting_notes:
      'Yana Volfson\'s dry, slightly spiced highball — Ancho Verde, dry vermouth and tonic pull the green apple and fresh-pepper notes of Casa Dragones Blanco forward.',
    flavor_profile: ['Crisp', 'Spiced', 'Bitter', 'Refreshing'],
    orb_from: '#c5e0b8',
    orb_to: '#4e7a3c',
    creator: 'Yana Volfson',
    featured: false,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '1 oz', amount: 30, unit: 'ml' },
      { name: 'Ancho Verde', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Dry vermouth', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Lime juice', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Tonic water', amount_text: '2 oz', amount: 60, unit: 'ml' },
    ],
    method: [
      'Build in the glass, add ice.',
      'Dry-shake briefly to integrate.',
      'Top with tonic.',
      'Garnish with a lime wheel.',
    ],
  },
  {
    slug: 'winter-is-coming',
    name: 'Winter is Coming',
    category: 'Sour',
    spirit_base: 'Tequila',
    product: 'Blanco',
    glass_type: 'Rocks',
    garnish: 'Apple slices',
    tasting_notes:
      'Leo Robitschek\'s winter sour — apple cider and maple syrup fold into Casa Dragones Blanco, balanced by Luxardo Amaro Abano and lemon. Orchard and fireside in one glass.',
    flavor_profile: ['Orchard', 'Sweet', 'Bitter', 'Warming'],
    orb_from: '#d8955e',
    orb_to: '#8a4a1a',
    creator: 'Leo Robitschek',
    featured: false,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '1 oz', amount: 30, unit: 'ml' },
      { name: 'Luxardo Amaro Abano', amount_text: '1 oz', amount: 30, unit: 'ml' },
      { name: 'Apple cider', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Lemon juice', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Maple syrup', amount_text: '¼ oz', amount: 7, unit: 'ml' },
    ],
    method: [
      'Combine all ingredients in a shaker over ice.',
      'Shake well.',
      'Strain into a rocks glass over fresh ice.',
      'Garnish with apple slices.',
    ],
  },
  {
    slug: 'mizunara-sour',
    name: 'Mizunara Sour',
    category: 'Sour',
    spirit_base: 'Tequila',
    product: 'Reposado Mizunara',
    glass_type: 'Nick & Nora',
    garnish: 'Dragones stencil in matcha powder',
    tasting_notes:
      'José Luis León plays the elegant sweetness of Casa Dragones Reposado Mizunara off yuzu, lemon and elderflower. A matcha-powder stencil on the foam signs it off.',
    flavor_profile: ['Citrus', 'Floral', 'Woody', 'Refined'],
    orb_from: '#e8d9a6',
    orb_to: '#a68038',
    creator: 'José Luis León',
    featured: true,
    ingredients: [
      {
        name: 'Casa Dragones Reposado Mizunara',
        amount_text: '1½ oz',
        amount: 45,
        unit: 'ml',
      },
      { name: 'Lemon juice', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Yuzu', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Natural syrup', amount_text: '¼ oz', amount: 7, unit: 'ml' },
      { name: 'Elderflower liqueur', amount_text: '½ oz', amount: 15, unit: 'ml' },
      { name: 'Egg white substitute', amount_text: '4 drops', amount: null, unit: null },
    ],
    method: [
      'Add all ingredients to a shaker with ice.',
      'Shake until frothy.',
      'Strain into a Nick & Nora glass.',
      'Garnish with a Dragones stencil using matcha powder.',
    ],
  },
  {
    slug: 'lemon-hot-toddy',
    name: 'Lemon Hot Toddy',
    category: 'Hot toddy',
    spirit_base: 'Tequila',
    product: 'Blanco',
    glass_type: 'Mug',
    garnish: 'Lemon slice',
    tasting_notes:
      'Yana Volfson\'s warmer — fresh lemongrass, honey syrup and hot water wake the herbaceous side of Casa Dragones Blanco. Ginger and lemon do the rest.',
    flavor_profile: ['Warming', 'Citrus', 'Herbal', 'Honey'],
    orb_from: '#f0c466',
    orb_to: '#a76823',
    creator: 'Yana Volfson',
    featured: false,
    ingredients: [
      { name: 'Casa Dragones Blanco', amount_text: '1 oz', amount: 30, unit: 'ml' },
      {
        name: 'Fresh-pressed lemongrass',
        amount_text: '½ oz',
        amount: 15,
        unit: 'ml',
      },
      { name: 'Honey syrup', amount_text: '¾ oz', amount: 22, unit: 'ml' },
      { name: 'Lemon juice', amount_text: '¼ oz', amount: 7, unit: 'ml' },
      { name: 'Hot water', amount_text: '4 oz', amount: 120, unit: 'ml' },
      { name: 'Ginger slices', amount_text: '3', amount: 3, unit: 'pc' },
    ],
    method: [
      'Warm up the 4 oz of water.',
      'Muddle the ginger slices with the lemon juice in a shaker to create an extract.',
      'Combine the extract with the rest of the ingredients in a large snifter and stir to temperature.',
      'Serve in a mug and garnish with a lemon slice.',
    ],
  },
  {
    slug: 'madre-patria',
    name: 'Madre Patria',
    category: 'Old Fashioned',
    spirit_base: 'Tequila',
    product: 'Añejo Barrel Blend',
    glass_type: 'Old Fashioned',
    garnish: 'Skewered lemon, grapefruit and lime peel',
    tasting_notes:
      'Rich and spirit-driven — Casa Dragones Añejo Barrel Blend meets mole bitters, Angostura and demerara, finished with three citrus peels. A stirred, contemplative pour.',
    flavor_profile: ['Spirit-forward', 'Spiced', 'Citrus peel', 'Warming'],
    orb_from: '#c17a42',
    orb_to: '#5a2a0f',
    creator: null,
    featured: true,
    ingredients: [
      {
        name: 'Casa Dragones Añejo Barrel Blend',
        amount_text: '2 oz',
        amount: 60,
        unit: 'ml',
      },
      { name: 'Mole bitters', amount_text: '5 drops', amount: null, unit: null },
      { name: 'Angostura bitters', amount_text: '1 dash', amount: null, unit: null },
      { name: 'Demerara syrup', amount_text: '1 bar spoon', amount: null, unit: null },
      {
        name: 'Lemon, grapefruit and lime peel',
        amount_text: 'garnish',
        amount: null,
        unit: null,
      },
    ],
    method: [
      'Stir with ice until well chilled.',
      'Strain over a large cube in an old-fashioned glass.',
      'Garnish with skewered citrus peels.',
    ],
  },
  {
    slug: 'san-miguel-mule',
    name: 'San Miguel Mule',
    category: 'Mule',
    spirit_base: 'Tequila',
    product: 'Reposado Mizunara',
    glass_type: 'Highball',
    garnish: 'Dill leaf',
    tasting_notes:
      'Casa Dragones Reposado Mizunara brings a refined agave backbone to a bright, ginger-forward highball. A leaf of dill ties the savoury-aromatic side together.',
    flavor_profile: ['Gingery', 'Citrus', 'Savoury', 'Refreshing'],
    orb_from: '#f0dfb4',
    orb_to: '#b08840',
    creator: null,
    featured: false,
    ingredients: [
      {
        name: 'Casa Dragones Reposado Mizunara',
        amount_text: '1½ oz',
        amount: 45,
        unit: 'ml',
      },
      { name: 'Lemon juice', amount_text: '¼ oz', amount: 7, unit: 'ml' },
      { name: 'Ginger beer', amount_text: '4 oz', amount: 120, unit: 'ml' },
      { name: 'Dill leaf', amount_text: 'garnish', amount: null, unit: null },
    ],
    method: [
      'Build the cocktail in a highball glass over ice.',
      'Stir briefly.',
      'Garnish with a dill leaf.',
    ],
  },
]

// ─── 5. Idempotent re-insert ──────────────────────────────────────────
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
  const methodSteps = c.method.map((text, i) => ({ step: i + 1, text }))
  const baseProductId = productIds[c.product] ?? null
  const creatorId = c.creator ? creatorIds[c.creator] ?? null : null

  const { data: inserted, error: insertErr } = await admin
    .from('cocktails')
    .insert({
      workspace_id: ws.id,
      slug: c.slug,
      name: c.name,
      status: 'published',
      category: c.category,
      spirit_base: c.spirit_base,
      base_product_id: baseProductId,
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

  const productLabel = c.product
  const creatorLabel = c.creator ?? '—'
  console.log(
    `+ ${c.name.padEnd(24)} · ${productLabel.padEnd(22)} · ${creatorLabel}`,
  )
}

const { data: after } = await admin
  .from('cocktails')
  .select('slug, name')
  .eq('workspace_id', ws.id)
  .neq('status', 'archived')
  .order('name')
console.log(`\n→ workspace now has ${after?.length ?? 0} cocktails`)
