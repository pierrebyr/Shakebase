// Batch 11: 20 enriched tasting notes.
import { createClient } from '@supabase/supabase-js'
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const { data: ws } = await admin.from('workspaces').select('id').eq('slug', 'casa-dragones').maybeSingle()

const NOTES = {
  'not-another-negroni':
    "Alex Kitzmann's three-ingredient white Negroni — Dolin Blanc for dry floral vermouth, Grand Poppy for California herbal-bitter depth. Casa Dragones Blanco at the base. Stirred over a single large cube.",
  aphrodisia:
    "Scott Villalobos's chocolate-citrus sour — equal ¼-ounce pours of grapefruit, lime, and lemon juices over white-cacao liqueur and vanilla syrup, three dashes of chocolate extract threading cocoa through the finish. Passion fruit rounds out the tropical edge.",
  dtla:
    "Yana Volfson's low-alc Nick & Nora — Carpano Bianco for apéritif sweetness, Velvet Falernum threading allspice-almond, eight drops of absinthe perfuming the top, lime tightening the frame. A Queen Anne's dill leaf finishes the garden-herbal brief.",
  'anna-bananna-paleta-rica':
    "A paleta (lime-popsicle) cocktail — one Paleta Limón muddled with agave syrup and lime juice, Giffard Banane du Brasil threading tropical-banana depth over Casa Dragones Blanco. Salt-of-the-worm (sal de gusano) on the rim for the earthy finish.",
  'sandia-cool':
    "Oswaldo Islas's watermelon summer coupe — 2 oz of watermelon juice stretched with pineapple liqueur and lemon, agave syrup rounding the sweetness. Casa Dragones Blanco keeps the agave underneath the melon.",
  'el-cantaro':
    "Thomas Meyrieux's savory olive-thyme highball — two bunches of fresh thyme muddled hard with two pitted green olives, three dashes of celery bitters, lemon for tightness, tonic water stretching it long. Casa Dragones Blanco up front. Drinks like a botanical Martini with a twist.",
  'margarita-colorada':
    "A red-chile-and-pineapple maceration over citric honey — 1.5 oz of house chile-pineapple maceration gives the drink deep sunset color, Casa Dragones Blanco carries agave underneath. Rim with volcanic salt.",
  'la-aguacatona':
    "An avocado cocktail — eight avocado slices muddled with agave syrup, lemon, and pineapple juice, Casa Dragones Blanco shaken through. Comes out silky-green. Lemon twist and a sprinkle of ground black pepper finish the savory edge.",
  'el-increible-hulk':
    "Julian Cox and Jorge Vallejo's green-tomatillo coupe — one tomatillo muddled with a handful of cilantro and a serrano slice, Green Chartreuse threading herbal-sweet, lemon and simple for the frame. Drinks vegetal-green, looks radioactive.",
  'fig-garden':
    "A fig-and-cinnamon Manhattan — 1 oz of house cinnamon-fig syrup layered with Vermouth Rosso, Casa Dragones Blanco holding spirit weight. Stirred long, served coupe-cold. A fig on the rim if you're feeling decorative.",
  'pantera-rosa':
    "Enrique Olvera and Jim Meehan's grapefruit highball — lemon and grapefruit juices split 3:2 over agave honey, two drops of Bittermens Celery Shrub adding vegetal bite. Casa Dragones Blanco at the spine. Half lemon on top — Pink Panther, as promised.",
  'love-potion':
    "Yana Volfson's cacao-Damiana coupe — Damiana liqueur for Mexican aphrodisiac folklore, Giffard Crème de Cacao for chocolate depth, Suze for gentian bitter-edge, coffee-infused Carpano Bianco finishing the aperitif bitterness. A white-chocolate polka-dotted heart on top — camp, intentional.",
  'cantaloupe-margarita':
    "John Jones's melon Margarita — house cantaloupe syrup for muskmelon sweetness, a half-ounce of brandy layered in for stone-fruit oak warmth. Lime keeps the Margarita frame. Cantaloupe melon ball, lime wheel, mint sprig for garnish.",
  'madre-de-dragones':
    "A frozen-dragon-fruit coupe — 'dragon eggs' of frozen pitaya melt into a lemon-St-Germain frame as you drink. Casa Dragones Blanco structural. Perfect for parties that need a conversation piece.",
  'basil-dragon':
    "A poblano-basil sour — 1.5 oz of house basil-and-pineapple syrup with Ancho Reyes' poblano heat, lemon for tightness. Drinks tropical-savory, herbal-sweet.",
  'the-obsidian':
    "Rael Petit's edible-charcoal coupe — cinnamon bark and star anise syrup layered with lime, a pinch of activated charcoal turning the drink obsidian-black, Prosecco stretching it long and giving it sparkle. An edible flower on the surface.",
  'the-micheloma':
    "Pablo Pasti's house Michelada — Cynar's artichoke-based bitterness layered with grapefruit juice, half a can of lager stretching it long, pink salt and pepper on the rim. Casa Dragones Blanco carries the agave thread through the savory arc.",
  'the-new-dragon':
    "A morita-Nixta coupe — morita chile's smoky heat threads through Nixta corn liqueur, grapefruit-infused vermouth rounding out, three dashes of black-lemon bitters tightening. Casa Dragones Blanco at the base. Chocolate, smoke, and corn in a coupe.",
  embrujo:
    "A xoconostle-lemongrass sour — two macerated xoconostle slices muddled with lemongrass syrup, egg white for silk, a drop of Angostura and an orange peel for aromatic finish. Casa Dragones Blanco structural.",
  'agua-fresca':
    "Katrina Paulino's cucumber-watermelon agua fresca — three cucumber slices and three watermelon cubes muddled in the shaker, lemon and agave tightening the balance. Casa Dragones Blanco poured long. Cucumber slice on the coupe rim.",
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
