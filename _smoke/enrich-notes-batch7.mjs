// Batch 7: 20 enriched tasting notes.
import { createClient } from '@supabase/supabase-js'
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const { data: ws } = await admin.from('workspaces').select('id').eq('slug', 'casa-dragones').maybeSingle()

const NOTES = {
  'dragones-negroni':
    "A white-tequila Negroni — Lillet Blanc and Suze replace the sweet vermouth and Campari, pulling the drink into apricot-bitter-gentian territory. Casa Dragones Blanco at the base keeps the spine clean. Served over one large cube.",
  'volcan-de-fuego':
    "Omar Terriquez's minimalist ancho coupe — Yellow Chartreuse, ancho chile liqueur, and lemon juice each measured to a teaspoon, Casa Dragones Blanco carrying two full ounces underneath. A lemon twist. Spicy, herbal, and remarkably calm for a drink named after a volcano.",
  'altar-a-katya':
    "A horchata long-drink — house coconut horchata over Blanco, three drops of Chocolate Angostura stitching cacao into the rice-and-coconut sweetness. Long, creamy, and still agave-forward.",
  'jalapeno-cucumber-margarita':
    "Ryan Hollowell's spicy Margarita — two slices of fresh jalapeño and one of cucumber muddled hard with orange liqueur and a house sweet-and-sour mix. Casa Dragones Blanco stays up front. Lime wedge on the rim.",
  'alma-de-dragon':
    "Allan Andrew's star-fruit cooler — half a kiwi and three star-fruit slices muddled with lemon, agave syrup and Blanco shaken through. Double-strained and served with two star-fruit stars on top.",
  'cream-of-the-crop':
    "A citrus-cream coupe — lemon and orange juices over egg white and a half-ounce of heavy cream, agave syrup binding. Casa Dragones Blanco keeps the whole thing from tipping into a dessert. Grated orange zest across the foam.",
  rojo:
    "A hibiscus-pineapple long coupe — equal parts Blanco and hibiscus tea stretched with pineapple and lemon. Finishes bright, floral, and medium-dry. Hibiscus flower and basil leaf on top.",
  'el-16':
    "José Luis León's low-ABV Reserve — Casa Dragones Blanco over chamomile-infused white vermouth and Sacrum Oil, green lemon juice for tartness, two green grapes muddled in the bottom. Restrained, herbal, and elegant.",
  'double-dragon':
    "Andrew Maurer's tropical-bitter coupe — coconut milk and pear juice for creamy orchard-tropical body, Crème de Banane doubling down on the tropical, Fernet Vittone cutting hard bitter-mint through the whole thing. Casa Dragones Blanco keeps it agave-honest.",
  'purple-dragon':
    "A color-shifting blended coupe — pure dragon fruit and guanabana purées over Blanco, Cream of White Cocoa for silk, star-anise syrup threading licorice through the tropical fruit, lime for brightness.",
  cupaima:
    "Oscar Valle & Jeff Bell's minimalist Reserve — equal half-ounces of Yellow Chartreuse and Ancho Reyes flank Casa Dragones Blanco, two drops of house nopal bitter finishing the cactus thread. Served over one large cube.",
  'cosmo-not':
    "Jim Meehan's Cosmopolitan made right — Cocchi Rosa instead of cranberry for dry aperitif depth, Cointreau for bittersweet orange, lime keeping the frame taut. Casa Dragones Blanco replaces the vodka — all spirit, no syrup.",
  'sparkling-margarita':
    "Antanas Samkus's fluted Margarita — Grand Marnier swapping in for Cointreau, agave nectar for sugar, lime for tightness, Casa Dragones Blanco up front. Served in a flute with Seville orange slice and lava-black salt rim.",
  alias:
    "A floral-citrus equal-parts coupe — Cocchi Americano, Dry Curaçao, lime, and Casa Dragones Blanco at one ounce each, a splash of agave syrup and one of rose water perfuming the finish. Shake hard, fine-strain, one lime twist.",
  'spicy-suite':
    "Andrew Maurer's mulled-cider coupe — two ounces of house-mulled apple cider over ginger liqueur, lemon, and Casa Dragones Blanco. A tablespoon of cayenne-cinnamon dust goes on the rim. Candied ginger finishes the fall-in-a-glass brief.",
  'la-pinata':
    "Matthew Leatherman's habanero-cucumber sour — fresh cucumber muddled in the bottom, habanero agave honey adding controlled heat, lime for tightness, Casa Dragones Blanco running the spine. Cucumber ribbons and lime zest finish the summer-picnic feel.",
  'con-piquet':
    "Yana Volfson's low-alc cucumber cup — Pimm's for its herbal-bitter frame, ginger syrup for spice, lime for edge, Q soda stretching the whole thing long. Thinly sliced cucumbers on top finish the English-pub-in-Mexico setting.",
  'the-passionista':
    "A passion-fruit-mango sour — tropical-fruit purées layered with vanilla and honey syrups, mint leaves muddled for herbal lift. Drinks dessert-forward — pansy garnish and sipping straws make the brief explicit.",
  'pink-dragon':
    "Arturo Rojas's rose-tea highball — house rose tea and cranberry juice stretched with lemongrass tea, drops of pomegranate liqueur tinting the drink deeper. Casa Dragones Blanco keeps the base structured.",
  'kosmic-rita':
    "Jorge García's kombucha Margarita — equal parts Black Magic kombucha and agave syrup stretch the lime-Blanco sour into a fermented, funky long drink. Lime slice, no salt — the kombucha carries the umami.",
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
