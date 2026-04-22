// Enrich every Casa Dragones cocktail with:
//   - glass_type inferred from method (or ingredient hints)
//   - garnish extracted from method last step or "Garnish with ..." phrase
//   - flavor_profile inferred from ingredient names
//   - Spanish-to-English translation of common method verbs
//
// Safe to re-run: only writes fields that are currently empty.

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

const { data: cocktails } = await admin
  .from('cocktails')
  .select(
    'id, slug, name, category, glass_type, garnish, flavor_profile, method_steps',
  )
  .eq('workspace_id', ws.id)

const { data: allIngs } = await admin
  .from('cocktail_ingredients')
  .select('id, cocktail_id, custom_name, amount_text, position')
  .in('cocktail_id', cocktails.map((c) => c.id))

const ingByCocktail = new Map()
for (const i of allIngs ?? []) {
  if (!ingByCocktail.has(i.cocktail_id)) ingByCocktail.set(i.cocktail_id, [])
  ingByCocktail.get(i.cocktail_id).push(i)
}

// ─── Glass inference ──────────────────────────────────────────────────
const glassRules = [
  [/\bnick\s*(?:and|&|'n')?\s*nora\b/i, 'Nick & Nora'],
  [/\bcoupe\b|\bcoupé\b/i, 'Coupe'],
  [/\brocks\s*glass|\bold[-\s]?fashion/i, 'Old Fashioned'],
  [/\bhigh[-\s]?ball\b|\bcollins\b/i, 'Highball'],
  [/\bmartini\s*glass|\bv\s*glass/i, 'Martini'],
  [/\bflute\b/i, 'Flute'],
  [/\bwine\s*glass|\btulip\b/i, 'Wine'],
  [/\bmasu\s*box|\bmasu\b/i, 'Masu Box'],
  [/\bsnifter\b/i, 'Snifter'],
  [/\bmug\b|\bheat(?:proof)?\s*glass\b|\bhot\s*glass\b|\bpre[-\s]?heated\s*glass/i, 'Mug'],
  [/\bjulep\s*cup\b/i, 'Julep Cup'],
  [/\bshot\s*glass\b/i, 'Shot'],
  [/\bpint\s*glass\b/i, 'Pint'],
  [/\bsour\s*glass\b/i, 'Sour'],
  [/\brocks\b(?!.*over)/i, 'Old Fashioned'],
]

function inferGlass(method, category, name) {
  if (!method) method = ''
  for (const [re, label] of glassRules) if (re.test(method)) return label
  // Category/name hints
  const n = (name ?? '').toLowerCase()
  if (n.includes('martini')) return 'Martini'
  if (n.includes('highball') || n.includes('mule') || n.includes('paloma')) return 'Highball'
  if (n.includes('margarita')) return 'Old Fashioned' // served on rocks in Casa Dragones house style
  if (n.includes('negroni') || n.includes('old fashioned')) return 'Old Fashioned'
  if (n.includes('toddy') || n.includes('hot')) return 'Mug'
  if (n.includes('spritz') || n.includes('sparkle') || n.includes('champagne')) return 'Coupe'
  if (n.includes('sour')) return 'Coupe'
  if (n.includes('punch') || n.includes('cobbler')) return 'Rocks'
  if (n.includes('shot')) return 'Shot'
  if (category === 'Sour') return 'Coupe'
  if (category === 'Highball') return 'Highball'
  if (category === 'Margarita') return 'Old Fashioned'
  if (category === 'Hot Cocktail') return 'Mug'
  if (category === 'Martini') return 'Martini'
  if (category === 'Mule' || category === 'Paloma') return 'Highball'
  if (category === 'Shot' || category === 'Beer Cocktail') return 'Pint'
  return null
}

