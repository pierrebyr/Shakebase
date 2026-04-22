// Batch 9: 20 enriched tasting notes.
import { createClient } from '@supabase/supabase-js'
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const { data: ws } = await admin.from('workspaces').select('id').eq('slug', 'casa-dragones').maybeSingle()

const NOTES = {
  storyteller:
    "Rael Petit's celery-salt tamarind sour — equal parts Blanco and tamarind juice for a tart-brown fruit base, lemon and honey balancing, celery salt on the rim adding vegetal seasoning. An orange twist for aromatic finish.",
  'lima-conde':
    "German Ortega's lime-forward coupe — 30 ml of lime juice over Blanco and a splash of White Martini, macerated lime and ground cardamom finishing the citrus-spice arc. A lime wedge on the rim.",
  ardebit:
    "Ana Paula Soriano's strawberry-vinegar coupe — Dubonnet for bittersweet depth, a full 20 ml of strawberry vinegar cutting the sweetness, natural syrup rounding out. Egg white for silk. Casa Dragones Blanco up front.",
  'once-bitten':
    "Brendan Ledesma's cranberry-fig coupe — five cooked cranberries muddled with fresh fig purée and ginger syrup, lime tightening the frame. Casa Dragones Blanco threads agave underneath the orchard fruit. Rosemary sprig on top.",
  'the-clever-cherry':
    "Oscar Escobar's three-ingredient sour — Cherry Heering layered over lemon juice and a touch of honey, Casa Dragones Blanco at the core. Named for the one ingredient that does the work.",
  'casa-de-cobbler':
    "Jasin Burt's blueberry Cobbler — three blueberries muddled with lime and agave, Lillet Blanc threading apéritif bitterness through the Blanco. Red berries float on top over crushed ice.",
  'rhythm-in-the-blue':
    "Andrew Maurer's Chinato-sherry stirrer — Vermouth Alessio Chinato's quinine-bitter backbone meets Amontillado sherry for nutty dry depth, house vanilla-and-spice syrup rounding the base. Finished with a smoking sage leaf at service.",
  rebujjito:
    "Jim Meehan & Jamie Bissonnette's Andalusian highball — Manzanilla Cigarrera sherry split with Casa Dragones Blanco, mineral water stretching the whole thing long, lemon-balm syrup threading citrus-herb. A single lemon-balm leaf on top.",
  alma:
    "A coffee-cacao Reposado Old-Fashioned — Casa Dragones Reposado Mizunara with a bar-spoon of coffee liqueur, four dashes of chocolate bitters, a half-ounce of Serrano-cinnamon agave syrup. Stirred long, coin of orange peel for the aromatic.",
  'dragao-de-jardim':
    "Rael Petit's watermelon highball — 60 ml of WTRMLN WTR (or fresh watermelon juice) stretches Blanco into a summer cooler, liquid honey and fresh lemon tightening the sweetness. An edible orchid finishes the garden brief.",
  'martini-dragon':
    "An Aperol-redcurrant spritzed martini — 360 ml of redcurrant juice stretches the drink long, Aperol and blueberry juice tinting it deep pink. Casa Dragones Blanco structural. An orange twist on top.",
  'baja-dragones':
    "Diego Hernández Boquedano & Ryan Hollowell's watermelon agua fresca — 295 ml of marinated watermelon agua fresca stretches Blanco into a low-alc summer sipper, agave nectar and lime tightening the melon. Fresh basil and cilantro sprigs for herb lift.",
  'mi-otra-mitad':
    "Enrique Olvera & Jim Meehan's citrus-cilantro spritz — one orange and two lemons muddled with cilantro leaves, Galliano layered over the whole thing, tonic water for lift. Melon slices float on the coupe. A weird garden garnish that works.",
  beowulf:
    "Pedro Bermúdez's vanilla-banana martini — three canned pineapple pieces muddled with vanilla extract, Crème de Banane doubling down on the tropical, Eureka lemon and pineapple syrup balancing. Dark chocolate shavings finish the chilly dessert brief.",
  'i-love-w-i-t-s':
    "Sam Clifton's tangerine Old-Fashioned — equal parts tangerine juice and tangerine syrup layered with lime and two dashes of agave, 60 ml of Blanco underneath. Comes out bright orange, tastes like sunrise.",
  'la-paloma':
    "Leo Robitschek's mezcal-split Paloma — 15 ml of mezcal threading smoke through a classic grapefruit-lime-agave frame, Casa Dragones Blanco doubling down on agave character. A salt rim would take it home.",
  'citron-au-jardin':
    "A fennel-honey coupe — two bronze fennel sprigs muddled hard with virgin honey and lemon, Yellow Chartreuse threading herbal sweetness, sparkling water stretching it long. Casa Dragones Blanco up front.",
  'el-futuro':
    "A jicama-lychee highball — house jicama reduction for crisp-sweet earthy body, lychee juice for floral-tropical, elderflower liqueur layering further floral lift, three drops of citric acid tightening. An edible flower on top.",
  'millionaire-margarita':
    "A dressed-up Margarita — Blanco, Grand Marnier instead of Cointreau, fresh lime, name as the marketing. The cognac-orange base elevates the classic frame without changing the math.",
  'zumo-de-dragones':
    "Mario González's savory-sweet highball — one medium nopal paddle and a parsley sprig muddled with fresh pineapple juice, blended and strained. Casa Dragones Blanco at the base. Served over ice with a grilled pineapple slice and parsley sprig.",
}

let count = 0
for (const [slug, note] of Object.entries(NOTES)) {
  const { data: c } = await admin.from('cocktails').select('id, name').eq('workspace_id', ws.id).eq('slug', slug).maybeSingle()
  if (!c) { console.warn(`! ${slug} not found`); continue }
  await admin.from('cocktails').update({ tasting_notes: note }).eq('id', c.id)
  console.log(`✓ ${c.name}`)
  count++
}
console.log(`\n✓ ${count} tasting notes rewritten`)
