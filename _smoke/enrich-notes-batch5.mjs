// Batch 5: 20 enriched tasting notes.
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
  'callejon-del-beso':
    "Mango syrup over nopal cordial brings tropical-cactus sweetness to Casa Dragones Blanco, with two drops of Thai tincture (lemongrass-chili) sneaking heat into the finish. A silky, sun-warm coupe.",
  'fake-sauvignon':
    "José Luis León's Blanco-in-sherry's-clothing — Fino's flor-dry backbone layered over green-grape and pear juices tricks the palate into white-wine territory. Stirred clean in a mixing glass, slice of pear on top.",
  'summer-clericot':
    "A Mexican Clericot — Fino sherry split 1:1 with Blanco, cucumber juice and aloe vera stretching it long, rosemary syrup threading pine, lime for bite. Served with lime wheels and peppermint leaves — garden in a glass.",
  'margarita-de-albahaca':
    "Hugo Guerrero's basil-Xtabentún Margarita — the Yucatecan honey-anise liqueur carries sweetness, fresh basil leaves muddled hard add herbal lift, lime and basil syrup keep the whole thing taut. Drinks like a green Margarita with a Mayan accent.",
  'purple-flower-with-dragons':
    "Berenice Morales' sister drink to Purple Flowers — butterfly-pea tincture turns the base electric blue, grapefruit oleo and Limoncello tilt it violet, egg white crowns it. Garnished with a grapefruit twist and Italian amarena cherries on the stem.",
  'a-todos-santos':
    "A Day-of-the-Dead long drink — house chocolate atole layered with orange-blossom sorbet, lemon juice for brightness, Blanco carrying agave underneath. Orange zest and a dusting of powdered sugar finish it like a dessert.",
  'el-jardin':
    "A cucumber-mint garden highball — guava nectar for tropical sweetness, a house mint-cucumber shrub for vinegar-vegetal bite, four drops of Peychaud's tinting the drink rose. Clean, long, and cold in a Collins glass.",
  primavera:
    "Yana Volfson's spring Margarita riff — Casa Dragones Blanco infused with vanilla bean, Giffard Triple Sec for bright orange, fresh rhubarb juice bringing tart pink color, lime tightening the whole thing. A coupe that drinks like the first warm week of May.",
  'perfect-pear':
    "A pear-and-bergamot stirrer — Bergamotto liqueur meets Cocchi Americano's quinine edge, pear liqueur doubling down on orchard-fruit sweetness, Casa Dragones Blanco keeping the drink from collapsing into syrup. Heart-shaped lemon peel as garnish.",
  'marcos-margarita':
    "A bartender's choice Margarita — Blanco, Cointreau, fresh lime, salt rim if you want it. Exactly the classic frame, nothing else. A calibration drink.",
  'green-dragon':
    "Yana Volfson's three-ingredient Blanco Daiquiri — key-lime juice for sharp acid, agave nectar for balance, Casa Dragones Blanco up front. Nothing to hide behind — the drink lives or dies on pour accuracy.",
  'mia-margarita':
    "A tropical Margarita — fresh passionfruit for tart-floral depth, honey replacing agave syrup, a blood-orange wheel and shichimi togarashi for heat and smoke on the finish. Drinks like late summer in Oaxaca.",
  'market-margarita':
    "A farmers'-market Margarita — a house piña-cilantro purée layered with a splash of serrano chile purée, lime and simple keeping the balance. Casa Dragones Blanco carries the pineapple-herb-chile architecture without getting lost.",
  'el-clasico':
    "Oswaldo Islas's gingered Limoncello Margarita — two ginger slices muddled into artisanal Limoncello, lime for tightness, a trace of natural syrup to round. Casa Dragones Blanco keeps the agave spine straight.",
  'rise-and-shine':
    "A tequila cold brew — Jack's Stir Brew coffee cold brew layered with macadamia nut milk and agave syrup, Casa Dragones Blanco up front. Three coffee beans float the foam. Breakfast in a highball.",
  'green-sunset':
    "A green prickly-pear long drink — pitaya purée with a sake split, lemon and simple for balance, Casa Dragones Blanco holding the base. Basil, dill, and mint muddled in for a full green-herb aromatic.",
  'marco-s-mexican-margarita':
    "The classic house-Margarita frame — Blanco, Cointreau, fresh lime, salted rim. Nothing else. Served on rocks in an old-fashioned glass.",
  'the-dragon-sparkler':
    "Leo Robitschek's holiday highball — Amontillado sherry folded into Casa Dragones Blanco, cinnamon and lemon threading the drink, Champagne stretching it long. A lemon wheel and cinnamon stick float on top — New Year's Eve in a glass.",
  'roses-are-red':
    "A Rose-and-grapefruit Prosecco sipper — Combier Pamplemousse Rose for pink-grapefruit liqueur, lemon for bite, Prosecco stretching it brut, Casa Dragones Blanco keeping the agave thread. Served in a chilled martini glass.",
  'la-estrella':
    "A Canton-ginger Blanco Daiquiri — lime and agave for the sour frame, Canton Ginger Liqueur for ginger-honey depth. Candied ginger and a sugar rim for garnish — dessert in a coupe.",
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