// ─── Garnish extraction ───────────────────────────────────────────────
function inferGarnish(methodText, ingredients) {
  if (methodText) {
    // Stop at period OR before a following method verb (Shake, Stir, etc.).
    // Also stop at ", then" / "; then" style conjunctions that start a new step.
    const stopBoundary = /(?=\.|\s+(?:Shake|Stir|Pour|Combine|Add|Strain|Serve|Mix|Top|Build|Muddle|Rim|Line|Roll|Layer|Smoke|Double|Infuse|Prepare|Heat|Warm|Whisk|In\s+a|Into\s+a)\b|$)/
    const re = new RegExp(
      '(?:garnish(?:ed)?\\s+with|garnish(?:ed)?:|top(?:ped)?\\s+with)\\s+([^.]+?)' + stopBoundary.source,
      'i'
    )
    const m = methodText.match(re)
    if (m) {
      let g = m[1].trim().replace(/\s+/g, ' ')
      g = g.replace(/[,;:]$/, '').trim()
      if (g.length > 2 && g.length < 80) {
        return g.charAt(0).toUpperCase() + g.slice(1)
      }
    }
  }
  // Last ingredient named "garnish" or "rim"
  const last = ingredients[ingredients.length - 1]
  if (last && /garnish|rim|peel|twist|slice|sprig|wheel/i.test(last.custom_name)) {
    return last.custom_name.charAt(0).toUpperCase() + last.custom_name.slice(1)
  }
  return null
}

// ─── Flavor profile inference ─────────────────────────────────────────
const flavorRules = {
  Citrus: /\blime|lemon|yuzu|grapefruit|orange|bergamot|citrus|lemongrass|pomelo|citron\b/i,
  Spicy: /\bjalape|habanero|serrano|chile?|pepper|ginger|cayenne|tabasco|ancho|pasilla|chipotle|poblano\b/i,
  Herbal: /\bbasil|mint|rosemary|thyme|sage|cilantro|parsley|dill|chartreuse|fennel|tarragon|hoja\s*santa|epazote|oregano|arugula\b/i,
  Fruity: /\bberry|strawberry|raspberry|blueberry|blackberry|pear|apple|peach|plum|cherry|mango|pineapple|melon|cantaloupe|papaya|passion|kiwi|banana|guava|apricot|fig|persimmon|pomegranate|nopal|prickly|fresa|piña|manzana\b/i,
  Floral: /\bhibiscus|jasmin|rose|elderflower|lavender|violet|orange\s*blossom|chamomile|butterfly\s*pea|flower\b/i,
  Smoky: /\bmezcal|smoke|smoked|laphroaig|peat|charred|barrel\s*smoked\b/i,
  Sweet: /\bhoney|agave|syrup|maple|sugar|simple\s*syrup|demerara|caramel|vanilla|chocolate|cacao|marshmallow|grenadine\b/i,
  Bitter: /\bcampari|aperol|amaro|suze|cynar|fernet|bitter|bittermens|peychaud|angostura|cardamaro|punt\s*e\s*mes\b/i,
  Creamy: /\bmilk|cream|coconut\s*milk|egg\s*white|coconut|yogurt|oat\s*milk|horchata|coquito|velvet|pumpkin\s*pur|pur[ée]e\b/i,
  Umami: /\bmushroom|tomato|miso|soy|seaweed|dashi|mole\b/i,
  Tropical: /\bcoconut|pineapple|passion\s*fruit|mango|guava|papaya|lychee|dragon\s*fruit\b/i,
  Spritz: /\bchampagne|prosecco|cava|sparkling|soda|tonic|seltzer|club\s*soda\b/i,
  Sherry: /\bsherry|fino|manzanilla|oloroso|pedro\s*xim[ée]nez|px\b/i,
  Agave: /\bagave|tequila|mezcal|sotol|raicilla\b/i,
}

function inferFlavor(ingredients) {
  const allText = ingredients.map((i) => i.custom_name ?? '').join(' ').toLowerCase()
  const hits = []
  for (const [flavor, re] of Object.entries(flavorRules)) {
    if (re.test(allText)) hits.push(flavor)
  }
  // Always include Agave for tequila drinks, but we don't want every profile to include it
  const filtered = hits.filter((f) => f !== 'Agave')
  // Cap at 4 most relevant tags
  return filtered.slice(0, 4)
}

