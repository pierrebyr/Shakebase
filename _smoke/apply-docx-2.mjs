// Apply the second trusted-source batch:
//   - 4 updates (Sacred Heart, Key Lime Pie, Café Merengue, El Clásico)
//   - 13 new inserts (Dragones Rocks + 12 bartender-contest entries)
//
// Run: node --env-file=.env.local _smoke/apply-docx-2.mjs

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const { data: ws } = await admin.from('workspaces').select('id').eq('slug', 'casa-dragones').maybeSingle()
const { data: products } = await admin.from('global_products').select('id, expression').eq('brand', 'Casa Dragones')
const pid = (expr) => products.find((p) => p.expression === expr)?.id

// Upsert helper — finds creator by name or creates a new one
async function getOrCreateCreator(name, extras = {}) {
  if (!name) return null
  const { data: existing } = await admin
    .from('creators')
    .select('id')
    .eq('workspace_id', ws.id)
    .ilike('name', name)
    .is('deleted_at', null)
    .maybeSingle()
  if (existing) return existing.id
  const { data: inserted, error } = await admin
    .from('creators')
    .insert({
      workspace_id: ws.id,
      name,
      role: 'Mixologist',
      city: 'Mexico City',
      country: 'Mexico',
      avatar_hue: 300,
      languages: ['Spanish', 'English'],
      ...extras,
    })
    .select('id')
    .single()
  if (error) {
    console.error(`! creator insert failed for ${name}:`, error.message)
    return null
  }
  return inserted.id
}

