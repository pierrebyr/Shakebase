// Reclassify every cocktail's category based on a clean taxonomy.
// Priority order:
//   1. Explicit name match (Margarita, Paloma, Mule, Martini, Toddy, Negroni,
//      Spritz, Old Fashioned, Sour, Punch, Flip, Cobbler, Collins, Shot…)
//   2. Ingredient-pattern classification
//   3. Keep existing or fall back to "Signature"
//
// Run: node --env-file=.env.local _smoke/reclassify-categories.mjs

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
  .select('id, name, slug, category, glass_type, method_steps')
  .eq('workspace_id', ws.id)

let allIngs = []
for (let page = 0; ; page++) {
  const { data } = await admin
    .from('cocktail_ingredients')
    .select('cocktail_id, custom_name')
    .range(page * 1000, page * 1000 + 999)
  if (!data || data.length === 0) break
  allIngs.push(...data)
  if (data.length < 1000) break
}

const ingByCocktail = new Map()
for (const i of allIngs) {
  if (!ingByCocktail.has(i.cocktail_id)) ingByCocktail.set(i.cocktail_id, [])
  ingByCocktail.get(i.cocktail_id).push(i)
}

// ─── Pattern matchers ───────────────────────────────────────────────
const hasMatch = (ings, re) => ings.some((i) => re.test(i.custom_name ?? ''))