// ─── Spanish translation ──────────────────────────────────────────────
// Multi-word phrases must come first — more-specific before more-generic.
const translations = [
  // Protected compounds — tokens restored after all rules run
  [/\bhoja\s*santa\b/gi, 'HOJASANTAPROTECTED'],
  [/\bhojas?\s*santas?\b/gi, 'HOJASANTAPROTECTED'],
  [/\bsal\s+de\s+gusano\b/gi, 'SALGUSANOPROTECTED'],
  [/\bchile\s+tajín\b/gi, 'TAJINCHILEPROTECTED'],
  [/\bdecorarMezclar\b/gi, 'Decorate. Mix'],
  [/\bdecorar\s*Mezclar\b/gi, 'Decorate. Mix'],
  [/\bramita\s+con\b/gi, 'sprig with'],
  [/\bramit(?:a|o)s?\b/gi, 'sprig'],

  // Phrases
  [/\bdejar\s*enfriar\b/gi, 'let cool'],
  [/\bdespués de\b/gi, 'after'],
  [/\bantes de\b/gi, 'before'],
  [/\bal gusto\b/gi, 'to taste'],
  [/\ba pasado\b/gi, 'previously'],
  [/\bcon hielo\b/gi, 'with ice'],
  [/\bsin hielo\b/gi, 'without ice'],
  [/\bpor encima\b/gi, 'on top'],
  [/\bsobre hielo\b/gi, 'over ice'],
  [/\ben una copa\b/gi, 'in a coupe'],
  [/\ben un vaso\b/gi, 'in a glass'],
  [/\ben un shaker\b/gi, 'in a shaker'],
  [/\bclara de huevo\b/gi, 'egg white'],
  [/\bagua mineral\b/gi, 'sparkling water'],
  [/\bagua t[óo]nica\b/gi, 'tonic water'],
  [/\bagua de coco\b/gi, 'coconut water'],
  [/\bjugo de lim[óo]n verde\b/gi, 'lime juice'],
  [/\bjugo de lim[óo]n amarillo\b/gi, 'lemon juice'],
  [/\bjugo de lim[óo]n\b/gi, 'lime juice'],
  [/\bjugo de toronja\b/gi, 'grapefruit juice'],
  [/\bjugo de naranja\b/gi, 'orange juice'],
  [/\bjugo de pi[ñn]a\b/gi, 'pineapple juice'],
  [/\bjugo de nopal\b/gi, 'nopal juice'],
  [/\bjugo de pepino\b/gi, 'cucumber juice'],
  [/\balbahaca fresca\b/gi, 'fresh basil'],
  [/\bcoctelera\b/gi, 'shaker'],
  [/\bsyrup de agave\b/gi, 'agave syrup'],
  [/\bwater de coco\b/gi, 'coconut water'],
  [/\bwater de horchata\b/gi, 'horchata water'],
  [/\bramit(?:a|o)s? de\b/gi, 'sprig of'],
  [/\brama de\b/gi, 'stick of'],
  [/\braja de\b/gi, 'stick of'],
  [/\bpedacit[oa]s? de\b/gi, 'piece of'],
  [/\bpedaz[oa]s? de\b/gi, 'piece of'],
  [/\brebanada de\b/gi, 'slice of'],
  [/\brebanada\b/gi, 'slice'],
  [/\bpedacito\b/gi, 'piece'],
  [/\bpedazo\b/gi, 'piece'],
  [/\bcubos de\b/gi, 'cubes of'],
  [/\bcub(?:o|ito)s?\b/gi, 'cubes'],
  [/\bhielo "?crush"?\b/gi, 'crushed ice'],
  [/\bhielo crush\b/gi, 'crushed ice'],
  [/\bhielo picado\b/gi, 'crushed ice'],

  // Verbs
  [/\bmezclar\b/gi, 'mix'],
  [/\bmezcla\b/gi, 'mix'],
  [/\bagitar\b/gi, 'shake'],
  [/\bagita\b/gi, 'shake'],
  [/\bcolar\b/gi, 'strain'],
  [/\bcolado\b/gi, 'strained'],
  [/\bservir\b/gi, 'serve'],
  [/\bsirva\b/gi, 'serve'],
  [/\bsirve\b/gi, 'serve'],
  [/\bañadir\b/gi, 'add'],
  [/\bañade\b/gi, 'add'],
  [/\bagrega(?:r)?\b/gi, 'add'],
  [/\bpon\b/gi, 'place'],
  [/\bponer\b/gi, 'place'],
  [/\bverter\b/gi, 'pour'],
  [/\bvierte\b/gi, 'pour'],
  [/\blicu[ae]r\b/gi, 'blend'],
  [/\blicu[ae]a\b/gi, 'blend'],
  [/\bdecorar\b/gi, 'garnish'],
  [/\bdecorado\b/gi, 'garnished'],
  [/\bdecora\b/gi, 'garnish'],
  [/\bdecoraci[óo]n\b/gi, 'garnish'],
  [/\bmacerar\b/gi, 'macerate'],
  [/\bmachacar\b/gi, 'muddle'],
  [/\bremojar\b/gi, 'soak'],
  [/\bremoja(?:r)?\b/gi, 'soak'],
  [/\brefrigera(?:r)?\b/gi, 'refrigerate'],
  [/\breposa(?:r)?\b/gi, 'rest'],
  [/\bcubr(?:ir|e)\b/gi, 'cover'],
  [/\bcalient(?:a|e)(?:r)?\b/gi, 'heat'],
  [/\bhierv(?:a|e)(?:r)?\b/gi, 'boil'],
  [/\brellenar\b/gi, 'top up'],
  [/\brellena\b/gi, 'top up'],
  [/\bprepara(?:r)?\b/gi, 'prepare'],
  [/\bestilla(?:r)?\b/gi, 'chill'],

  // Nouns & adjectives
  [/\bingredientes\b/gi, 'ingredients'],
  [/\bpreparaci[óo]n\b/gi, 'preparation'],
  [/\blim[óo]n verde\b/gi, 'lime'],
  [/\blim[óo]n amarillo\b/gi, 'lemon'],
  [/\blim[óo]n\b/gi, 'lime'],
  [/\blimones\b/gi, 'limes'],
  [/\bmel[óo]n\b/gi, 'melon'],
  [/\bmelones\b/gi, 'melons'],
  [/\btoronja\b/gi, 'grapefruit'],
  [/\bnaranja\b/gi, 'orange'],
  [/\bpiña\b/gi, 'pineapple'],
  [/\bsand[íi]a\b/gi, 'watermelon'],
  [/\bpepino\b/gi, 'cucumber'],
  [/\balbahaca\b/gi, 'basil'],
  [/\bcilantro\b/gi, 'cilantro'],
  [/\bmenta\b/gi, 'mint'],
  [/\bhierbabuena\b/gi, 'mint'],
  [/\bromero\b/gi, 'rosemary'],
  [/\bhierbas\b/gi, 'herbs'],
  [/\bhierba\b/gi, 'herb'],
  [/\bcáscara\b/gi, 'peel'],
  [/\bc[áa]scara\b/gi, 'peel'],
  [/\bhuevo\b/gi, 'egg'],
  [/\bjarabe\b/gi, 'syrup'],
  [/\bazúcar\b/gi, 'sugar'],
  [/\baz[úu]car\b/gi, 'sugar'],
  [/\bmiel\b/gi, 'honey'],
  [/\bleche de coco\b/gi, 'coconut milk'],
  [/\bleche\b/gi, 'milk'],
  [/\bcoco\b/gi, 'coconut'],
  [/\barroz\b/gi, 'rice'],
  [/\bcanela\b/gi, 'cinnamon'],
  [/\bnopal\b/gi, 'nopal'],
  [/\bjalape[ñn]o\b/gi, 'jalapeño'],
  [/\bchile\b/gi, 'chile'],
  [/\bhuracán\b/gi, 'hurricane'],
  [/\bhurac[áa]n\b/gi, 'hurricane'],
  [/\bcort(?:a|o)\b/gi, 'short'],
  [/\bfondo\b/gi, 'bottom'],
  [/\bfresca\b/gi, 'fresh'],
  [/\bfresco\b/gi, 'fresh'],
  [/\bnatural\b/gi, 'natural'],
  [/\bagua\b/gi, 'water'],
  [/\bhielo\b/gi, 'ice'],
  [/\bcopa\b/gi, 'coupe'],
  [/\bvaso\b/gi, 'glass'],
  [/\bbotella\b/gi, 'bottle'],
  [/\bjugo\b/gi, 'juice'],
  [/\bcucharada(?:s)?\b/gi, 'tbsp'],
  [/\bcucharadita(?:s)?\b/gi, 'tsp'],
  [/\blitros?\b/gi, 'L'],
  [/\bmililitros?\b/gi, 'ml'],
  [/\bgramos?\b/gi, 'g'],
  [/\banfitri[óo]n\b/gi, 'host'],
  [/\bmientras\b/gi, 'while'],
  [/\bfinalmente\b/gi, 'finally'],
  [/\bluego\b/gi, 'then'],
  [/\balgunos?\b/gi, 'some'],
  [/\balguna(?:s)?\b/gi, 'some'],

  // Connector words — last so they don't eat into others
  [/\bde los?\b/gi, 'of the'],
  [/\bde las?\b/gi, 'of the'],
  [/\ben el\b/gi, 'in the'],
  [/\ben la\b/gi, 'in the'],
  [/\bsobre\b/gi, 'over'],
  [/\bcon el\b/gi, 'with the'],
  [/\bcon la\b/gi, 'with the'],
  [/\bcon un(?:a)?\b/gi, 'with a'],
  [/\bel resto\b/gi, 'the rest'],
  [/\bresto\b/gi, 'rest'],
  [/\bpor\b/gi, 'for'],
  [/\bmás\b/gi, 'more'],
  [/\bm[áa]s\b/gi, 'more'],

  // Extended vocabulary for long-form recipes
  [/\bnéctar\b/gi, 'nectar'],
  [/\bn[ée]ctar\b/gi, 'nectar'],
  [/\bsal de gusano\b/gi, 'sal de gusano'],
  [/\bgusano de maguey\b/gi, 'maguey worm'],
  [/\bgusano\b/gi, 'worm'],
  [/\bsal\b/gi, 'salt'],
  [/\bescarch(?:ar|ado|ada)\b/gi, 'rim'],
  [/\bpizca\b/gi, 'pinch'],
  [/\bhojas?\b/gi, 'leaves'],
  [/\bfollaje\b/gi, 'foliage'],
  [/\bflor(?:es)?\s+comestibles?\b/gi, 'edible flower'],
  [/\bcomestible\b/gi, 'edible'],
  [/\bflorecillas?\b/gi, 'small flowers'],
  [/\bflor\b/gi, 'flower'],
  [/\btodos?\b/gi, 'all'],
  [/\btoda(?:s)?\b/gi, 'all'],
  [/\bo\b(?=\s+[a-záéíóúñ])/gi, 'or'],
  [/\bamericana\b/gi, 'american'],
  [/\bhacer\b/gi, 'make'],
  [/\bligeramente\b/gi, 'lightly'],
  [/\bsuavemente\b/gi, 'gently'],
  [/\blentamente\b/gi, 'slowly'],
  [/\bseis\b/gi, 'six'],
  [/\bcinco\b/gi, 'five'],
  [/\bcuatro\b/gi, 'four'],
  [/\btres\b/gi, 'three'],
  [/\bdos\b/gi, 'two'],
  [/\bcuchara\b/gi, 'spoon'],
  [/\bcoconut seco rallado\b/gi, 'grated dried coconut'],
  [/\bcoconut seco\b/gi, 'dried coconut'],
  [/\brallado\b/gi, 'grated'],
  [/\bseco\b/gi, 'dried'],
  [/\bhelado picado\b/gi, 'crushed ice'],
  [/\bhelado\b/gi, 'ice'],
  [/\bpicado\b/gi, 'crushed'],
  [/\bmaíz\b/gi, 'corn'],
  [/\bma[íi]z\b/gi, 'corn'],
  [/\bsidra\b/gi, 'cider'],
  [/\bmanzana roja\b/gi, 'red apple'],
  [/\bmanzana\b/gi, 'apple'],
  [/\bjerez\s+oloroso\b/gi, 'oloroso sherry'],
  [/\bjerez\b/gi, 'sherry'],
  [/\bintegra(?:r)?\b/gi, 'integrate'],
  [/\bayuda\b/gi, 'aid'],
  [/\btermina(?:r)?\b/gi, 'finish'],
  [/\bagregando\b/gi, 'adding'],
  [/\brestantes?\b/gi, 'remaining'],
  [/\bsegmento\b/gi, 'segment'],
  [/\bframbuesa\b/gi, 'raspberry'],
  [/\bzarzamora\b/gi, 'blackberry'],
  [/\bdoble\b/gi, 'double'],
  [/\bllenar\b/gi, 'fill'],
  [/\bexcepto\b/gi, 'except'],
  [/\bprimera\b/gi, 'first'],
  [/\btibia\b/gi, 'warm'],
  [/\brevolviendo\b/gi, 'stirring'],
  [/\bincorporar\b/gi, 'incorporate'],
  [/\bvaca\b/gi, 'cow'],
  [/\bmedia luna\b/gi, 'half moon'],
  [/\btransparente\b/gi, 'clear'],
  [/\bproceso\b/gi, 'process'],
  [/\bclarificaci[óo]n\b/gi, 'clarification'],
  [/\bpulgadas?\b/gi, 'inches'],
  [/\bpara\b/gi, 'for'],
  [/\bhacia\b/gi, 'towards'],
  [/\bsus?\b/gi, 'its'],
  [/\bc\/s\b/gi, 'as needed'],
  [/\btajín\b/gi, 'Tajín'],
  [/\bhielos\b/gi, 'ice'],
  [/\brecién exprimido\b/gi, 'freshly squeezed'],
  [/\brecién exprimida\b/gi, 'freshly squeezed'],
  [/\brecien exprimido\b/gi, 'freshly squeezed'],
  [/\bexprimido\b/gi, 'squeezed'],
  [/\bexprimida\b/gi, 'squeezed'],
  [/\bque hicimos\b/gi, 'that we made'],
  [/\bhicimos\b/gi, 'we made'],
  [/\ba a\b/gi, 'to a'],
  [/\ba the\b/gi, 'to the'],
  [/\bverde\b/gi, 'green'],
  [/\bseared\s+(?:a|to)\s+the\s+grill\b/gi, 'grilled'],
  [/\ba\s+the\s+grill\b/gi, 'on the grill'],
  [/\bto\s+the\s+grill\b/gi, 'on the grill'],
  [/\bllena(?:r)?\b/gi, 'fill'],
  [/\bllenos?\b/gi, 'full'],
  [/\bllenas?\b/gi, 'full'],
  [/\bchaya\b/gi, 'chaya'],
  [/\bpitaya\b/gi, 'dragon fruit'],
  [/\bjunto\b/gi, 'together'],
  [/\bpunto\b/gi, 'point'],
  [/\bllegar\b/gi, 'reach'],
  [/\bllega\b/gi, 'reaches'],
  [/\bgrande(?:s)?\b/gi, 'large'],
  [/\bgrandes?\b/gi, 'large'],
  [/\bmuddleo\b/gi, 'muddle'],

  // Tiny connectors last
  [/\bcon\b/gi, 'with'],
  [/\bsin\b/gi, 'without'],
  [/\by\b/gi, 'and'],
  [/\bun(?:a)?\b/gi, 'a'],
  [/\blos\b/gi, 'the'],
  [/\blas\b/gi, 'the'],
  [/\bel\b/gi, 'the'],
  [/\bla\b/gi, 'the'],
  [/\bde\b/gi, 'of'],
  [/\ben\b/gi, 'in'],
]