// ─── 1. UPDATES ──────────────────────────────────────────────────────
const UPDATES = [
  {
    slug: 'sacred-heart',
    venue: 'La Carlota',
    ingredients: [
      { amount_text: '1½ oz', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '½ oz', name: 'Vermouth infused with strawberries' },
      { amount_text: '½ oz', name: 'Mexican pixtle-infused liqueur' },
      { amount_text: '¼ oz', name: 'Crème de cacao blanc' },
      { amount_text: '¼ oz', name: 'Maraschino liqueur infused with rose' },
      { amount_text: null, name: 'Coconut flakes, for garnish' },
    ],
    method: [
      'Combine all ingredients except coconut flakes in a mixing glass with ice.',
      'Stir until well chilled.',
      'Strain into a chilled coupe.',
      'Dust the surface with coconut flakes.',
    ],
    glass_type: 'Coupe',
    garnish: 'Coconut flakes',
    flavor_profile: ['Fruity', 'Floral', 'Creamy', 'Sweet'],
    tasting_notes:
      "Yana Volfson's Strawberries-and-Cream riff from La Carlota (San Miguel) — a fresh, non-dairy take on the classic summer dessert. Strawberry-vermouth and rose-maraschino braid floral sweetness over Casa Dragones Blanco, pixtle liqueur grounds it savory-earthy, and coconut flakes dusted on top finish the cream illusion.",
  },
  {
    slug: 'key-lime-pie',
    venue: 'La Carlota',
    ingredients: [
      { amount_text: '1½ oz', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '½ oz', name: 'Cardamom triple sec' },
      { amount_text: '½ oz', name: 'Anise triple sec' },
      { amount_text: '¾ oz', name: 'Mexican lime juice' },
      { amount_text: '1', name: 'Free-range egg' },
      { amount_text: 'rim', name: 'Cookie crumble' },
    ],
    method: [
      'Rim a coupe with the cookie crumble.',
      'Combine all other ingredients in a shaker with ice.',
      'Shake hard until well chilled and frothy.',
      'Fine strain into the rimmed coupe.',
    ],
    glass_type: 'Coupe',
    garnish: 'Cookie crumble rim',
    flavor_profile: ['Citrus', 'Spicy', 'Sweet', 'Creamy'],
    tasting_notes:
      "Yana Volfson's Key Lime Pie in a coupe from La Carlota (San Miguel) — a delicious interpretation of the classic dessert with subtle citrus notes and a perfect balance of tart and sweet. Cardamom and anise triple secs fold warm spice into Mexican lime, a whole free-range egg gives the drink its silky crown, and a cookie-crumble rim finishes the pie illusion.",
  },
  {
    slug: 'cafe-merengue',
    venue: 'La Carlota',
    ingredients: [
      { amount_text: '1½ oz', name: 'Casa Dragones Reposado Mizunara', product: 'Reposado Mizunara' },
      { amount_text: '½ oz', name: 'Hoja santa piloncillo syrup' },
      { amount_text: '2 oz', name: 'Mexican coffee pour-over' },
      { amount_text: '½ oz', name: 'Vanilla bean-infused cream' },
    ],
    method: [
      'Brew a fresh Mexican coffee pour-over and let it cool slightly.',
      'Combine the tequila, hoja santa piloncillo, and coffee in a heat-proof glass or mug.',
      'Float the vanilla-bean-infused cream gently over the back of a bar spoon.',
    ],
    glass_type: 'Mug',
    garnish: 'None',
    flavor_profile: ['Creamy', 'Sweet', 'Herbal'],
    tasting_notes:
      "Yana Volfson's Mexican Irish Coffee from La Carlota (San Miguel) — organic coffee from Guadalajara poured over Casa Dragones Reposado Mizunara, sweetened with hoja-santa piloncillo, crowned with vanilla-bean-infused cream from a local dairy farm. A uniquely Mexican twist on the classic warm pour.",
  },
  {
    slug: 'el-clasico',
    venue: '—',
    ingredients: [
      { amount_text: '2 oz', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '1 oz', name: 'Limoncello' },
      { amount_text: '½ oz', name: 'Fresh lime juice' },
      { amount_text: 'dash', name: 'Simple syrup' },
      { amount_text: '2 slices', name: 'Fresh ginger' },
    ],
    method: [
      'Macerate the ginger slices in a cocktail shaker.',
      'Add the Casa Dragones Blanco, limoncello, lime juice, and a dash of simple syrup.',
      'Add ice and shake well.',
      'Double strain over fresh ice into an old-fashioned glass.',
      'Garnish with a lemon wheel.',
    ],
    glass_type: 'Old Fashioned',
    garnish: 'Lemon wheel',
    flavor_profile: ['Citrus', 'Spicy', 'Sweet'],
    tasting_notes:
      "Oswaldo Islas's gingered Limoncello Margarita — two ginger slices muddled into artisanal Limoncello, lime for tightness, a dash of simple syrup to round. Casa Dragones Blanco keeps the agave spine straight. Double-strained on the rocks with a lemon wheel on top.",
  },
]

for (const fix of UPDATES) {
  const { data: c } = await admin
    .from('cocktails')
    .select('id, name')
    .eq('workspace_id', ws.id)
    .eq('slug', fix.slug)
    .maybeSingle()
  if (!c) { console.warn(`! ${fix.slug} not found`); continue }

  await admin.from('cocktail_ingredients').delete().eq('cocktail_id', c.id)
  const ingRows = fix.ingredients.map((ing, idx) => ({
    cocktail_id: c.id,
    position: idx + 1,
    custom_name: ing.name,
    amount_text: ing.amount_text,
    global_product_id: ing.product ? pid(ing.product) : null,
  }))
  await admin.from('cocktail_ingredients').insert(ingRows)

  const methodSteps = fix.method.map((text, i) => ({ step: i + 1, text }))
  await admin
    .from('cocktails')
    .update({
      method_steps: methodSteps,
      glass_type: fix.glass_type,
      garnish: fix.garnish,
      flavor_profile: fix.flavor_profile,
      tasting_notes: fix.tasting_notes,
    })
    .eq('id', c.id)
  console.log(`~ ${c.name}`)
}