function classify(cocktail, ings) {
  const name = (cocktail.name ?? '').toLowerCase()
  const glass = (cocktail.glass_type ?? '').toLowerCase()
  const methodText = ((cocktail.method_steps ?? []).map((s) => s.text ?? '').join(' ')).toLowerCase()
  const ingText = ings.map((i) => (i.custom_name ?? '').toLowerCase()).join(' ')

  // 1. Explicit name match (most reliable — respect what the creator called it)
  if (name.includes('margarita')) return 'Margarita'
  if (name.includes('paloma')) return 'Paloma'
  if (name.includes('negroni')) return 'Negroni'
  if (name.includes('martini')) return 'Martini'
  if (name.includes('mule')) return 'Mule'
  if (name.includes('toddy') || name.includes('hot toddy')) return 'Hot Cocktail'
  if (name.includes('clericot')) return 'Wine Cocktail'
  if (name.includes('spritz')) return 'Spritz'
  if (name.includes('highball')) return 'Highball'
  if (name.includes('michelada')) return 'Beer Cocktail'
  if (name.includes('sangria')) return 'Wine Cocktail'
  if (name.includes('old fashioned') || name.includes('old-fashioned')) return 'Old Fashioned'
  if (name.includes('sour')) return 'Sour'
  if (name.includes('punch') || name.includes('ponche')) return 'Punch'
  if (name.includes('flip')) return 'Flip'
  if (name.includes('cobbler')) return 'Cobbler'
  if (name.includes('collins')) return 'Collins'
  if (name.includes('shot') || name.includes('shooter')) return 'Shot'
  if (name.includes('daiquiri') || name.includes('daikiri')) return 'Daiquiri'
  if (name.includes('cosmo')) return 'Martini'
  if (name.includes('rocks')) return 'Old Fashioned'
  if (name.includes('julep')) return 'Julep'
  if (name.includes('smash')) return 'Smash'
  if (name.includes('sparkle') || name.includes('champagne')) return 'Sparkling'
  if (name.includes('espresso') || name.includes('mexpresso')) return 'Coffee Cocktail'

  // 2. Ingredient-pattern match
  const hasTriple = hasMatch(ings, /triple\s*sec|cointreau|curaçao|curacao|grand\s*marnier/i)
  const hasLime = hasMatch(ings, /\blime\b/i)
  const hasAgave = hasMatch(ings, /\bagave\s+(?:syrup|honey|nectar)\b/i)
  const hasEggWhite = hasMatch(ings, /egg\s*white/i)
  const hasWholeEgg = hasMatch(ings, /\bwhole\s+egg|\b1\s+egg\b|^egg$/i) && !hasEggWhite
  const hasHotWater = hasMatch(ings, /hot\s*water|hot\s*tea|hot\s*hibiscus|pour-?over\s*coffee/i) || glass === 'mug'
  const hasColdBrew = hasMatch(ings, /cold\s*brew|espresso|coffee\s*liqu|coffee\s*bean/i)
  const hasGingerBeer = hasMatch(ings, /ginger\s*beer/i)
  const hasLager = hasMatch(ings, /\blager|cerveza|victoria\s*beer|mexican\s*beer|\bbeer\b/i)
  const hasGrapefruitSoda = hasMatch(ings, /grapefruit\s*soda|squirt|topo\s*chico/i)
  const hasTonic = hasMatch(ings, /tonic\s*water|tonic$/i)
  const hasSoda = hasMatch(ings, /soda\s*water|club\s*soda|sparkling\s*water/i)
  const hasChampagne = hasMatch(ings, /champagne|prosecco|cava|sparkling\s*wine|sparkling$/i)
  const hasWine = hasMatch(ings, /\bred\s*wine|rosé|rose\s*wine|zinfandel|malbec|syrah|bouquet\s+garni/i)
  const hasCampari = hasMatch(ings, /\bcampari|aperol/i)
  const hasSherry = hasMatch(ings, /\bsherry|fino|manzanilla|oloroso|amontillado|pedro\s*xim/i)
  const hasVermouth = hasMatch(ings, /vermouth|lillet|cinzano|martini\s*(?:blanco|dry|rosso|bianco)|carpano/i)
  const hasMezcal = hasMatch(ings, /mezcal|sotol|raicilla/i)
  const hasCitrus = hasMatch(ings, /\b(?:lime|lemon|grapefruit|orange|yuzu|bergamot)\b/i)
  const hasSyrup = hasMatch(ings, /syrup|nectar|honey|simple/i)
  const ingCount = ings.length

  // Beer base
  if (hasLager) return 'Beer Cocktail'

  // Hot cocktails
  if (hasHotWater) return 'Hot Cocktail'

  // Coffee
  if (hasColdBrew) return 'Coffee Cocktail'

  // Wine-forward
  if (hasWine && hasChampagne === false) return 'Wine Cocktail'

  // Mule
  if (hasGingerBeer && hasLime) return 'Mule'

  // Sparkling-topped cocktails
  if (hasChampagne && ingCount <= 5) return 'Sparkling'

  // Paloma — grapefruit soda OR (grapefruit juice + tequila base + soda/lime)
  if (hasGrapefruitSoda || (hasMatch(ings, /grapefruit\s*juice/i) && (hasSoda || hasLime))) {
    return 'Paloma'
  }

  // Negroni: Campari + vermouth
  if (hasCampari && hasVermouth) return 'Negroni'

  // Martini: stirred, vermouth-forward, no citrus juice
  if (hasVermouth && !hasCitrus && !hasEggWhite && /stir/i.test(methodText)) {
    return 'Martini'
  }

  // Highball with tonic/soda (not a Spritz-shape)
  if ((hasTonic || hasSoda) && ingCount <= 5 && !hasEggWhite) {
    return 'Highball'
  }

  // Margarita — must have Cointreau/TripleSec + lime OR name includes
  if (hasTriple && hasLime) return 'Margarita'

  // Flip — whole egg, no citrus split
  if (hasWholeEgg) return 'Flip'

  // Old Fashioned family — no citrus juice, no egg, stirred or built
  if (!hasCitrus && !hasEggWhite && ingCount >= 2 && ingCount <= 5) {
    // Any non-shake method, or no explicit method → treat as stirred
    if (/stir|build/i.test(methodText) || !/shake/i.test(methodText)) {
      return 'Old Fashioned'
    }
  }

  // Sour — citrus + ANY sweet element (syrup, honey, agave, liqueur, sweet wine)
  const hasSweet = hasSyrup || hasMatch(ings, /liqu[eo]r|liqueur|piloncillo|falernum|chartreuse|aperol|campari|amaro|limoncello|triple|curaçao|curacao|cointreau|grand\s*marnier|maraschino|st[-\s]*germain|maraschino|cassis|grenadine|bergamot|violet|creme|crème|pamplemousse|italicus|amontillado/i)
  if (hasCitrus && hasSweet) return 'Sour'

  // Egg-white cocktail without citrus → Silver Sour / Flip-adjacent
  if (hasEggWhite && !hasCitrus) return 'Flip'

  // Sparkling fallback
  if (hasChampagne) return 'Sparkling'

  // Short cocktail with bitters + sweetener → Old Fashioned
  const hasBitters = hasMatch(ings, /\bbitter|angostura|peychaud|orange\s*bitters|mole\s*bitters/i)
  if (hasBitters && ingCount <= 5 && !hasCitrus) return 'Old Fashioned'

  // Tea-forward cocktails (non-hot) → Signature but consider Tea Cocktail
  if (hasMatch(ings, /chamomile|green\s*tea|earl\s*grey|oolong|hibiscus\s*tea|rose\s*tea/i) && hasCitrus) {
    return 'Sour'
  }

  // Cream / horchata / milk-punch style → Milk Punch
  if (hasMatch(ings, /horchata|coconut\s*milk|cream|milk|condensed|atole/i) && !hasCitrus) {
    return 'Milk Punch'
  }

  // Keep current if it's a specific non-Signature value
  const current = cocktail.category
  if (current && current !== 'Signature' && current !== 'null') return current

  return 'Signature'
}

// ─── Consolidate case-variants ──────────────────────────────────────
const CASE_MAP = {
  'hot toddy': 'Hot Cocktail',
  'hot cocktail': 'Hot Cocktail',
}

// ─── Apply ──────────────────────────────────────────────────────────
let changed = 0
const dist = {}
for (const c of cocktails) {
  const ings = ingByCocktail.get(c.id) ?? []
  let cat = classify(c, ings)
  const normalized = CASE_MAP[cat.toLowerCase()] ?? cat
  dist[normalized] = (dist[normalized] ?? 0) + 1

  if (normalized !== c.category) {
    await admin.from('cocktails').update({ category: normalized }).eq('id', c.id)
    changed++
  }
}

console.log(`✓ ${changed} cocktails reclassified\n\nDistribution:`)
for (const [k, v] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${v.toString().padStart(4)} ${k}`)
}
