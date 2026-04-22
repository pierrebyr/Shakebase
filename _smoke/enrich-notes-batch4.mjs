// Batch 4: 20 more enriched tasting notes.
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const { data: ws } = await admin
  .from('workspaces')
  .select('id')
  .eq('slug', 'casa-dragones')
  .maybeSingle()

const NOTES = {
  'mi-casa-es-su-casa':
    "Rob Ferrara's 3-ingredient stirrer — Lustau East India Solera sherry for date-and-raisin sweetness, Bittermens Xocolatl Mole bitters for cacao-and-chile depth, and a measured splash of agave nectar to bind. Casa Dragones Blanco stays clean under the raisined sherry weight.",
  'champagne-margarita':
    "A Champagne-rim Margarita — Grand Marnier swapped in for Cointreau to add cognac warmth, agave syrup for smoothness, and lime to keep it honest. Served in a flute with a Seville orange slice and volcanic black salt crusting the rim.",
  adoro:
    "Isaías Padilla's orchard-and-bacon coupe from San Miguel — bacon-fat-washed Blanco gets bright green-apple juice and a splash of fat-washed white wine. Served in a chilled Nick & Nora with a candied bacon-twist garnish.",
  'the-colors-of-san-miguel':
    "William Santiago's horchata-blue-curaçao coupe — a Blanco split with house horchata cream, Blue Curaçao tinting it lagoon-green, Bigallet China-China pulling a bitter-orange edge through the sweetness. An edible flower floats on top.",
  mallorca:
    "Scott Villalobos's Mediterranean sour — orgeat syrup bringing almond depth, three-citrus split (grapefruit, lemon, lime) keeping it bright, Casa Dragones Blanco letting the agave speak. A lemon peel expression across the coupe finishes the Balearic brief.",
  'reposado-highball':
    "Yana Volfson's low-alc Reposado Mizunara highball — fresh coconut water folded into mineral water over a long ice spear, one hoja santa leaf threading green-anise aromatics through the finish. Drinks like hydration with character.",
  'mizunara-masu':
    "José Luis León's Masu-box stirrer — Aperol and Rosso vermouth split for bittersweet orange-and-spice, two dashes of Peychaud's tinting the cocktail pink, Casa Dragones Reposado Mizunara's Japanese-oak adding depth. Served in a cedar masu with white flowers on the rim.",
  'purple-flowers':
    "Berenice Morales' butterfly-pea sour — Casa Dragones Blanco infused with butterfly-pea-flower tincture turns electric blue; a grapefruit-skin oleo saccharum, Limoncello, and lime shake it into a sunset-purple coupe. Egg white for the silky crown.",
  'the-dark-night':
    "Pure black sapote blended with orange liqueur and tangerine juice over Blanco — lime for tightness, cardamom syrup for warm spice. Served long and dark in a coupe, like a Negroni that went off the road into the jungle.",
  'san-miguel':
    "Jim Meehan's two-drop Old-Fashioned — 60 ml of Casa Dragones Blanco, a bar-spoon of agave honey, two drops of Miracle Mile Celery Bitters. Stirred long over one large cube. A reserved citrus peel expression finishes the quiet drink.",
  'manzana-blanca':
    "Mads Refslund's Nordic-take on the Paloma — two green apples and two lemons muddled with a handful of cilantro and agave honey, Casa Dragones Blanco poured in to bind. Finishes herbal, tart, and very cold.",
  'smash-daisy':
    "James Smith's mint-pepper Daisy — fresh lime and Cointreau over muddled red bell pepper and mint, Casa Dragones Blanco holding agave underneath the herb-heat mix. A mint sprig and bell-pepper wheel sit on the coupe rim like a garden in miniature.",
  'stuck-in-summer-love':
    "José Luis León's lychee spritz — Mistela Pijoan's dessert-wine sweetness stretched with grapefruit juice, lychee soda, and Prosecco. Casa Dragones Blanco keeps the core agave-dry. Served in a coupe with raspberry and a single dried leaf.",
  'the-boardroom':
    "An after-dinner Reserve stirrer — Casa Dragones Añejo Barrel Blend with Empirical Ayuuk's smoke, Volume Primo vermouth, Navazos Manzanilla sherry, and a bar-spoon of Giffard Crème de Cacao. Finished with coffee dust on the surface.",
  'basil-smash':
    "Adrian Evans's bergamot-basil Smash — ten basil leaves muddled hard with bergamot juice and agave syrup, Casa Dragones Blanco shaken through. Finishes like fresh pesto in a cold glass, bergamot giving the whole thing Earl-Grey lift.",
  greenhouse:
    "Osvaldo Vázquez's garden coupe — green apple, ginger, epazote, and citrus muddled hard, Casa Dragones Blanco poured long over the mash. Comes out green and tart, with epazote and orange-blossom garnishing the top.",
  'silver-gold':
    "A Chrysanthemum-tea sour — fresh ginger pressed into lemon juice and chrysanthemum tea, honey mixed with edible gold dust for the sweet finish, Laphroaig Lore whiskey spritzed across the surface for smoke. A dried chrysanthemum flower for garnish.",
  'pinapple-express':
    "Angela Díaz's hot-sweet coupe — three fresh pineapple pieces muddled with cilantro and sliced serrano, Cointreau and lime pulling it bright, Casa Dragones Blanco threading agave through the whole thing. Cilantro sprig and pineapple wedge finish it jungle-tropical.",
  'mother-of-dragons':
    "Jeff Bell's berry-sherry sour — fresh raspberries and blackberries muddled with Lustau Amontillado, ten drops of Bittermens Hellfire Shrub for chile heat, agave syrup for balance. Casa Dragones Blanco carries the spine. Drinks dark, warm, and a little dangerous.",
  'elixir-cartujo':
    "Anatol's Chartreuse-mint cooler — 120 ml of house mint syrup (yes, that's right) with Green Chartreuse and lime, Casa Dragones Blanco poured short to let the herbaceous sugar dominate. A mint sprig on top and a red prickly-pear slice for color contrast.",
}

let count = 0
for (const [slug, note] of Object.entries(NOTES)) {
  const { data: c } = await admin
    .from('cocktails')
    .select('id, name')
    .eq('workspace_id', ws.id)
    .eq('slug', slug)
    .maybeSingle()
  if (!c) { console.warn(`! ${slug} not found`); continue }
  await admin.from('cocktails').update({ tasting_notes: note }).eq('id', c.id)
  console.log(`✓ ${c.name}`)
  count++
}
console.log(`\n✓ ${count} tasting notes rewritten`)
