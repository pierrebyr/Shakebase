// Batch 6: 20 enriched tasting notes.
import { createClient } from '@supabase/supabase-js'
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const { data: ws } = await admin.from('workspaces').select('id').eq('slug', 'casa-dragones').maybeSingle()

const NOTES = {
  'reinhold-mack':
    "Jared Fischer & Kris Baljak's hot Licor 43 toddy — Casa Dragones Blanco warmed with 2 oz hot water, Licor 43 threading vanilla-citrus sweetness, house grenadine for pomegranate depth. Four raspberries float on top.",
  'frozen-nopal-margarita':
    "Jorge Vallejo's nopal-ice-cream blend — one scoop of cactus-paddle ice cream whirled with Blanco and crushed ice into a slushy Old-Fashioned glass. Corn-leaf salt on the rim for a smoke-and-earth finish.",
  peek:
    "Rodo Rodríguez's violet-guava coupe — house violet liqueur for floral-sweet depth, guava syrup for tropical body, egg white for silk, Casa Dragones Blanco keeping the whole thing structured. Fresh violets on top to complete the perfume.",
  'pretty-in-pink':
    "Briggs Brown's pink Paloma — grapefruit liqueur and fresh grapefruit juice layered with lime and simple, a pinch of salt to tie the whole thing together. Casa Dragones Blanco stays bright. A grapefruit peel expression across the rim.",
  'dragones-coco':
    "The simplest tropical — 2 oz of Casa Dragones Blanco, fresh coconut water, a wedge of lime. Pour, stir, serve cold. Nothing needed on a hot day.",
  'water-for-chocolate':
    "A Mexican mole martini — one scoop of dark Mexican chocolate melted into almond milk, two slices of jalapeño or poblano muddled for heat, a bar-spoon of vanilla, Grand Marnier for bittersweet orange. Casa Dragones Blanco carries the base through the complex, edible-movie-title frame.",
  'corazon-de-flor':
    "Fat-washed Blanco meets cacao juice, grapefruit, and butterfly-pea-tea-with-Lillet for a color-shifting sour. Egg white for silk, lemon for tightness, honey sweetening the whole thing. Honey-drizzled on top as garnish.",
  toto:
    "A Mole Vermouth Manhattan — 1½ oz Casa Dragones Blanco, a full 1⅓ oz of mole vermouth, two drops of chocolate bitters. Stirred long, cold, finished with a mandarin twist. Tastes like a Mexican street-market bagged into a coupe.",
  'casa-diablo':
    "Jim Meehan's Dark & Stormy done in agave — East Imperial Ginger Beer and blackberry preserves meet lemon and agave syrup, Casa Dragones Blanco carrying the whole thing. A lemon wheel pinned to candied ginger and a blackberry for garnish.",
  'don-miguel':
    "A guava-and-ancho sour — pineapple-ancho shrub cutting through the guava purée, saffron-cardamom-orange bitters adding complexity, egg white for silk. Casa Dragones Blanco structural, rosemary sprig topping the whole thing Christmas-tree green.",
  'heart-of-the-dragon':
    "Dylan Godwin's Valentine's Day Hibiscus Margarita — two full ounces of hibiscus syrup give the drink Mexican-pink color, grapefruit liqueur for bittersweet depth, fresh lime for tightness. Grapefruit peel across the rim.",
  'maria-felix':
    "Nicole Beyries's rose-Combier coupe — fresh-squeezed lemon and Combier triple sec frame a rose syrup with Casa Dragones Blanco at the core. Restrained, silky, named for the actress.",
  'el-dragon':
    "Zach Twardowski's watermelon-jalapeño coupe — muddled fresh watermelon and jalapeño meet Casa Dragones Blanco and a house sweet-and-sour, a splash of soda for lift. Served with a chile-salt rim.",
  'pico-y-picante':
    "Bryan Canales's savory green coupe — a full 2¼ oz of cucumber-cilantro-jalapeño reduction over Blanco and lime, a dash of orange bitters cutting the herb. Drinks like gazpacho in a glass.",
  'cabo-nights':
    "Passion fruit, ginger, and a half-ounce of habanero blaze through a lime-Blanco sour — floral, tropical, and genuinely hot. One for people who mean it when they order spicy.",
  'a-rose-by-any-other-name':
    "Gui Jaroschy's bell-pepper-rose sour — house bell pepper shrub for vegetal tartness, rose-infused Dolin Blanc for floral depth, lime and simple for balance. Casa Dragones Blanco up front. Comes out pastel pink, tastes earth-and-flower.",
  'cielo-rojo':
    "Oscar Valle & Jeff Bell's Oaxacan sour — two dried and muddled chapulines (grasshoppers) thread umami-funk through a hibiscus-clove syrup, mole bitter tightening the chocolate edge, egg white giving it silk. One chapulín floats the foam.",
  'blanco-negroni':
    "Jim Meehan's agave Negroni — Lillet Blanc and Italicus Rosolio replace the sweet vermouth and Campari, pulling the drink into bergamot-quinine territory. Casa Dragones Blanco holds the spirit base. Served over one big ice cube with an orange twist.",
  'margarita-albahaca':
    "A basil Margarita — two sets of basil leaves (muddled + garnish), sugar replacing agave for a drier edge, lime and Cointreau for the classic frame. Casa Dragones Blanco underneath. Served over rocks with a final basil leaf.",
  'como-la-flor':
    "Juan Martínez's mezcal-split coupe — Casa Dragones Blanco meets half an ounce of mezcal for smoky depth, strawberry-hibiscus syrup for color and sweetness, elderflower liqueur for floral lift. A red rose on top — the Selena reference earns itself.",
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
