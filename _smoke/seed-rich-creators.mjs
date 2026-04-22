// Seed three enriched creators in Casa Dragones workspace so the profile
// page has something to show. Safe to re-run — upserts on (workspace_id, name).
//
// Run: node --env-file=.env.local _smoke/seed-rich-creators.mjs

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

const CREATORS = [
  {
    name: 'Mirela Sato',
    role: 'Head Mixologist',
    venue: 'Aurelia Bar',
    city: 'Lisbon',
    country: 'Portugal',
    joined_year: '2021',
    bio: 'Champions acid-forward, low-ABV compositions. Former pastry chef; approaches bitters like spice cabinets.',
    avatar_hue: 18,
    pronouns: 'she/her',
    languages: ['Portuguese', 'English', 'Spanish', 'French'],
    signature: 'Acid-adjusted split bases',
    philosophy:
      'A drink should feel hungry, not sweet. The pastry instinct is to end full — the bar instinct is to end wanting more.',
    specialties: ['Clarification', 'Cordials', 'Acid adjustment', 'Low-ABV'],
    career: [
      { year: '2014', role: 'Pastry Commis', place: 'Belcanto, Lisbon' },
      { year: '2017', role: 'Pastry Sous Chef', place: 'Ocean, Algarve' },
      { year: '2019', role: 'Junior Bartender', place: 'Red Frog, Lisbon' },
      { year: '2021', role: 'Head Mixologist', place: 'Aurelia Bar', current: true },
    ],
    awards: [
      { year: 2024, title: 'Best Bar List — Iberia', org: 'Tales of the Cocktail', medal: 'gold' },
      { year: 2024, title: 'Top 10 European Bartender', org: "Difford's Guide", medal: 'silver' },
      { year: 2023, title: 'Innovation in Acid', org: 'Mixology Awards', medal: 'gold' },
      { year: 2022, title: '50 Best Discovery', org: "World's 50 Best Bars", medal: 'bronze' },
    ],
    certifications: [
      { name: 'WSET Spirits — Level 3', year: 2022, issuer: 'WSET' },
      { name: 'BarSmarts Advanced', year: 2020, issuer: 'BarSmarts' },
    ],
    competitions: [
      { year: 2024, name: 'Bacardí Legacy', placement: 'Iberia Champion' },
      { year: 2023, name: 'World Class', placement: 'Portugal Top 3' },
    ],
    press: [
      { outlet: 'Imbibe Magazine', title: "Lisbon's Acid Queen", year: 2024 },
      { outlet: 'Condé Nast Traveler', title: '10 Bars Worth the Flight', year: 2023 },
      { outlet: 'Punch', title: 'Why Vinegar Is the New Lime', year: 2023 },
    ],
    socials: { instagram: '@mirelasato', linkedin: 'mirela-sato', website: 'aureliabar.pt' },
    mentors: ['Ryan Chetiyawardana', 'Chef Vítor Adão'],
  },
  {
    name: 'Halsey Brenner',
    role: 'R&D Lead',
    venue: 'ShakeBase Lab',
    city: 'Brooklyn',
    country: 'USA',
    joined_year: '2019',
    bio: 'Runs the fermentation program. Co-authored our clarification handbook.',
    avatar_hue: 210,
    pronouns: 'they/them',
    languages: ['English'],
    signature: 'Wild fermentation',
    philosophy:
      'The best technique is the one you document so the next person can break it.',
    specialties: ['Fermentation', 'Milk clarification', 'Rotary distillation', 'R&D'],
    career: [
      { year: '2012', role: 'Line Cook', place: 'Noma, Copenhagen' },
      { year: '2015', role: 'Ferment Lead', place: "Lyle's, London" },
      { year: '2017', role: 'Bar Manager', place: 'Dante, NYC' },
      { year: '2019', role: 'R&D Lead', place: 'ShakeBase Lab', current: true },
    ],
    awards: [
      { year: 2025, title: 'Best New Bar Program', org: 'Eater', medal: 'gold' },
      { year: 2024, title: 'Technique of the Year', org: 'Imbibe 75', medal: 'gold' },
      {
        year: 2023,
        title: 'Spirited Awards — Innovator',
        org: 'Tales of the Cocktail',
        medal: 'silver',
      },
    ],
    certifications: [
      { name: 'Cicerone Certified Server', year: 2018, issuer: 'Cicerone' },
      { name: 'Food Safety Manager (ServSafe)', year: 2019, issuer: 'ServSafe' },
      { name: 'Fermentation Science — Certificate', year: 2021, issuer: 'ICE' },
    ],
    competitions: [],
    press: [
      { outlet: 'New York Times', title: 'The Lab Behind Your Highball', year: 2024 },
      { outlet: 'Eater', title: 'Inside a Cocktail R&D Room', year: 2024 },
      { outlet: 'Bloomberg', title: 'Milk Punch, Optimised', year: 2023 },
    ],
    socials: {
      instagram: '@halseymakes',
      linkedin: 'halsey-brenner',
      website: 'shakebase.lab',
    },
    mentors: ['Dave Arnold', 'Don Lee'],
    book: { title: 'The Clarification Handbook', year: 2023, co: 'M. Seegers' },
  },
  {
    name: 'Yui Tachibana',
    role: 'Brand Ambassador',
    venue: 'Kogane',
    city: 'Kyoto',
    country: 'Japan',
    joined_year: '2022',
    bio: 'Specializes in umami, shio-koji infusions, and translating washoku pairings into drinks.',
    avatar_hue: 152,
    pronouns: 'she/her',
    languages: ['Japanese', 'English'],
    signature: 'Koji-fermented cordials',
    philosophy: 'Umami before sugar. The tongue needs salt to notice sweetness.',
    specialties: ['Umami', 'Shio-koji', 'Japanese whisky', 'Washoku pairings'],
    career: [
      { year: '2016', role: 'Kaiseki line cook', place: 'Kikunoi, Kyoto' },
      { year: '2019', role: 'Bartender', place: 'Bar Benfiddich, Tokyo' },
      { year: '2022', role: 'Brand Ambassador', place: 'Kogane', current: true },
    ],
    awards: [
      { year: 2024, title: 'Asia 50 Best — Rising Star', org: "Asia's 50 Best Bars", medal: 'silver' },
      { year: 2023, title: 'Best Whisky Cocktail', org: 'Suntory Time', medal: 'gold' },
    ],
    certifications: [{ name: 'Sake Sommelier', year: 2020, issuer: 'SSA' }],
    competitions: [
      { year: 2023, name: 'Suntory Time', placement: 'Japan Champion' },
    ],
    press: [
      { outlet: 'Monocle', title: 'Kyoto, In a Glass', year: 2024 },
    ],
    socials: { instagram: '@yui.koji', website: 'kogane.kyoto' },
    mentors: ['Hidetsugu Ueno'],
  },
]

for (const c of CREATORS) {
  const { data: existing } = await admin
    .from('creators')
    .select('id')
    .eq('workspace_id', ws.id)
    .eq('name', c.name)
    .maybeSingle()

  if (existing) {
    const { error } = await admin
      .from('creators')
      .update(c)
      .eq('id', existing.id)
    if (error) {
      console.error(`✗ update ${c.name}: ${error.message}`)
    } else {
      console.log(`✓ updated ${c.name}`)
    }
  } else {
    const { error } = await admin
      .from('creators')
      .insert({ workspace_id: ws.id, ...c })
    if (error) {
      console.error(`✗ insert ${c.name}: ${error.message}`)
    } else {
      console.log(`✓ inserted ${c.name}`)
    }
  }
}

console.log('\n✅ Creators seeded')