// Rules whose LHS matches a real English word too — risky to apply globally.
// "para" / "por" etc. never appear in English, safe to translate globally.
// Keep only the truly ambiguous ones (a / la / el as names, y / o as letters).
const RISKY_PATTERNS = new Set([
  'el', 'la', 'los', 'las', 'a', 'y', 'o', 'con', 'sin',
])
function isRiskyPattern(re) {
  const src = re.source.replace(/\\b/g, '').replace(/\([^)]*\)/g, '').replace(/\s+/g, '')
  return RISKY_PATTERNS.has(src.toLowerCase())
}

function translateSpanish(text, { alsoRisky = true } = {}) {
  if (!text) return text
  let out = text
  for (const [re, replacement] of translations) {
    if (!alsoRisky && isRiskyPattern(re)) continue
    out = out.replace(re, replacement)
  }
  // Restore protected compounds
  out = out
    .replace(/HOJASANTAPROTECTED/gi, 'hoja santa')
    .replace(/SALGUSANOPROTECTED/gi, 'sal de gusano')
    .replace(/TAJINCHILEPROTECTED/gi, 'Tajín chile')
  // Capitalize sentence starts after translation
  out = out.replace(/(^|[.!?]\s+)([a-z])/g, (_, p, c) => p + c.toUpperCase())
  return out
}

