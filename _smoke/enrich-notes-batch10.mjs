// Batch 10: 20 enriched tasting notes.
import { createClient } from '@supabase/supabase-js'
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const { data: ws } = await admin.from('workspaces').select('id').eq('slug', 'casa-dragones').maybeSingle()

const NOTES = {
  tuberose:
    "A house-distilled Martini — Casa Dragones Blanco paired with a tuberose-and-honey distillate and Lillet, stirred long over ice. Built on 1.75L Blanco bottles to reduce glass waste. Floral, dry, almost perfume-martini in character.",
  'milk-punch-dragones':
    "A clarified milk-punch Blanco — grapefruit and lime juices split with simple, rhubarb liqueur threading pink-bitter depth, coconut milk doing the clarification. Comes out bone-clear, silky, and long in a rocks glass over a transparent ice cube.",
  'the-red-dragon':
    "Nick Mantzaridis's Malbec spritz — Cointreau Noir's dark-orange depth layered with ginger syrup, Malbec wine adding tannic berry body, lemon keeping it taut, sparkling wine stretching it long. Casa Dragones Blanco holds the structure.",
  'almost-there':
    "A citrus-melon oleo coupe — house citrus and melon oleos layered with pineapple juice and Nixta corn liqueur, three dashes of chocolate bitters threading cacao underneath. Lime tightens the whole thing. Casa Dragones Blanco as the base.",
  'winter-flowers':
    "Jim Meehan's hot hibiscus toddy — 4½ oz of hot hibiscus tea over Casa Dragones Blanco, a quarter-ounce each of Benedictine and Jack Rudy Grenadine threading herbal-pomegranate warmth. Served in a mug.",
  'spruce-and-tequila-spritz':
    "A spruce-tip spritz — house spruce-tip cordial for piney-resinous depth, Cocchi Americano for quinine-bittersweet, lemon for brightness. Casa Dragones Blanco up front. A sprig of pine on top completes the alpine brief.",
  'agave-daikiri':
    "Sergio García's blood-orange Daiquiri — 60 ml of blood orange juice frames a classic lime-and-Maraschino sour, Casa Dragones Blanco in place of rum. Mint and a blood orange slice for garnish.",
  chameleon:
    "Mundo Delgado's color-shifting coupe — blue chai tea meets clarified lime juice, Green Chartreuse and Combier Crème de Pamplemousse threading herbal-grapefruit depth. Casa Dragones Blanco at the base. Tilts purple as the lime hits the butterfly-pea.",
  'un-clavo-saca-otro-clavo':
    "Arturo Rojas's red-wine orange highball — two ounces of orange juice over a house red-wine concentrate spiced with warm winter fruits, house orange bitters tightening. Casa Dragones Blanco structural. Orange peel and a burnt apple leaf on the rim.",
  'coctel-pujol':
    "Yana Volfson's house Pujol — saffron-mango shrub for exotic-floral tartness, Dry Vermouth and Manzanilla sherry for flor-dry backbone. Casa Dragones Blanco up front. Saffron threads float on top for color and aromatic finish.",
  'dragon-flama':
    "Pablo Salas & Osvaldo Vázquez's smoked tiki-sour — three manzano chile slices and 50 g of roasted agave muddled with lychee pulp, lavender syrup threading floral, egg white for silk. Angostura and homemade orange-blossom bitters tighten the finish.",
  'calabacin-allende':
    "Three thin zucchini slices muddled with avocado syrup, lime, and a dash of Chartreuse — vegetal, silky, restrained. Casa Dragones Blanco at the base. An orange twist for aromatic lift.",
  'dragon-s-breath':
    "A habanero coupe — habanero chile powder dusted in to taste over a straight Blanco-lemon-agave sour, a smoked lemon-peel spiral finishing the drink. Heat is adjustable. Drinks simple and fiery.",
  'bonita-applebum':
    "A prickly-pear-elderflower coupe — house prickly-pear cordial for cactus-sweet body, St-Germain threading elderflower lift, lemon keeping the frame taut. Dill on top finishes the green-garden edge.",
  'jalisco-shrub':
    "Sean Kelly's watermelon-shrub coupe — 30 ml of house watermelon shrub for fermented fruit-vinegar depth, Cocchi Americano for apéritif bitterness, lime for tightness, jalapeño bitters dashing heat. Casa Dragones Blanco structural.",
  'hopped-dragon':
    "Jasin Burt's minimalist Old-Fashioned — dry vermouth and Licor 43 split for bittersweet vanilla-herbal depth, a single drop of Bittermens Hopped Grapefruit bitters tying the whole thing together. Casa Dragones Blanco front and clean. Orange twist.",
  'green-soup':
    "A celery-parsley sour — two celery sticks muddled with parsley syrup and grapefruit juice, Fino sherry and lime for dry-taut balance. Casa Dragones Blanco up front. Comes out green and unexpectedly savory.",
  'who-s-the-boss':
    "Jorge Sánchez's mango-vinegar coupe — a tiny 0.13 oz of sweet mango vinegar punctuates a pineapple-lemon-falernum frame. Casa Dragones Blanco up front. Tart, tropical, and quick.",
  'skinny-premium-dragones':
    "A Cointreau-heavy Margarita — a full 100 ml of Cointreau (nearly equal to the 60 ml of tequila) against 45 ml of fresh lime, an orange-juice splash rounding out. Skinny in name only.",
  rosita:
    "Pablo Mangialavori's Amaro-Aperol coupe — Amaro Averna and Aperol split for bittersweet orange depth, lime and lemon both kept at half-ounce for tightness, natural syrup and egg white binding. A Negroni-sour hybrid.",
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
