// Batch 1: hand-written tasting notes for 15 well-known Casa Dragones cocktails.
// Focus: concrete flavor anatomy + one sentence of context (origin / why it works).
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
  'ginger-margarita':
    "Pujol's Mexico City bar team brightens the classic Margarita template with fresh ginger — the bite draws out the citrus and agave notes in Casa Dragones Blanco, while a hibiscus-salt rim adds earthy, tart depth.",
  'margarita-royale':
    "Yana Volfson's celebratory Margarita folds Champagne into a precise 1:¾:¾ frame — Casa Dragones Blanco holds its citrus and agave through the sparkle, Giffard Triple Sec keeps it bright, and the bubbles turn it into a toast.",
  stumblebee:
    "Jim Meehan's three-ingredient sour swaps simple syrup for honey and rims the glass with cracked black pepper — sweet, spicy, disarmingly simple. A lemon wheel keeps it honest, and a lemon wedge on the rim adds lift.",
  'margarita-al-pastor':
    "José Luis León's riff on the taqueria classic: pineapple, fresh herbs, serrano, and agave stand in for the trompo. Casa Dragones Blanco carries the 'taco mix' without getting lost — it tastes like drinking tequila and eating tacos at the same time.",
  'michelada-dragones':
    "Jim Meehan's bar-cocktail Michelada — dry vermouth and green tomato juice lend an umami backbone, jalapeño brings heat, and Mexican lager stretches the tequila into a light, savory long drink.",
  micheloma:
    "Pablo Pasti's Limantour house Michelada swaps tomato juice for Cynar — the artichoke-based amaro gives a vegetal bitterness that plays perfectly against grapefruit and lager. Pink salt and pepper on the rim finish the savory arc.",
  'casa-de-olla':
    "Jim Meehan's tequila-spiked iced coffee — cold brew meets poblano heat from Ancho Reyes, softened with sweetened condensed milk and a whisper of cinnamon. A café de olla in a rocks glass, with Blanco carrying the whole thing.",
  'pink-panther':
    "Enrique Olvera's bright, long Paloma — lime and grapefruit over agave syrup, with ginger ale adding sparkle and a Celery Shrub dash pulling the whole thing into savory territory. Casa Dragones Blanco keeps the agave clean and forward.",
  'dragones-rojo':
    "Natalie Curfman's L.A. take on the Hibiscus Highball — St-Germain floats elderflower over hibiscus, agave syrup ties the two together, and Casa Dragones Blanco stays crisp underneath. An orange twist expression finishes the whole thing with citrus oil.",
  'senor-martinez':
    "José Luis León's Añejo Martinez at Limantour — Casa Dragones Añejo Barrel Blend swapped into a classic Rosso-and-Maraschino frame, with chocolate bitters threading cocoa through the tequila's aged-oak spice. Stirred long, served cold, finished with an orange-peel aromatic.",
  'la-catrina':
    "Jim Meehan's Day-of-the-Dead flip — rice-and-cacao agua fresca meets Ancho Reyes Chili Liqueur over Blanco, bound together by a whole egg and a pinch of pepita paste. Silky, spiced, and structurally unusual: an edible altar in a glass.",
  rococo:
    "Yana Volfson's warming winter pour — Casa Dragones Añejo Barrel Blend steeped into a hot chocolate of whole milk, heavy cream, cinnamon water, and chocolate dust. Cacao and agave share the spotlight, with canela water giving the finish its backbone.",
  'crypto-tonic':
    "Yana Volfson's low-alc aperitif — Ancho Verde adds green-chile heat, dry vermouth stays botanical, and tonic water stretches Casa Dragones Blanco into something that drinks like a white-wine spritz with a jalapeño edge.",
  'dragon-ashes':
    "Elena Reygadas & Johan Valderrabano's berry-and-vanilla highball — muscatel plum, black currant, and raspberry muddled with cassis and vanilla paste, stretched with tonic and lifted with rosemary. Casa Dragones Blanco holds the structure while the fruit goes dark and aromatic.",
  'como-fresas':
    "Carlos Marquez's Texas strawberry sour — Fraise des Bois wild-strawberry liqueur layered over macerated fresh strawberries, brightened with lime and sweetened with agave nectar. Casa Dragones Blanco keeps the agave thread running through the whole thing.",
}

let count = 0
for (const [slug, note] of Object.entries(NOTES)) {
  const { data: c } = await admin
    .from('cocktails')
    .select('id, name')
    .eq('workspace_id', ws.id)
    .eq('slug', slug)
    .maybeSingle()
  if (!c) {
    console.warn(`! ${slug} not found`)
    continue
  }
  await admin.from('cocktails').update({ tasting_notes: note }).eq('id', c.id)
  console.log(`✓ ${c.name}`)
  count++
}
console.log(`\n✓ ${count} tasting notes rewritten`)
