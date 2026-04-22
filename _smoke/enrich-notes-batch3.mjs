// Batch 3: 20 more enriched tasting notes.
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
  'dragon-nico':
    "Cesar Ponce's layered orchard cocktail — apple and peach juices over Blanco and White Martini, cinnamon syrup threading warm spice, and a Damiana-and-Licor-43 vanilla foam floating on top. Green-apple slices and raspberry for the orchard brief.",
  'smokey-and-the-bandido':
    "A smoked Reserve stirrer — Casa Dragones Añejo Barrel Blend with Amaro Averna and Dolin Blanc, tonka syrup adding vanilla-almond warmth, and whisky-barrel smoke captured under a Hoja Santa circle. Drinks like an after-dinner cigar.",
  'honey-sparkle':
    "Jim Meehan's minimalist Blanco sour — 1½ oz tequila over lime and honey syrup, a bare quarter-teaspoon of Suze for dry gentian bite. Three ingredients plus one trace — the kind of drink you measure to the drop.",
  'agua-de-horchata-al-tequila':
    "Fabian Acuña's traditional agua fresca made cocktail — sweetened nopal concentrate folded into natural horchata, Casa Dragones Blanco stitched through the middle. Cinnamon stick and a piece of nopal keep the garnish street-stand authentic.",
  'mizunara-sour':
    "José Luis León at Limantour: Casa Dragones Reposado Mizunara carries a 1½-¾ sour frame brightened with yuzu and elderflower liqueur, Japanese-oak resting meeting Mexican agave. A matcha-powder Dragones stencil finishes the visual Japan-Mexico handshake.",
  'blood-orange-fresco':
    "Brad Schecter's L.A. shaker — Mandarine Napoléon for orange-cognac warmth, three jalapeño slices for heat, six cilantro leaves for herb, half a blood orange for color and tart. Drinks exactly like what it looks like: Mexico in late spring.",
  'batallon-16':
    "Moisés Sierra's umami-herbaceous flip — Yellow Chartreuse, three cherry tomatoes and two epazote leaves muddled with Blanco, then shaken with agave, lemon, and egg white. Comes out sea-foam green and savory, served in a flute to keep the head alive.",
  'casa-verde':
    "Osvaldo Vázquez's built-glass green cocktail — green apple, ginger, epazote, and lime muddled over a spiced king ice cube, Casa Dragones Blanco poured long, white-oak barrel bitters for depth, tonic water for lift. Orange-blossom aromatic and epazote sprig for the garden finish.",
  'winter-is-coming':
    "Leo Robitschek's apple-cider sour — Luxardo Amaro Abano's bittersweet herbal bite against tart cider, maple syrup for caramel sweetness, lemon to tighten. Casa Dragones Blanco holds the agave thread through a drink that tastes like a cold afternoon.",
  'madre-patria':
    "Fabiola Padilla's Independence Day pour from Bekeb — Casa Dragones Añejo Barrel Blend stirred with mole bitters, Angostura, and demerara syrup for a minimal, tequila-forward old-fashioned. Three-citrus peel skewer (lemon, grapefruit, lime) for the triple-flag finish.",
  bandera:
    "Yana Volfson's highball homage to Mexico — Creme de Cacao and Velvet Falernum for tropical sweetness, lime for acid, hoja santa and mint leaves layering green at the glass bottom, pomegranate seeds topping the whole thing red-white-green. The flag in a cocktail.",
  'epa-nopal':
    "Jim Meehan's nopal-Chartreuse sour — three slices of cactus paddle shaken hard with Green Chartreuse, lime, honey, and Blanco, four epazote leaves finishing the herbal arc. Served in a coupe — like a Last Word with a Mexican accent.",
  riviera:
    "Jim Meehan's frozen-blender horchata riff — tequila split with horchata water, guava and grapefruit folded in, honey syrup rounding, ancho chile dusted for warm-heat finish. A pool-side cocktail that drinks like dessert.",
  'como-ruges-cantas':
    "Martha Ortiz's coconut-chaya coupe — coconut water and milk whirled with a piece of fresh coconut and a blanched chaya leaf, Casa Dragones Blanco carrying the whole thing agave-forward. Lime, salt, and Tajín to taste; grated coconut and a flower-foliage crown to finish.",
  'manzana-confitada':
    "Jim Meehan's holiday stirrer — cloudy apple cider warmed with a PX sherry split and lifted with Becherovka's clove-cinnamon herbal bitterness. Casa Dragones Blanco holds the base clean. A grating of nutmeg on top keeps the whole thing Christmas-pie.",
  'mountain-leaf':
    "Jim Meehan's alpine Margarita — a single large arugula leaf shaken with Blanco, Green Chartreuse, lime, and agave. Peppery-green body, bright citrus top, and the arugula leaf floating over the coupe as garnish. Feels like winter, tastes like spring.",
  'mexico-nippon':
    "Bertario Martínez's cross-cultural stirrer — Casa Dragones Reposado Mizunara with Nami Junmai sake and a house Elote (corn) liqueur, cacao bitters threading bitter sweetness, a spoon of agave rounding it out. Twist of lemon and orange for citrus aromatic.",
  'dragones-sunset':
    "Jim Meehan's gold-hour coupe — carrot and orange juices with Yellow Chartreuse and egg white, fine-strained into a foam-crowned coupe that glows russet. Casa Dragones Blanco holds the base clean while the juices and Chartreuse do the sunset work.",
  formentera:
    "Scott Villalobos' summer beach cocktail — watermelon juice over grenadine and lemon, baked-apple bitters for a whisper of orchard, and garam masala spice dusted across the foam. Casa Dragones Blanco stays underneath as the structural agave.",
  'la-rosa':
    "Thomas Meyrieux's rose-petal Cosmopolitan — cranberry juice stretched with hibiscus and rose syrups, lavender bitters adding floral depth, served in a martini glass with orange peel and a maraschino cherry. Casa Dragones Blanco keeps the drink's bright-pink frame from going candy-sweet.",
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
