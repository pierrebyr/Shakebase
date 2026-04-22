// Batch 12: 20 enriched tasting notes.
import { createClient } from '@supabase/supabase-js'
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const { data: ws } = await admin.from('workspaces').select('id').eq('slug', 'casa-dragones').maybeSingle()

const NOTES = {
  'freedom-charter':
    "Falcinelli, Castronovo & Petraske's stone-fruit sour — Maraschino and nectarine juice for almond-and-peach depth, Aleppo pepper dusted on top for fruity heat, salt to taste. Casa Dragones Blanco structural. Spice-dusted nectarine slices on the rim.",
  'poblano-escobar':
    "Julian Cox's pineapple-poblano sour — three deseeded poblano rings and two pineapple pieces muddled with agave nectar, Combier Triple Sec for orange depth, lemon tightening, a pinch of ground cumin on top. Casa Dragones Blanco up front.",
  'midnight-ponche':
    "Yana Volfson's winter-punch coupe — Laird's Apple Brandy for orchard oak warmth, Velvet Falernum threading allspice-almond, lime for acid. Casa Dragones Blanco keeps the structure. Drinks like hot cider gone cold.",
  'be-mine':
    "José Luis León's Valentine's strawberry-watermelon coupe — 30 ml of Zinfandel rosé stretches the tequila base, strawberry and watermelon juices for fruit body, lemon and simple balancing. Mint sprig on top.",
  'skinny-margarita':
    "Fabiola Padilla's minimal Margarita — Cointreau split one-to-one with lime, Blanco up to 1.5 oz. No salt, no frills — the cleaner the pour, the better the balance. Named for its ABV, not its flavor.",
  craftsman:
    "Fabian García's lavender-orange highball — equal parts lavender and natural syrups over fresh orange juice, ginger beer stretching the whole thing long. Casa Dragones Blanco structural. Edible flower and orange twist on top.",
  'la-reina':
    "German Ortega's green-tomato cocktail — 1.7 oz of green tomato juice mixed with house 'Donnie vinaigrette' and petroleo mix, lemon tightening. Casa Dragones Blanco up front. Fresh pickles on the rim.",
  'in-love-with-the-mojo':
    "Isaac Grillo's mango-sage coupe — three fresh sage leaves muddled with house mango-mojito jam and coconut syrup, lemon tightening the sweetness. Casa Dragones Blanco carries agave through a tropical herbal frame.",
  'spicy-dragon':
    "Ryan Conklin's cilantro-cucumber heat shot — two cucumber slices muddled with four cilantro leaves, two drops of jalapeño tincture pulling the heat clean. Lime and simple for the sour frame. Fresno pepper rings and cilantro crown it.",
  'el-rey':
    "A Grand Marnier sour with aggression — 1.5 oz of Grand Marnier to 1 oz of Blanco, a full 2 oz of fresh lime bringing the whole thing taut. Served up in a martini glass with Fresno pepper rings and cilantro.",
  'the-dame':
    "A house jalapeño consommé (1 oz) split with dry vermouth and a bar-spoon of agave syrup, Casa Dragones Blanco structural. Comes out green-pale. A lime wheel on the rim.",
  'a-more-mexican-margarita':
    "Yana Volfson's Mandarin Margarita — mandarin-infused Triple Sec for the orange vector, orange-blossom water perfuming the top, mandarin-infused salt on the rim. Casa Dragones Blanco at 1.5 oz, lime at half.",
  'dragones-for-my-homies':
    "Amy Hampton's stripped-down Margarita — 2 oz of Blanco to 1 oz of lime, three-quarters of agave and a quarter of Cointreau. Simple, dry, served up with a lime wheel. The people's Margarita.",
  'it-s-like-candy':
    "Yana Volfson's tamarind-piloncillo coupe — Dolin Dry Vermouth for apéritif backbone, tamarind paste and piloncillo syrup for tart-caramel depth, lemon tightening. Drinks exactly like the Mexican candy it's named for.",
  'yes-peach':
    "Fabiola Padilla's peach-rhubarb coupe — rhubarb liqueur and peach purée threaded through lime and mint, Casa Dragones Blanco holding agave at the core. Summer in a glass.",
  'nido-de-dragon':
    "Mike Espinoza's aloe-Chartreuse coupe — 1⅓ oz of aloe vera juice for vegetal body, Green Chartreuse threading herbal lift, citric acid replacing citrus for precision. Casa Dragones Blanco up front. Clean, dry, botanical.",
  'spicy-margarita':
    "Yana Volfson's clean Spicy — a bar-spoon of fresh-pressed serrano juice folded into a classic 1.75:1:0.5 Blanco-Triple Sec-lime Margarita. Controlled, aromatic heat that draws the agave forward.",
  'dragones-velvet':
    "Jim Meehan's pumpkin-turmeric silk — 0.75 tsp of organic pumpkin purée over Velvet Falernum and skim milk, 0.125 tsp of ground turmeric for golden color, egg white for crown. A Halloween-to-Thanksgiving sipper.",
  'bandera-shot':
    "Jason Watson & Daniel Vazquez's flag shot — verdita (pineapple, cilantro, mint, serrano) in one shot glass, sangrita in another, Casa Dragones Blanco in the middle. Drink in sequence: green, white, red — the Mexican flag in three sips.",
  'silver-needles':
    "A chamomile-apple shrub sour — house green-pepper shrub made with chamomile and apple vinegar, fresh lemon, agave syrup, egg white for silk, a dash of Strega for saffron-gold aromatic. Thyme sprig and pink peppercorns on the crown.",
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
