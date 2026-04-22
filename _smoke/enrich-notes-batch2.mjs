// Batch 2: 20 more enriched tasting notes.
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
  'chai-house':
    "Cesar Ponce's aromatic long sour — guava and ginger muddled into pineapple and lime, a lemongrass-cinnamon syrup threading spice, crowned with a cardamom chai foam. Blanco carries the whole tropical-chai architecture without getting buried.",
  'dragon-rojo':
    "Edgar Villalba's grapefruit old-fashioned — a house ginger-and-tamarind syrup adds tart-spicy depth, Peychaud's bitters pulls the drink rosy, and a cinnamon stick finishes the aromatic edge over Casa Dragones Blanco.",
  'hibiscus-soul':
    "César Ponce's layered apéritif — Cinzano Extra Dry and Pamma Liqueur frame a hibiscus tea syrup, with a grapefruit twist expressing citrus oil across the top. Guava slices and basil leaf make it read half-cocktail, half-garden.",
  'margarita-xoconostle':
    "Elena Reygadas' wild-fruit Margarita — xoconostle cactus-pear juice gives a dusky, tart base that orange juice lifts and Blanco grounds. A single flower garnish keeps the drink's desert-meets-garden character visible.",
  'casa-dragones-paloma':
    "James Overbaugh's three-ingredient Paloma — fresh grapefruit meets pomegranate juice, thyme garnish for herbal lift, and Casa Dragones Blanco stays clean and forward. Built in the glass, no soda, pure fruit.",
  'dragon-fruit-frozen-margarita':
    "Alejandro Blanco's frozen Margarita done right — pitaya gives the slush its neon-pink body, Dry Curaçao keeps it bright, and cardamom syrup threads an unexpected warm-spice note through the lime-agave frame.",
  'nube-de-coco':
    "Fernando Acevedo's coconut-mezcal sour — Casa Dragones Blanco split with Espadín mezcal, lifted with house coconut soda and bound silky with crema mexicana and egg white. Spearmint garnish keeps the finish clean.",
  'old-dragon':
    "Raél Torrecilla's savory old-fashioned — Casa Dragones Blanco fat-washed with bacon gets chocolate and orange bitters over a sugar cube, all stirred long with one large ice cube. A lemon-peel aromatic finishes the aged-oak illusion.",
  'casa-dragones-blanco-cocktail':
    "Sean Kelly's tropical stirrer — Bigallet China-China amer brings bittersweet orange, Far North spiced rum and orgeat round out the body, and Casa Dragones Blanco with lime keeps the drink sharp-edged rather than sweet.",
  'cilantro-margarita':
    "Enrique Olvera and Dave Arnold's herbaceous Margarita — a full handful of cilantro shaken hard with Blanco, Cointreau, and lime, delivering a drink that smells like a Mexican kitchen and tastes like the classic it riffs on.",
  unrestricetd:
    "Ulysses Vidal's cross-cultural sour — horchata syrup for warm rice-and-cinnamon sweetness, Joto Yuzu sake for citrus-aromatic lift, Amontillado sherry for dry backbone. Blanco holds the Mexican base while the other half of the drink goes Japanese.",
  'wish-you-roses':
    "Aranza Galaviz's low-alc highball — a homemade strawberry-grapefruit soda stretched with Vermouth Rosso and lime, topped with a Flor del Pensamiento flower. Casa Dragones Blanco keeps the agave line clean through the berry-rose bouquet.",
  miranda:
    "Jim Meehan and Scott Conant's rosé spritz — La Spinetta rosé split 1:1 with Blanco, Contratto Aperitif for bittersweet orange, pink grapefruit juice for brightness, and a basil leaf muddled to scent the whole thing herbal-green.",
  zandunga:
    "Oscar Valle's single-sip aperitif — Pedro Ximénez sherry brings raisined sweetness, sherry vinegar cuts back against it, and a drop of café-de-olla bitters gives the whole thing a cinnamon-coffee edge. Casa Dragones Blanco stays agave-forward through it all.",
  'fuego-de-dragon':
    "Edgar Villalba's red-pepper sour — 75 grams of muddled red bell pepper fold sweetness and grassy heat into a grapefruit-lemon frame, chile-honey syrup doubles down on the pepper arc. Bright, savory, unmistakably summer.",
  'mexci-dragones':
    "Ricardo Sandoval's minimalist Oaxacan Old-Fashioned — Ancho Reyes for poblano chile heat, Bittermens Xocolatl Mole bitters for cocoa-and-chile depth, nothing else. Casa Dragones Blanco gets to carry the whole spicy-chocolate frame.",
  'dragona-ramona':
    "Ulysses Vidal's Champagne Margarita riff — Ramona (sparkling California grapefruit) and Brut Champagne turn this into a two-bubble lift over a classic Blanco-lime-agave sour. A pinch of salt ties the whole thing back to the Margarita template.",
  manzanilla:
    "Mario González's after-dinner stirrer — Torres 10 brandy brings oak-and-stone-fruit warmth, a sweetened chamomile tea wraps the whole thing floral, and Casa Dragones Blanco stays underneath as the agave thread. Served with a chamomile tea bag on the rim.",
  'naked-famous':
    "Jasin Burt's equal-parts classic — the Naked & Famous template of mezcal + Yellow Chartreuse + Aperol + lime, swapped onto Casa Dragones Blanco. Four even pours, shake hard, strain — one of the cleanest ways to serve this tequila.",
  'princess-peach':
    "A Champagne Margarita gone peachy — Cocchi Rosa and peach syrup tint the drink rose-gold, lemon keeps it taut, and three ounces of La Caravelle rosé Champagne stretch it into a sipper. Edible-flower garnish holds the princess brief.",
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
