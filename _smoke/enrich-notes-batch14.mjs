// Batch 14: final 27 enriched tasting notes (all remaining with ≥3 ingredients).
import { createClient } from '@supabase/supabase-js'
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const { data: ws } = await admin.from('workspaces').select('id').eq('slug', 'casa-dragones').maybeSingle()

const NOTES = {
  nirvana:
    "Omar Terriquez's cinnamon-tea coupe — house herbal tea infused with cinnamon, agave syrup rounding the sweetness, lemon for tightness. Casa Dragones Blanco at the spine. A single purple flower on top. Low-ABV and calming.",
  'dragones-tropical':
    "A coconut-epazote Old Fashioned — eight epazote leaves muddled with two raspberries and four tablespoons of sugar, coconut water stretching the whole thing long, lime for brightness. Casa Dragones Blanco up front.",
  'dragon-lady':
    "A gunpowder-tea coupe — Ilegal Añejo adding mezcal smoke to the Blanco base, lemon-gunpowder-tea-infused Montanaro Bianco for bittersweet herbal depth, Fee Bros Chocolate Bitters and a dropper of grapefruit tincture tying the whole thing together.",
  coa:
    "A punch-ratio Negroni — 8 oz each of vermouth and Campari with just 2 oz of Casa Dragones Blanco, a bar-spoon of agave and a dash of Green Chartreuse finishing. Designed for sharing; grapefruit peel across the top.",
  'nieves-de-volcan':
    "Simon Alberti's vanilla-chipotle coupe — house vanilla-and-chipotle syrup threads smoky-sweet heat through a grapefruit-Blanco frame. Sunflower seeds or hibiscus flowers on top for olfactory lift.",
  'sixteen-dragons':
    "Azhanty Dokins's pineapple-mamey coupe — mamey-pulp agave syrup over cucumber purée and macerated pineapple, Agavero liqueur and a splash of vodka rounding the complexity. Casa Dragones Blanco up front. Pineapple slices and pansy flower on top.",
  marietas:
    "A fig-and-Chambord coupe — Chambord threading dark-berry depth through the Blanco, two dashes of orange bitters tying it together, lemon tightening the frame. Fig foam crowns the top for a sweet-aromatic finish.",
  '16th-reason':
    "An hibiscus-strawberry-ginger sour — Campari infused with hibiscus flower for deep pink bitter-floral depth, strawberry purée and honey-ginger syrup balancing, lemon keeping the frame taut. Named for Casa Dragones' 16 Reserva.",
  'don-t-push-meche':
    "A clarified passion-fruit highball — house passion-fruit clarification gives a crystal-clear presentation, vanilla and Pedro Ximénez nectar threading warm raisined-sweet depth, soda water stretching. Casa Dragones Blanco structural. Kumquat or goldenberry on top.",
  'michelada-primaverde':
    "Jim Meehan's savory take on the Michelada — tequila meets tomatillo and jalapeño, brightened by lemon and softened with Victoria lager over salted ice. A bar Michelada, served with sal de gusano on the rim.",
  'atardecer-en-san-miguel':
    "Oswaldo Islas's tropical sunset coupe — two ounces of pineapple juice layered with house chile syrup for warm heat, vermouth and ginger adding aromatic depth, lemon and simple tightening. Casa Dragones Blanco up front.",
  shamrock:
    "Fabiola Padilla's cucumber-pineapple coupe — fresh cucumber and pineapple juices for clean green body, St-Germain threading elderflower lift, lemon and agave tightening. An edible clover, basil, or chamomile flower on top.",
  'pear-dragon':
    "A pear-chamomile coupe — house chamomile syrup over fresh pear juice, lemon for tightness, an eighth-teaspoon of mole paste finishing the unexpected chocolate-chile warmth. Casa Dragones Blanco structural.",
  'martini-16':
    "A peach-Cocchi martini — peach liqueur and Cocchi Americano layered in tablespoon pours, house 'Martini 16' vermouth threading bittersweet depth. Casa Dragones Blanco up front at 1.75 oz.",
  'cadillac-margarita':
    "The upgraded classic — Grand Marnier replacing Cointreau for cognac-orange depth, Casa Dragones Reposado swapped in for Blanco, lemon instead of lime. Served on the rocks with an optional lime wheel.",
  'dragones-tiki':
    "A tequila-Amaretto tiki highball — Amaretto Disaronno for almond-nut depth, honey water for light sweetness, a pineapple mix for tropical body. Casa Dragones Blanco structural. Long, cold, slightly saccharine.",
  'essence-of-san-miguel':
    "An Italicus-ginger coupe — Italicus bergamot liqueur split with ginger-infused Limoncello, grapefruit and lemon juices balancing. Casa Dragones Blanco at the core. Edible flowers on top.",
  'spring-clericot':
    "A white-wine Clericot — Bouquet Garni wine over green melon juice and sparkling water, Casa Dragones Blanco threading agave through the botanical-fruit base. Melon spheres and a cucumber slice crown the wine glass.",
  kiwi:
    "A sake-kiwi apéritif — Junmai sake for clean dry body, house kiwi cordial for tart-sweet green-fruit depth. Casa Dragones Blanco up front. Served up in a Nick & Nora with a fresh kiwi cube.",
  summer:
    "A cucumber-grapefruit-soda highball — house cucumber cordial and St-Germain over lime, grapefruit soda stretching it long. Casa Dragones Blanco structural. Served in a coupe with a salt rim.",
  'nueva-guardia':
    "Casa Dragones Blanco infused with cinnamon via siphon, layered with honey syrup, lime, and tonic water. Long, spiced, and remarkably dry. Honey-and-pepper salt rim finishes the finish.",
  'paloma-medi-mex':
    "A Mediterranean Paloma — Aperol adding Italian bittersweet orange to a classic Blanco-lime-agave frame, soda water stretching it long. The Paloma gets a summer-in-Rome accent.",
  'flor-de-dragon':
    "José Luis León's Día de Muertos coupe — house purée of fig and cempasúchil (marigold) flower petals, green-apple and lime juices for tightness, cempasúchil petals crowning the coupe. Casa Dragones Blanco structural.",
  'mexpresso-martini':
    "José Luis León's Mexican Espresso Martini — fresh espresso over a house coffee liqueur (Frangelico, Kahlua, Cynar, amaretto, cacao), Casa Dragones Añejo Barrel Blend at the base. Orange zest expression across the top. Drinks dessert-dark.",
  'old-mizunara':
    "A Cherry Heering Old-Fashioned on Reposado Mizunara — coffee-infused simple syrup threading roasted depth, Cherry Heering adding dark-fruit sweetness, three dashes of Angostura tightening the bitter finish. Orange peel and a coffee bean on top.",
  dragoni:
    "A Fino-sherry Martini — 2.75 tbsp of Fino Sherry Tio Pepe layered with house vermouth and Maraschino liqueur, lemon tightening. Casa Dragones Blanco at 1 oz. Stirred over ice, served up.",
  alazan:
    "A Mandarine-Napoléon stirrer — equal ounces of Blanc vermouth and Mandarine-Napoléon liqueur frame Casa Dragones Añejo, five drops of Dashfire Clove Bitters adding warm spice. Spiraled orange peel and cloves on top.",
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
