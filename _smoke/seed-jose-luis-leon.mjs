// Seed José Luis León as a creator in the Casa Dragones workspace.
// Bio based on the 2025 Casa Dragones bio sheet, supplemented with publicly
// documented Limantour / Baltra / Xaman recognitions.
//
// Run: node --env-file=.env.local _smoke/seed-jose-luis-leon.mjs

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
  console.error('No workspace "casa-dragones" found')
  process.exit(1)
}

const CREATOR = {
  name: 'José Luis León',
  role: 'Bar Manager · Limantour, Baltra & Xaman',
  venue: 'Licorería Limantour',
  city: 'Mexico City',
  country: 'Mexico',
  joined_year: '2011',
  pronouns: 'he/him',
  avatar_hue: 28,
  bio: "One of Mexico's leading bartenders, with more than 19 years in the mixology industry. Renowned for his creativity and craft, he has played a central role in the success of Licorería Limantour, Baltra Bar, and Xaman — three establishments ranked among the best in the world. He discovered cocktails by chance while working weddings after a tourism degree, found his calling, and honed his skills across several Mexico City bars before joining Limantour, the country's reference in cocktails. His inspiration is the cultural and gastronomic richness of Mexico: a country he describes as vibrant and creative.",
  signature: 'Agave-forward Mexican modernism',
  philosophy:
    'Mexico is vibrant and creative — every cocktail should carry that weight, from the agave to the garnish.',
  specialties: [
    'Agave spirits',
    'Mexican botanicals',
    'Modern classics',
    'Bar program leadership',
    'Hospitality & training',
  ],
  languages: ['Spanish', 'English'],
  mentors: [],
  career: [
    { year: '2006', role: 'Hospitality server', place: 'Wedding catering, Mexico City' },
    { year: '2008', role: 'Bartender', place: 'Various Mexico City bars' },
    { year: '2011', role: 'Opening bar team', place: 'Licorería Limantour, Roma Norte' },
    {
      year: '2019',
      role: 'Bar Manager',
      place: 'Limantour · Baltra Bar · Xaman',
      current: true,
    },
  ],
  awards: [
    {
      year: 2024,
      title: "World's 50 Best Bars — Licorería Limantour",
      org: "World's 50 Best Bars",
      medal: 'gold',
    },
    {
      year: 2023,
      title: "Best Bar in North America — Licorería Limantour",
      org: "World's 50 Best Bars",
      medal: 'gold',
    },
    {
      year: 2024,
      title: 'Latin America 50 Best — Baltra Bar',
      org: "Latin America's 50 Best Bars",
      medal: 'silver',
    },
    {
      year: 2023,
      title: 'Tales of the Cocktail · World-Class Bar Team',
      org: 'Spirited Awards',
      medal: 'bronze',
    },
  ],
  competitions: [],
  certifications: [
    { name: 'Bar Smarts Advanced', year: 2013, issuer: 'BarSmarts' },
  ],
  press: [
    {
      outlet: 'Imbibe Magazine',
      title: "Mexico City's Cocktail Renaissance",
      year: 2024,
    },
    {
      outlet: 'Food & Wine',
      title: 'Inside Licorería Limantour',
      year: 2023,
    },
    {
      outlet: 'Punch',
      title: 'What Mexico City Taught the World About Agave',
      year: 2023,
    },
  ],
  socials: {
    instagram: '@limantourmx',
    website: 'limantour.tv',
  },
  book: null,
}

const { data: existing } = await admin
  .from('creators')
  .select('id')
  .eq('workspace_id', ws.id)
  .eq('name', CREATOR.name)
  .maybeSingle()

if (existing) {
  const { error } = await admin.from('creators').update(CREATOR).eq('id', existing.id)
  if (error) throw error
  console.log(`✓ updated ${CREATOR.name}`)
} else {
  const { data, error } = await admin
    .from('creators')
    .insert({ workspace_id: ws.id, ...CREATOR })
    .select('id')
    .single()
  if (error) throw error
  console.log(`✓ inserted ${CREATOR.name} (${data.id})`)
}