// ─── 2. NEW COCKTAILS ────────────────────────────────────────────────
const NEW = [
  {
    slug: 'dragones-rocks',
    name: 'Dragones Rocks',
    category: 'Signature',
    ingredients: [
      { amount_text: '2 oz', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '1', name: 'Large clear ice cube' },
    ],
    method: [
      'Place a single large clear ice cube in a rocks glass.',
      'Pour 2 oz of Casa Dragones Blanco over the ice.',
      'Express the oils from a fresh grapefruit twist over the surface and place it in the glass.',
    ],
    glass_type: 'Old Fashioned',
    garnish: 'Fresh grapefruit twist',
    flavor_profile: ['Citrus', 'Agave'],
    orb_from: '#f4efe0',
    orb_to: '#c9b89a',
    tasting_notes:
      'A bright, crisp agave profile on ice — 2 oz of Casa Dragones Blanco over a single large clear cube, a fresh grapefruit twist expressed on top. Structured for clarity and balance, nothing else to say.',
  },
  {
    slug: 'destino',
    name: 'Destino',
    creator: 'Julian Felix',
    category: 'Signature',
    ingredients: [
      { amount_text: '2 oz', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '½ oz', name: 'Lillet Blanc' },
      { amount_text: '½ oz', name: 'Zanamora (balsamic-sugar reduction)' },
    ],
    method: [
      'Combine all ingredients in a mixing glass with ice.',
      'Stir until well chilled.',
      'Strain into a chilled Nick & Nora glass.',
      'Decorate the surface with a chocolate-éter painting.',
    ],
    glass_type: 'Nick & Nora',
    garnish: 'Chocolate-éter painting',
    flavor_profile: ['Sweet', 'Bitter', 'Citrus'],
    orb_from: '#e5c9a1',
    orb_to: '#6a3a1a',
    tasting_notes:
      "Julian Felix's minimalist stirrer — Lillet Blanc and Zanamora (a house balsamic-vinegar-and-sugar reduction) split at half an ounce each, Casa Dragones Blanco carrying the spine. Served up in a Nick & Nora with a chocolate-éter painting on the surface as the visual signature.",
  },
  {
    slug: 'te-quiero-verde',
    name: 'Te Quiero Verde',
    creator: 'Maria Giribaldi',
    category: 'Sparkling',
    ingredients: [
      { amount_text: '¾ oz', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '¼ oz', name: 'Green Chartreuse' },
      { amount_text: '½ oz', name: 'Lime juice' },
      { amount_text: '½ oz', name: 'Chamomile syrup (1:1)' },
      { amount_text: '3', name: 'Hierbabuena leaves' },
      { amount_text: 'top', name: 'Champagne' },
    ],
    method: [
      'Prepare a 1:1 chamomile syrup by steeping chamomile flowers in equal parts sugar and water.',
      'Combine the tequila, Green Chartreuse, lime juice, chamomile syrup, and hierbabuena in a shaker.',
      'Shake with ice.',
      'Fine strain into a chilled coupe.',
      'Top with Champagne.',
      'Garnish with a chamomile flower.',
    ],
    glass_type: 'Coupe',
    garnish: 'Chamomile flower',
    flavor_profile: ['Herbal', 'Citrus', 'Sparkling', 'Floral'],
    orb_from: '#e8f2c7',
    orb_to: '#6d8a40',
    tasting_notes:
      "Maria Giribaldi's green Champagne sour — Green Chartreuse adds herbal-sweet lift to a lime-chamomile frame, three hierbabuena leaves muddle into the shake for mint-green aroma, Champagne stretches the whole thing into a sipper. A single chamomile flower on top.",
  },
  {
    slug: 'aromas-del-bosque',
    name: 'Aromas del Bosque',
    creator: 'Antonio Minarro',
    category: 'Sour',
    ingredients: [
      { amount_text: '50 ml', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '10 ml', name: 'Mint liqueur' },
      { amount_text: '15 ml', name: 'Ginger-orange syrup' },
      { amount_text: '15 ml', name: 'Agave nectar' },
      { amount_text: '10 ml', name: 'Egg white' },
      { amount_text: 'top', name: 'Tonic water' },
    ],
    method: [
      'Dry shake all ingredients except the tonic water.',
      'Shake again with ice and fine strain into a long-drink glass over fresh ice.',
      'Top with tonic water.',
      'Garnish with a rosemary sprig and citrus peels.',
    ],
    glass_type: 'Highball',
    garnish: 'Rosemary sprig, lime and orange peels',
    flavor_profile: ['Herbal', 'Spicy', 'Citrus', 'Sparkling'],
    orb_from: '#d8e7c4',
    orb_to: '#406b3b',
    tasting_notes:
      "Antonio Minarro's forest-aromatic long drink — mint liqueur and a house ginger-orange syrup layered over Blanco, egg white for silk, tonic water stretching it long. A rosemary sprig and citrus peels on top turn the glass into a little walk in the woods.",
  },
  {
    slug: 'conexion',
    name: 'Conexión',
    creator: 'Miguel Angel Gómez Núñez',
    category: 'Old Fashioned',
    ingredients: [
      { amount_text: '1⅔ oz', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '1⅔ oz', name: 'Limoncello Villa Massa (rested with basil)' },
      { amount_text: '½ oz', name: 'St-Germain elderflower liqueur' },
      { amount_text: '10 ml', name: 'Grapefruit juice' },
      { amount_text: '2 sprays', name: 'Yellow lemon essence' },
    ],
    method: [
      'Combine all ingredients in a mixing glass with ice.',
      'Stir until well chilled.',
      'Strain into an old-fashioned glass over a large ice cube.',
      'Finish with a burnt lemon peel aromatic.',
    ],
    glass_type: 'Old Fashioned',
    garnish: 'Burnt lemon peel',
    flavor_profile: ['Citrus', 'Herbal', 'Floral', 'Sweet'],
    orb_from: '#fdf2c0',
    orb_to: '#c0912d',
    tasting_notes:
      "Miguel Angel Gómez Núñez's citrus-elderflower stirrer — equal ounces of Blanco and basil-rested Limoncello Villa Massa, St-Germain threading elderflower lift, grapefruit juice and lemon essence tightening the top. Served over a large cube with a burnt lemon peel.",
  },
  {
    slug: 'jolla-16',
    name: 'Jolla 16',
    creator: 'Stella Joselyn Martinez Martinez',
    category: 'Martini',
    ingredients: [
      { amount_text: '1¼ oz', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '¾ oz', name: 'Sake Junmai (infused with tamarind and pink pepper)' },
      { amount_text: '3 drops', name: 'Balsamic vinegar Sciglás' },
    ],
    method: [
      'Combine the Casa Dragones Blanco and infused sake in a mixing glass with ice.',
      'Stir for 15 seconds.',
      'Strain into a chilled Nick & Nora glass.',
      'Add three drops of balsamic vinegar on top.',
      'Finish with an orange-peel aromatic spray.',
    ],
    glass_type: 'Nick & Nora',
    garnish: 'Orange twist',
    flavor_profile: ['Spicy', 'Umami', 'Fruity'],
    orb_from: '#e5d09a',
    orb_to: '#7a4a1c',
    tasting_notes:
      "Stella Joselyn Martinez Martinez's cross-cultural Martini — Junmai sake infused with tamarind and pink pepper pairs with Casa Dragones Blanco, three drops of balsamic vinegar on top add tart-sweet depth. An orange-peel aromatic seals the finish.",
  },
  {
    slug: 'corona-en-grasa',
    name: 'Corona en Grasa',
    creator: 'Tracy Eustaquio',
    category: 'Sour',
    ingredients: [
      { amount_text: '1¼ oz', name: 'Casa Dragones Blanco (fat-washed)', product: 'Blanco' },
      { amount_text: '¾ oz', name: 'Lemon juice' },
      { amount_text: '¾ oz', name: 'NOTA (herbal liqueur)' },
      { amount_text: '¼ oz', name: 'Coconut cream' },
      { amount_text: null, name: 'Fresh raspberry, muddled' },
      { amount_text: 'trace', name: 'Milk, ginger, hoja santa, black pepper, orange zest, apple-mint smoke' },
    ],
    method: [
      'Fat-wash the Casa Dragones Blanco by infusing with a neutral fat and freezing to clarify.',
      'Muddle a raspberry in the shaker.',
      'Add the fat-washed tequila, lemon, NOTA, coconut cream, and aromatic traces.',
      'Shake with ice.',
      'Fine strain into a rocks glass filled with ice.',
      'Finish with a salt strip, cracked black pepper, and a raspberry on top.',
    ],
    glass_type: 'Old Fashioned',
    garnish: 'Salt strip, black pepper, raspberry',
    flavor_profile: ['Fruity', 'Creamy', 'Herbal', 'Smoky'],
    orb_from: '#f5c9b8',
    orb_to: '#7a3034',
    tasting_notes:
      "Tracy Eustaquio's fat-washed savory sour — fat-washed Blanco carries an aromatic cloud of milk, ginger, hoja santa, black pepper, orange zest, and smoked apple-mint. Muddled raspberry adds fruit body, NOTA herbal liqueur and lemon tighten the frame. Salt strip, pepper, and a raspberry finish the glass.",
  },
  {
    slug: 'alta-r',
    name: 'Alta-R',
    creator: 'Jose Luis Martinez Martinez',
    category: 'Sour',
    ingredients: [
      { amount_text: '45 ml', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '15 ml', name: 'Guava-cacao-basil-agave-honey syrup (with cinnamon)' },
      { amount_text: '22.5 ml', name: 'Pineapple juice' },
      { amount_text: '22.5 ml', name: 'Lime juice' },
      { amount_text: '2 g', name: 'Sea salt' },
    ],
    method: [
      'Combine all ingredients in a shaker with ice.',
      'Shake hard for 15 seconds.',
      'Strain into an old-fashioned glass over a large ice cube.',
      'Garnish with a cempasúchil (marigold) flower.',
    ],
    glass_type: 'Old Fashioned',
    garnish: 'Cempasúchil flower',
    flavor_profile: ['Fruity', 'Spicy', 'Herbal', 'Citrus'],
    orb_from: '#f9c77b',
    orb_to: '#c2501f',
    tasting_notes:
      "Jose Luis Martinez Martinez's Día de Muertos sour — a house syrup of guava, cacao beans, basil, agave honey, and cinnamon threads tropical-spiced-sweet depth through a pineapple-lime frame. A 2-gram pinch of salt anchors the finish. Cempasúchil flower on top for the altar.",
  },
  {
    slug: 'caminos-al-mas-alla',
    name: 'Caminos al más allá',
    creator: 'Miguel Angel Gomez',
    category: 'Signature',
    ingredients: [
      { amount_text: '60 ml', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '20 ml', name: 'Amaretto liqueur' },
      { amount_text: '17 ml', name: 'Tuna-basil-agave cordial' },
      { amount_text: '17 ml', name: 'Casa Dragones infused with chamomile, basil, and orange peel' },
      { amount_text: '17 ml', name: 'Agave syrup' },
    ],
    method: [
      'Combine all ingredients in a mixing glass with ice.',
      'Stir until well chilled.',
      'Strain into a chilled Nick & Nora glass.',
      'Express orange peel oils over the surface and drop in.',
    ],
    glass_type: 'Nick & Nora',
    garnish: 'Orange peel',
    flavor_profile: ['Herbal', 'Sweet', 'Floral'],
    orb_from: '#f7cfb4',
    orb_to: '#8f4a1a',
    tasting_notes:
      "Miguel Angel Gomez's herbaceous stirrer — a house tuna (prickly-pear-basil-agave) cordial layered with a chamomile-basil-orange Casa Dragones infusion, amaretto adding nut-almond depth. Casa Dragones Blanco carries the spirit base. Served up in a Nick & Nora with an orange peel.",
  },
  {
    slug: 'mis-antepasados',
    name: 'Mis Antepasados',
    creator: 'Maria Giribaldi',
    category: 'Flip',
    ingredients: [
      { amount_text: '1½ oz', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '½ oz', name: 'Cacao-infused Ancho Reyes (sous-vide 10 min)' },
      { amount_text: '¼ oz', name: 'Pecan orgeat' },
      { amount_text: '2 dashes', name: 'Angostura Bitters (added in glass)' },
      { amount_text: '1', name: 'Whole egg' },
      { amount_text: null, name: 'Ground cacao, for garnish' },
    ],
    method: [
      'Toast the pecans, then soak in hot water and blend with equal parts sugar. Strain to make the orgeat.',
      'Ground and roast cacao nibs, then sous-vide with Ancho Reyes at 10 minutes.',
      'For a batched serving, combine 6× each ingredient amount plus 2 oz water for dilution in a carafe.',
      'Add two dashes of Angostura to a chilled rocks glass before service.',
      'Shake or stir the cocktail with ice, strain into the prepared rocks glass.',
      'Dust the surface with ground cacao.',
    ],
    glass_type: 'Old Fashioned',
    garnish: 'Ground cacao',
    flavor_profile: ['Sweet', 'Spicy', 'Creamy', 'Bitter'],
    orb_from: '#d9a26b',
    orb_to: '#3f1f0a',
    tasting_notes:
      "Maria Giribaldi's Reserve flip — pecan orgeat from toasted nuts, cacao-nib-infused Ancho Reyes (sous-vide), a whole egg binding the whole thing silky. Angostura goes in the glass before service, ground cacao dusts the top. A technical cocktail with ritual built into the method.",
  },
  {
    slug: 'yaya-pura',
    name: 'YaYa Pura',
    creator: 'Tracy Eustaquio',
    category: 'Sour',
    ingredients: [
      { amount_text: '1 oz', name: 'Casa Dragones Blanco (infused with lime zest)', product: 'Blanco' },
      { amount_text: '1 oz', name: 'Mango juice' },
      { amount_text: '¾ oz', name: 'Lime juice' },
      { amount_text: '½ oz', name: 'Syrup (onion-cumin)' },
      { amount_text: '½ oz', name: 'Milk' },
      { amount_text: '10 dashes', name: 'Mole bitters' },
      { amount_text: '3 slices', name: 'Cucumber' },
      { amount_text: null, name: 'Mango foam (for float)' },
    ],
    method: [
      'Muddle the cucumber slices in a shaker.',
      'Add the lime-zest-infused Blanco, mango and lime juices, syrup, milk, and mole bitters.',
      'Shake with ice.',
      'Strain into a Collins glass over ice.',
      'Top with a mango foam.',
      'Finish with a dusting of lime zest and cumin.',
    ],
    glass_type: 'Collins',
    garnish: 'Mango foam with lime zest and cumin',
    flavor_profile: ['Citrus', 'Fruity', 'Umami', 'Spicy'],
    orb_from: '#fad188',
    orb_to: '#c8660b',
    tasting_notes:
      "Tracy Eustaquio's umami-mango Collins — lime-zest-infused Blanco carries a savory mango-cucumber-onion-cumin frame, ten dashes of mole bitters threading cocoa-chile through the finish, milk for silk. A mango foam crowns the glass with lime zest and cumin dust.",
  },
  {
    slug: 'flores-para-los-muertos',
    name: 'Flores para los muertos',
    creator: 'Antonio Minarro',
    category: 'Signature',
    ingredients: [
      { amount_text: '50 ml', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: '15 ml', name: 'Aperol' },
      { amount_text: '10 ml', name: 'Ancho Reyes' },
      { amount_text: '50 ml', name: 'Watermelon-strawberry-raspberry mix' },
      { amount_text: 'to taste', name: 'Salt and lime' },
    ],
    method: [
      'Build all ingredients in a rocks glass over ice.',
      'Stir gently to combine.',
      'Garnish with a raspberry, a flower, and a silver-paired presentation.',
    ],
    glass_type: 'Old Fashioned',
    garnish: 'Raspberry, flower, silver',
    flavor_profile: ['Fruity', 'Spicy', 'Bitter', 'Floral'],
    orb_from: '#f7a7a7',
    orb_to: '#a02b2b',
    tasting_notes:
      "Antonio Minarro's Day-of-the-Dead long drink — Aperol and Ancho Reyes split threads bitter-orange and poblano-chile through a watermelon-strawberry-raspberry fruit base, salt and lime tightening the whole thing. Casa Dragones Blanco up front. Raspberry and flower on top to honor the altar.",
  },
  {
    slug: 'fluen-filid',
    name: 'Fluen Fílid',
    creator: 'Mda Paulina',
    category: 'Signature',
    ingredients: [
      { amount_text: '2½ oz', name: 'Casa Dragones Blanco', product: 'Blanco' },
      { amount_text: null, name: 'Mango-habanero syrup (400 g mango, 800 g sugar, ¼ habanero batch)' },
    ],
    method: [
      'Prepare the syrup batch by blending 400 g fresh mango, 800 g sugar, and ¼ habanero chile. Strain.',
      'Combine the tequila and syrup in a mixing glass with ice.',
      'Stir to combine.',
      'Serve in a chilled coupe.',
      'Garnish with an edible flower.',
    ],
    glass_type: 'Coupe',
    garnish: 'Edible flower',
    flavor_profile: ['Fruity', 'Spicy', 'Sweet'],
    orb_from: '#fcd48b',
    orb_to: '#c5421e',
    tasting_notes:
      "Mda Paulina's mango-habanero Blanco — a batched mango-habanero syrup (400 g mango, 800 g sugar, ¼ habanero) gives the drink sweet-tropical body with controlled fire. Casa Dragones Blanco at 2½ oz carries the agave spine. An edible flower on top.",
  },
]

