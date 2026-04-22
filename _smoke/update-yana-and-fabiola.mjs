// Update Yana Volfson with her Casa Dragones bio info, and create
// Fabiola Padilla (BEKEB, San Miguel de Allende) as a new creator.
// Source: official Casa Dragones 2025 bio sheets.
//
// Run: node --env-file=.env.local _smoke/update-yana-and-fabiola.mjs

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

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

// ─── 1. Yana Volfson — update ────────────────────────────────────────
const yanaPayload = {
  name: 'Yana Volfson',
  role: 'National Beverage Director · Casamata Group',
  venue: 'Cosme · Atla · Elio · Damian · Ticuchi',
  city: 'New York',
  country: 'USA',
  pronouns: 'she/her',
  bio: 'Born and raised in the Bronx. Designing New York beverage programs for 17 years. Currently National Beverage Director for Casamata Group — Cosme, Atla, Elio and Damian in the US, plus Ticuchi in Mexico City.',
  philosophy:
    'Brought cocktail-bar standards into restaurant beverage programs and pioneered natural wines by the glass. At the front of what the industry came to call the "mezcal boom".',
  signature: 'Margarita Royale',
  avatar_hue: 340,
  specialties: [
    'Tequila',
    'Mezcal',
    'Natural wine',
    'Restaurant beverage programs',
    'Margarita variations',
  ],
  languages: ['English', 'Russian'],
  career: [
    {
      role: 'National Beverage Director',
      venue: 'Casamata Group (Cosme, Atla, Elio, Damian, Ticuchi)',
      city: 'New York · Mexico City',
      years: '2019 — present',
    },
    {
      role: 'Beverage Director',
      venue: 'Cosme',
      city: 'New York',
      years: 'Previously',
    },
  ],
  press: [
    { outlet: 'Casa Dragones', title: '2025 Bio Sheet', year: '2025' },
  ],
}

const { data: existingYana } = await admin
  .from('creators')
  .select('id')
  .eq('workspace_id', ws.id)
  .ilike('name', 'Yana Volfson')
  .maybeSingle()

if (existingYana) {
  const { error } = await admin
    .from('creators')
    .update(yanaPayload)
    .eq('id', existingYana.id)
  if (error) {
    console.error('! Yana update failed:', error.message)
    process.exit(1)
  }
  console.log('~ Yana Volfson updated')
} else {
  const { error } = await admin
    .from('creators')
    .insert({ workspace_id: ws.id, ...yanaPayload })
  if (error) {
    console.error('! Yana insert failed:', error.message)
    process.exit(1)
  }
  console.log('+ Yana Volfson created')
}

// ─── 2. Fabiola Padilla — create (or update if somehow exists) ──────
const fabiolaPayload = {
  name: 'Fabiola Padilla',
  role: 'Mixologist · Founder of BEKEB',
  venue: 'BEKEB · Casa Hoyos',
  city: 'San Miguel de Allende',
  country: 'Mexico',
  pronouns: 'she/her',
  bio: 'Internationally recognised creative mixologist, known for collaborations on the New York scene — notably Cosme with Enrique Olvera and the bar at Ian Schrager\'s Public Hotel on the Lower East Side. Founded BEKEB in 2019 in San Miguel de Allende (a UNESCO World Heritage site), on the rooftop of the boutique Casa Hoyos hotel.',
  philosophy: 'Artisanal mixology rooted in Mexican ingredients and Mexican places.',
  signature: 'BEKEB rooftop menu',
  avatar_hue: 20,
  specialties: ['Artisanal mixology', 'Agave spirits', 'Rooftop bar programs', 'Luxury hospitality'],
  languages: ['Spanish', 'English'],
  career: [
    {
      role: 'Founder & Head Mixologist',
      venue: 'BEKEB · Casa Hoyos rooftop',
      city: 'San Miguel de Allende',
      years: '2019 — present',
    },
    {
      role: 'Cocktail collaborator',
      venue: 'Cosme (Enrique Olvera)',
      city: 'New York',
      years: 'Previously',
    },
    {
      role: 'Cocktail collaborator',
      venue: 'Public Hotel (Ian Schrager)',
      city: 'New York',
      years: 'Previously',
    },
  ],
  awards: [
    {
      title: 'Coolest Boutique Hotel Restaurants & Bars of Mexico',
      year: '2021',
      venue: 'Forbes × Hotels Above Par (Brandon Berkson)',
    },
  ],
  press: [
    {
      outlet: 'Forbes',
      title: 'Coolest Boutique Hotel Restaurants & Bars of Mexico · BEKEB',
      year: '2021',
    },
    { outlet: 'Casa Dragones', title: '2025 Bio Sheet', year: '2025' },
  ],
}

const { data: existingFabiola } = await admin
  .from('creators')
  .select('id')
  .eq('workspace_id', ws.id)
  .ilike('name', 'Fabiola Padilla')
  .maybeSingle()

if (existingFabiola) {
  const { error } = await admin
    .from('creators')
    .update(fabiolaPayload)
    .eq('id', existingFabiola.id)
  if (error) {
    console.error('! Fabiola update failed:', error.message)
    process.exit(1)
  }
  console.log('~ Fabiola Padilla updated')
} else {
  const { error } = await admin
    .from('creators')
    .insert({ workspace_id: ws.id, ...fabiolaPayload })
  if (error) {
    console.error('! Fabiola insert failed:', error.message)
    process.exit(1)
  }
  console.log('+ Fabiola Padilla created')
}

console.log('\n✓ done')
