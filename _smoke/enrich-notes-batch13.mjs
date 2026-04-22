// Batch 13: 20 enriched tasting notes.
import { createClient } from '@supabase/supabase-js'
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const { data: ws } = await admin.from('workspaces').select('id').eq('slug', 'casa-dragones').maybeSingle()

const NOTES = {
  'hot-cold-toddy':
    "Yana Volfson's dual-temperature toddy — fresh-pressed lemongrass muddled with ginger and honey syrup, 4 oz of hot water stretching Blanco into a warm sipper, lemon tightening the finish. Served in a heat-proof mug.",
  'amatte-spritz':
    "Adrian Evans's pear-apple spritz — 1.5 oz of pear-and-apple purée for orchard body, Aperol threading bittersweet orange, rosemary syrup adding resinous herbal depth, Prosecco stretching it long. Two dashes of Angostura tie it up.",
  gema:
    "Mike Espinoza's minimalist three-ingredient coupe — equal parts Blanco and fresh honeydew juice, a half-ounce of lemon for tightness. Named for how it looks — a green jewel in a coupe.",
  'grass-is-greener':
    "A Green Chartreuse coupe gone garden — half a kiwi muddled into cucumber extract, lime and agave for tightness, egg white for silk, a single dash of olive oil threading savory finish. Casa Dragones Blanco structural.",
  recreo:
    "A prickly-pear cordial cocktail with a dill finish — St-Germain threading elderflower lift, lemon keeping the frame taut. Casa Dragones Blanco carries the agave underneath. Fresh dill on the rim.",
  'dragones-apple':
    "A low-alc orchard apéritif — 1.5 oz of house apple-and-pear syrup layered over Casa Dragones Blanco, Lillet and St-Germain threading floral-bittersweet depth. Served up. Drinks like fall in half a glass.",
  'dragon-unico':
    "Cesar Ponce's apple-peach coupe — Martini Blanco for dry vermouth backbone, apple and peach (durazno) juices for orchard sweetness, Casa Dragones Blanco up front. Green apple slice and raspberry on top.",
  quince:
    "A Royal Tawny port sour — 25 ml of Oporto Royal Tawny for raisined oak depth, house ginger syrup for warm spice, lime for tightness. Tequila pours short (10 ml) — port does the heavy lifting.",
  coquito:
    "Alejandro Blanco's coconut cream flute — D'Aristo Coconut Liqueur layered over coconut water and agave honey, lemon for brightness, Blanco carrying agave through. Fresh cherry and coconut slice finish the tiki-dessert frame.",
  'marquis-margarita':
    "Ameliana Kamstra's two-lime Margarita — the juice of two fresh limes cut with agave nectar and Cointreau, Casa Dragones Blanco at 2 oz up front. Pink Himalayan salt on the rim.",
  'dragones-spritz':
    "A smoked-chile spritz — house lemongrass syrup over lime and St-Germain, four dashes of smoked chili bitters threading warm heat, club soda stretching it long. Casa Dragones Blanco up front. Basil, pepper, cucumber, and sweet tomato drop for a garden garnish.",
  'la-serenidad':
    "Adam Baca's prickly-pear coupe — house chili-infused honey for warm-sweet depth, prickly-pear purée for fruit body, lime for tightness, a dash of lavender bitters threading floral finish. Drinks exactly as named.",
  'golden-margherita':
    "A Manzanilla-Stone-Pine savory Margarita — 2 oz of tomato water stretches the drink vegetal-salty, Zirbenz Stone Pine liqueur threading alpine-resinous depth, Navazos Manzanilla sherry adding flor-dry salinity. Casa Dragones Blanco at the core.",
  'margarita-recreo':
    "A three-ingredient basil Margarita — basil extract, citrus honey, and lime each measured to a quarter-ounce over 2 oz of Blanco. Fresh basil on top. Concentrated, bright, green.",
  huichol:
    "Rodo Rodríguez's chamomile-chai flute — 1.33 oz of chamomile-infused chai layered over Blanco, lime for tightness, hoja santa and macerated ginger muddled in the bottom. A burnt cinnamon stick on top finishes the warming aromatic.",
  'comdrade-dragon':
    "German Ortega's spicy-basil Old-Fashioned — a tablespoon of fresh ginger and two red peccorns muddled with Green Chartreuse and natural syrup, lime tightening, basil leaf finishing. Casa Dragones Blanco up front.",
  'citorn-au-jardin':
    "A fennel-garden coupe — Yellow Chartreuse, garden honey, and simple syrup layered with lemon and sparkling water, bronze fennel muddled at the base. Casa Dragones Blanco carries the spine. A fennel sprig on top.",
  'blood-orange-bliss':
    "Trevor Robson's Champagne blood-orange coupe — house blood-orange purée for deep-red body, agave syrup rounding, two drops of vanilla extract finishing the warm aromatic, Champagne stretching it long. Citrus wheel as garnish.",
  'dragon-al-atardece':
    "A mini-Negroni sour — Campari threading bittersweet red, two dashes of orange-and-black-lemon bitters adding complexity, lemon and simple for tightness. Casa Dragones Blanco up front. Served coupe-short.",
  'margarita-claro':
    "Oscar Escobar's clarified Margarita — clarified lime juice for crystal-clear presentation, ultra-premium orange liqueur for depth, Casa Dragones Blanco up front. A clean-looking Margarita that tastes exactly like the classic.",
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
