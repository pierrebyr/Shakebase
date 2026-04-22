// Batch 8: 20 enriched tasting notes.
import { createClient } from '@supabase/supabase-js'
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const { data: ws } = await admin.from('workspaces').select('id').eq('slug', 'casa-dragones').maybeSingle()

const NOTES = {
  'sun-also-rises':
    "A Maraschino-citrus coupe — grapefruit and lime frame a full half-ounce of Maraschino liqueur, Casa Dragones Blanco up front. Smells like marzipan, tastes taut and dry.",
  'dos-dragones':
    "A dragon-fruit yuzu Last Word riff — 60 g of diced pitaya muddled with basil leaves and yuzu juice, Yellow Chartreuse threading herbal sweetness, agave nectar rounding it out. Maguey-worm salt on the rim for savory, earthy punctuation.",
  janitzio:
    "An Old-Fashioned with a corn-smut twist — white vermouth infused with huitlacoche layered over cold brew, a single orange-liqueur ice cube slowly melting in. Casa Dragones Blanco carries the base. Smoky-earthy-coffee.",
  'carmines-seduction':
    "Kingston Chan's Paloma-Americano — Bruto Americano and hibiscus-prickly-pear syrup flank a grapefruit-lemon frame, Topo Chico stretching it long over two muddled sweet peppers. Served in a highball over one large cube with a prickly-pear wheel and cactus flower.",
  'ultimate-margarita':
    "Miguel Espinoza's purist Margarita — 2:1:1 Blanco-Cointreau-lime, simple syrup to taste. No shortcuts, no adornments. The benchmark.",
  'golden-margarita':
    "A savory-herbal Margarita — Equipos Navazos Manzanilla sherry for flor-dry salinity, Zirbenz Stone Pine for alpine-resinous depth, two ounces of tomato water stretching it long. Casa Dragones Blanco keeps the agave at the core.",
  'el-rey-de-la-cueva':
    "Andrew Maurer's caraway-pepper sour — a full ounce of Akvavit threading bread-seed warmth, Sichuan pepper tingling the finish, salt and lime anchoring the frame. Casa Dragones Blanco up front. Grapefruit wedge for aromatic lift.",
  'pichon-dragon':
    "A minimalist passion-fruit sour — just passion fruit purée, lime, and four dashes of orange bitters over two ounces of Blanco. Four ingredients, clean lines, tropical without going sweet.",
  'flip-in-the-dark':
    "Andrew Maurer's whole-egg flip — Yellow Chartreuse and Amaro Montenegro split for herbal-bitter body, demerara syrup for rich caramel sweetness, one whole egg giving the coupe its weight. Nutmeg grated on top.",
  'mia-coco':
    "Alejandro Blanco's Mojito cousin — eight mint leaves muddled with sugar and lime, a raspberry and blackberry for color, St-Germain adding elderflower. Coconut water stretches the whole thing long over Casa Dragones Blanco. A mint sprig and berries crown it.",
  'pinapple-margarita':
    "A pineapple Margarita with the frame set dry — pineapple gomme syrup for rich tropical sweetness balanced by agave syrup and a full ounce of fresh lime. Cointreau for the orange bridge. Served on the rocks with a lime wheel.",
  'el-mexicano':
    "Guadalupe Murillo's Mexican Negroni — Ancho Reyes' poblano chile heat replaces Campari, Cinzano Rosso stays as the sweet vermouth. Casa Dragones Blanco is the spirit base. Half slice of dehydrated grapefruit for aromatic lift.",
  'ford-perfect':
    "Tynan Craygraft's apricot-mezcal sour — Rothman's winter apricot liqueur brings stone-fruit depth, mezcal and Cynar both add smoke and bitter on top, Casa Dragones Blanco structural. A lime twist completes the whole thing.",
  'highball-de-otono':
    "José Luis León's autumn highball — 30 ml each of Blanco and Oloroso sherry stretched long with 150 ml of apple cider. Stirred in the glass over ice, apple slices floating on top. Low-alc, dry, orchard-warm.",
  'royal-sour':
    "Miguel Espinoza's Royal Tawny port sour — fresh ginger syrup adds warm spice, lime for tartness, one egg white for silk, a trace of sparkling water for lift. Casa Dragones Blanco stays clean through the Port's raisined depth.",
  'entre-flores-nos-reciben':
    "A marigold-mandarin flip — two full ounces of mandarin juice layered over aquafaba for silk, two tablespoons of marigold jam giving the drink its deep-orange color and floral-honey finish. Marigold flower and dried mandarin-peel candy on top — Día de Muertos altar in a glass.",
  'hereje-de-hierbas-poblanas':
    "Martha Ortiz's herbal-smoke coupe — Casa Dragones Blanco with a house herbal liqueur, lemon-tea and mint infusions threading green aromatics, agave honey rounding it out. Dry ice clouds the surface on service, three green grapes muddled at the bottom.",
  'margarita-anatol':
    "Alejandro Blanco's salt-foam Margarita — two tablespoons of Colima sea-salt foam crown the drink instead of a rim, lime peel aromatics lift the top, orange liqueur and simple syrup balance the lime. Grated lemon peel finishes the savory-citrus arc.",
  'l-avant-garde':
    "Antoine Hodges's charcoal Last Word — equal parts Blanco, Cappelletti, Yellow Chartreuse, and lime with a half-barspoon of activated coconut charcoal turning the drink black. Two dashes of orange bitters. Red rose petals on top — a Last Word gone goth.",
  'el-deseo':
    "Kevin Romero's Prosecco sour — macerated green grapes muddled into a lime-simple frame, Prosecco stretching it long. Casa Dragones Blanco keeps the base clean. Light, bright, green-gold.",
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