// Tokens that exist ONLY in Spanish (no English homograph) — a single hit
// is enough evidence to translate.
const spanishMarkers = [
  'ingredientes', 'recién', 'recien', 'cucharadita', 'cucharada',
  'mezclar', 'mezcla', 'colar', 'agitar', 'agita', 'servir', 'añadir',
  'añade', 'agrega', 'verter', 'vierte', 'licuar', 'decora', 'macerar',
  'machacar', 'remojar', 'refrigera', 'refrigerar', 'reposar',
  'cubrir', 'calienta', 'calentar', 'hierve', 'hervir', 'rellenar',
  'después', 'antes', 'cóctel', 'coctel', 'preparación',
  'rodaja', 'fresca', 'fresco', 'con hielo', 'al gusto',
  'limón', 'limon', 'toronja', 'piña', 'sandía', 'sandia',
  'pepino', 'albahaca', 'cilantro', 'hierbabuena', 'nopal',
  'jarabe', 'jugo', 'hielo', 'cucharón',
  'clara de huevo', 'ramito', 'ramita', 'cubito', 'raja',
  'pedacito', 'pedazo', 'rebanada', 'huracán', 'machac',
  'ingredient ', ' y ', ' de ', ' el ', ' la ', ' los ', ' las ',
  ' con ', ' al ', ' en ', ' un ', ' una ',
]
function isSpanish(text) {
  if (!text) return false
  const t = ' ' + text.toLowerCase() + ' '
  let hits = 0
  for (const m of spanishMarkers) {
    const needle = m.includes(' ') ? m : ' ' + m + ' '
    if (t.includes(needle) || t.includes(m)) hits++
    if (hits >= 2) return true
  }
  return false
}

