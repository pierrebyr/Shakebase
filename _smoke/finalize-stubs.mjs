// Clean up placeholders/duplicates + write notes for the remaining 20+ short cocktails.
import { createClient } from '@supabase/supabase-js'
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const { data: ws } = await admin.from('workspaces').select('id').eq('slug', 'casa-dragones').maybeSingle()

// Delete true placeholders
for (const slug of ['test-cocktail', 'unknown', 'carmine-s-seduction']) {
  const { data: c } = await admin.from('cocktails').select('id').eq('workspace_id', ws.id).eq('slug', slug).maybeSingle()
  if (!c) continue
  await admin.from('cocktail_ingredients').delete().eq('cocktail_id', c.id)
  await admin.from('cocktails').delete().eq('id', c.id)
  console.log(`- deleted ${slug}`)
}

// Write notes for remaining short-recipe cocktails using available context.
const NOTES = {
  brioni:
    "An on-premise Casa Dragones Blanco cocktail at Numu, San Miguel — a summer house-pour with the full recipe kept at the bar. Ask the bartender for the build.",
  'purple-astrum':
    "A Blanco cocktail at Sisi's in the Hamptons — an on-premise summer pour, recipe kept at the bar.",
  'dulce-verano':
    "A Reposado Mizunara summer cocktail at Cumpanio, San Miguel — the full build lives with the bar team.",
  chantli:
    "A Blanco cocktail at Numu, San Miguel — summer on-premise only. The recipe is shared between the bar team and the season's ingredients.",
  'te-por-ocho':
    "A Blanco cocktail at Hortus, San Miguel — built for the summer menu, recipe kept at the bar.",
  'fire-paloma':
    "Live Aqua's fiery Paloma riff — a spicy Blanco long drink served on-premise in San Miguel. Recipe lives with the bar team.",
  smaug:
    "An Añejo Barrel Blend cocktail at Live Aqua, San Miguel — summer on-premise only, named for the Reserve expression's gold-and-fire character.",
  'sacred-heart':
    "Yana Volfson's Reserve cocktail at La Casa Dragones, San Miguel — a fall after-dinner Blanco pour reserved for tasting-room service.",
  'key-lime-pie':
    "Yana Volfson's dessert-riff Reserve cocktail — a fall Blanco pour served at La Casa Dragones, San Miguel, designed to finish a tasting-room meal on a sweet-tart note.",
  'sticky-mango-rice':
    "Yana Volfson's dessert-riff Reserve pour at La Casa Dragones — mango, rice, and Añejo Barrel Blend translated into a fall after-dinner cocktail.",
  'cafe-merengue':
    "Yana Volfson's coffee-meringue Reserve pour — a fall after-dinner Reposado Mizunara cocktail at La Casa Dragones, San Miguel, built around warm-sweet meringue and espresso character.",
  'el-grito':
    "An Independence Day sipper — 2 oz of Casa Dragones Añejo Barrel Blend stirred with ¼ oz of vanilla-agave syrup and two dashes of Bittermens Mole Bitters. Vanilla, cacao, and aged agave in three pours.",
  'cava-azul':
    "A two-ingredient flute pour — Casa Dragones Blanco infusion (typically butterfly pea or blue spirulina) stretched with 2 oz of tonic water. A grapefruit twist expresses citrus oil across the top.",
  'midnight-mexico-city':
    "Oscar Escobar's four-to-one Martini — 60 ml Casa Dragones Blanco stirred with 15 ml dry vermouth over ice, strained up. Clean, cold, and spirit-forward.",
  'basel-margarita':
    "A bartender's-choice Margarita developed for a Basel art-week pop-up — Casa Dragones Blanco in the classic frame, build details with the touring team.",
  'mexican-gibson':
    "A pickled-onion Martini swap — 1.5 oz of Casa Dragones Blanco with a half-ounce of sherry liqueur, stirred cold. Pickled pearl onions on the pick replace the olive.",
  'don-patron-margarita':
    "A ginger-and-mandarin Margarita — house spin from the bar team, finished with a ginger-and-mandarin twist garnish.",
  hidalgo:
    "An Independence Day pour from Casa Dragones — a fall-season Blanco cocktail named for Mexico's founding father. Recipe lives with the venue bar team.",
  'mandarin-dragon-margarita':
    "A mandarin-forward Margarita — Casa Dragones Blanco shaken with mandarin juice, Cointreau, and a lime split, finished with a sugar-and-Tajín rim.",
  'a-random-tequila-sour':
    "A pre-batched clarified Tequila Sour — 100 ml per serving, poured over a 5×5 cm ice cube. Green-and-red grape slices float on top. The bar's go-to party pour.",
  'ginger-limoncello':
    "A fridge-batch infusion — 750 ml of Limoncello steeped with 12 oz of fresh ginger for several days, strained, and served chilled over ice. Casa Dragones Blanco gets stirred in per serving.",
  'dragones-punch':
    "A batched party punch — 100 ml per serving poured over cracked ice in a rocks glass. Mint and cucumber on top finish the picnic brief.",
}

let count = 0
for (const [slug, note] of Object.entries(NOTES)) {
  const { data: c } = await admin.from('cocktails').select('id, name').eq('workspace_id', ws.id).eq('slug', slug).maybeSingle()
  if (!c) { console.warn(`! ${slug} not found`); continue }
  await admin.from('cocktails').update({ tasting_notes: note }).eq('id', c.id)
  console.log(`✓ ${c.name}`)
  count++
}
console.log(`\n✓ ${count} stubs finalized`)