for (const spec of NEW) {
  const creatorId = spec.creator ? await getOrCreateCreator(spec.creator) : null
  const methodSteps = spec.method.map((text, i) => ({ step: i + 1, text }))

  const { data: inserted, error: insertErr } = await admin
    .from('cocktails')
    .insert({
      workspace_id: ws.id,
      slug: spec.slug,
      name: spec.name,
      status: 'published',
      category: spec.category,
      spirit_base: 'Tequila',
      base_product_id: pid(spec.ingredients[0].product ?? 'Blanco'),
      glass_type: spec.glass_type,
      garnish: spec.garnish,
      tasting_notes: spec.tasting_notes,
      flavor_profile: spec.flavor_profile,
      orb_from: spec.orb_from,
      orb_to: spec.orb_to,
      method_steps: methodSteps,
      creator_id: creatorId,
      featured: false,
    })
    .select('id')
    .single()
  if (insertErr) {
    console.error(`! insert failed for ${spec.slug}:`, insertErr.message)
    continue
  }

  const ingRows = spec.ingredients.map((ing, idx) => ({
    cocktail_id: inserted.id,
    position: idx + 1,
    custom_name: ing.name,
    amount_text: ing.amount_text,
    global_product_id: ing.product ? pid(ing.product) : null,
  }))
  await admin.from('cocktail_ingredients').insert(ingRows)
  console.log(`+ ${spec.name} (${spec.creator ?? '—'})`)
}

console.log(`\n✓ ${UPDATES.length} updated + ${NEW.length} new cocktails`)