// ─── Apply ───────────────────────────────────────────────────────────
let updated = 0
for (const c of cocktails) {
  const patch = {}
  const methodArr = Array.isArray(c.method_steps) ? c.method_steps : []
  const methodText = methodArr.map((s) => s.text ?? '').join(' ')
  const ings = ingByCocktail.get(c.id) ?? []

  // Always re-infer glass from the latest method (in case it changed via reparse)
  {
    const g = inferGlass(methodText, c.category, c.name) ?? c.glass_type ?? 'Coupe'
    if (g !== c.glass_type) patch.glass_type = g
  }

  // Re-infer garnish unconditionally from the current method_steps (the source
  // of truth). Only keep the existing value if the new extraction returns
  // nothing and the existing looks acceptable.
  const newGarnish = inferGarnish(methodText, ings)
  const currentLooksBad =
    c.garnish &&
    (c.garnish.length > 60 ||
      /\b(?:shake|stir|strain|pour|combine|serve|add)\b/i.test(c.garnish) ||
      /\b(?:los?|las?|el|y|con|sobre|en\s+la|en\s+un|de\s+la|\ba\s+the\b|\bseared\s+a\b)\b/i.test(c.garnish))
  if (!c.garnish) {
    if (newGarnish) patch.garnish = newGarnish
  } else if (currentLooksBad) {
    patch.garnish = newGarnish ?? null
  } else if (newGarnish && newGarnish !== c.garnish && methodText.includes(newGarnish.split(' ').slice(0, 3).join(' '))) {
    patch.garnish = newGarnish
  }

  // Re-infer flavor profile from current ingredients (they may have changed)
  {
    const fp = inferFlavor(ings)
    const newFP = fp.length > 0 ? fp : ['Agave']
    const cur = c.flavor_profile ?? []
    // Only update if current is empty, just ['Agave'], or diverges significantly
    if (cur.length === 0 || (cur.length === 1 && cur[0] === 'Agave' && fp.length > 0)) {
      patch.flavor_profile = newFP
    }
  }

  // Translate method steps.
  // Always apply safe Spanish-only vocabulary. Apply risky connectors only if
  // we detect Spanish — avoids chewing up standalone "a" / "la" in English.
  if (methodArr.length > 0) {
    const alsoRisky = isSpanish(methodText)
    const translated = methodArr.map((s) => ({
      ...s,
      text: translateSpanish(s.text ?? '', { alsoRisky }),
    }))
    // Only commit if any text actually changed
    const anyChange = translated.some((t, i) => t.text !== (methodArr[i].text ?? ''))
    if (anyChange) patch.method_steps = translated
  }

  if (Object.keys(patch).length === 0) continue

  const { error } = await admin.from('cocktails').update(patch).eq('id', c.id)
  if (error) {
    console.error(`! ${c.slug}:`, error.message)
    continue
  }
  updated++
}

// Also translate Spanish custom_name in ingredients
let ingUpdated = 0
for (const i of allIngs ?? []) {
  if (!isSpanish(i.custom_name)) continue
  const translated = translateSpanish(i.custom_name)
  if (translated === i.custom_name) continue
  const { error } = await admin
    .from('cocktail_ingredients')
    .update({ custom_name: translated })
    .eq('id', i.id)
  if (!error) ingUpdated++
}

console.log(`✓ cocktails updated: ${updated}/${cocktails.length}`)
console.log(`✓ ingredients translated: ${ingUpdated}`)
