// Global ingredient cleanup:
//   1. Extract leading quantity from custom_name into amount_text
//      "1 egg white" → amount_text=null, name="Egg white" (count-only; skip if already has amount)
//      "3 manzano chile slices" → amount_text="3", name="Manzano chile slices"
//   2. Title Case all ingredient names ("lavender syrup" → "Lavender syrup")
//      (sentence case, capitalize first letter only — proper names preserved)
//   3. Link Casa Dragones ingredients to global_products via global_product_id
//      and normalize custom_name to "Casa Dragones {Expression}".
//
// Run: node --env-file=.env.local _smoke/clean-all-ingredients.mjs

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

// Load all Casa Dragones products
const { data: products } = await admin
  .from('global_products')
  .select('id, expression')
  .eq('brand', 'Casa Dragones')
const productByExpr = new Map()
for (const p of products ?? []) productByExpr.set(p.expression.toLowerCase(), p.id)

function detectCasaDragonesProduct(name) {
  const lc = name.toLowerCase()
  if (!lc.includes('casa dragones') && !lc.includes('dragones')) return null
  // Order matters: most specific first
  if (lc.includes('reposado mizunara') || (lc.includes('mizunara') && lc.includes('reposado'))) {
    return { id: productByExpr.get('reposado mizunara'), display: 'Casa Dragones Reposado Mizunara' }
  }
  if (lc.includes('mizunara')) {
    return { id: productByExpr.get('reposado mizunara'), display: 'Casa Dragones Reposado Mizunara' }
  }
  if (lc.includes('reposado')) {
    return { id: productByExpr.get('reposado mizunara'), display: 'Casa Dragones Reposado Mizunara' }
  }
  if (lc.includes('añejo barrel blend') || lc.includes('anejo barrel blend')) {
    return { id: productByExpr.get('añejo barrel blend'), display: 'Casa Dragones Añejo Barrel Blend' }
  }
  if (lc.includes('añejo') || lc.includes('anejo')) {
    return { id: productByExpr.get('añejo barrel blend'), display: 'Casa Dragones Añejo Barrel Blend' }
  }
  if (lc.includes('cask strength') || lc.includes('cask-strength')) {
    return { id: productByExpr.get('blanco cask-strength'), display: 'Casa Dragones Blanco Cask-Strength' }
  }
  if (lc.includes('joven')) {
    return { id: productByExpr.get('joven'), display: 'Casa Dragones Joven' }
  }
  if (lc.includes('blanco')) {
    return { id: productByExpr.get('blanco'), display: 'Casa Dragones Blanco' }
  }
  // "Casa Dragones" alone defaults to Blanco
  return { id: productByExpr.get('blanco'), display: 'Casa Dragones Blanco' }
}

// Extract leading quantity-with-unit or bare count from custom_name.
// Returns { amount_text, name } where amount_text may be null.
function splitLeadingQuantity(rawName, hasExistingAmount) {
  const name = rawName.trim()

  // Matches "1 egg white", "3 slices", "2 dashes", "5 drops", "4 oz", "¼ oz", etc.
  // Keep amount_text separate, strip from name.
  // Pattern: digits/fractions + optional unit + space + word
  const qtyUnitRe =
    /^([\d\s½¼¾⅓⅔.\-⁄\/]+\s*(?:oz|tsp|tbsp|ml|g|kg|cl|fl|cups?|dash(?:es)?|drops?|barspoon|bar\s*spoon|bsp|pinch|splash|parts?|pc|pieces?|slices?|sprigs?|leaves?|leaf|cube(?:s)?|wheel(?:s)?|twist(?:s)?|peel(?:s)?|zest(?:s)?|dollop(?:s)?|scoop(?:s)?|stick(?:s)?|sprig(?:s)?|cubito(?:s)?|taza(?:s)?|pizca(?:s)?)\.?)\s+(.+)$/i
  const m1 = name.match(qtyUnitRe)
  if (m1 && !hasExistingAmount) {
    return { amount_text: m1[1].trim(), name: m1[2].trim() }
  }

  // Bare count prefix: "1 egg white", "3 manzano chile slices", "2 pieces..."
  // Only split if followed by clearly-ingredient words AND no existing amount.
  const bareCountRe = /^(\d+)\s+(.+)$/
  const m2 = name.match(bareCountRe)
  if (m2 && !hasExistingAmount) {
    const count = m2[1]
    const rest = m2[2].trim()
    // Don't split if the rest starts with a unit (already captured by qtyUnitRe)
    // or if rest is a brand/product name (avoid "16 Reasons" problems)
    if (!/^(?:oz|tsp|tbsp|ml|g|cl|barspoon|dash|drops?|sprig|slice|leaf|cube|wheel|cup)/i.test(rest)) {
      return { amount_text: count, name: rest }
    }
  }

  return { amount_text: null, name }
}

// Title-case an ingredient name: capitalize first letter of each significant word,
// keep proper nouns' original case, normalize specific words.
const SMALL_WORDS = new Set([
  'a', 'an', 'the', 'of', 'or', 'and', 'with', 'for', 'in', 'on', 'to', 'by', 'de', 'del', 'la', 'el', 'y',
])
function titleCase(str) {
  if (!str) return str
  return str
    .split(/(\s+)/)
    .map((token, idx) => {
      if (/^\s+$/.test(token)) return token
      // Already mixed-case (e.g. "McDonald", "L'Avant") → leave as-is
      if (/^[A-Z][a-z]+[A-Z]/.test(token) || token.includes('-') || token.includes("'")) {
        return token.charAt(0).toUpperCase() + token.slice(1)
      }
      const lower = token.toLowerCase()
      if (idx !== 0 && SMALL_WORDS.has(lower)) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join('')
}

// Load all ingredients
let allIngs = []
for (let page = 0; ; page++) {
  const { data } = await admin
    .from('cocktail_ingredients')
    .select('id, cocktail_id, position, custom_name, amount_text, amount, unit, global_product_id')
    .range(page * 1000, page * 1000 + 999)
  if (!data || data.length === 0) break
  allIngs.push(...data)
  if (data.length < 1000) break
}

// Scope to Casa Dragones cocktails
const { data: dragonCocktails } = await admin
  .from('cocktails')
  .select('id')
  .eq('workspace_id', ws.id)
const dragonIds = new Set(dragonCocktails.map((c) => c.id))
const targets = allIngs.filter((i) => dragonIds.has(i.cocktail_id))

console.log(`→ processing ${targets.length} ingredient rows`)

let quantitySplit = 0, titleCased = 0, productLinked = 0
for (const ing of targets) {
  if (!ing.custom_name) continue
  const originalName = ing.custom_name
  const hasExistingAmount = !!(ing.amount_text || ing.amount)

  // Step 1: split leading quantity
  const { amount_text, name: afterSplit } = splitLeadingQuantity(originalName, hasExistingAmount)
  let newName = afterSplit
  let newAmountText = ing.amount_text
  if (amount_text && !hasExistingAmount) {
    newAmountText = amount_text
    quantitySplit++
  }

  // Step 2: detect Casa Dragones product
  const productMatch = detectCasaDragonesProduct(newName)
  let newProductId = ing.global_product_id
  if (productMatch && productMatch.id) {
    newName = productMatch.display
    if (ing.global_product_id !== productMatch.id) {
      newProductId = productMatch.id
      productLinked++
    }
  }

  // Step 3: title case (only apply if not a Casa Dragones product line — those
  // we've already normalized)
  if (!productMatch) {
    const cased = titleCase(newName)
    if (cased !== newName) {
      newName = cased
      titleCased++
    }
  }

  // Commit if anything changed
  const hasChanges =
    newName !== originalName ||
    newAmountText !== ing.amount_text ||
    newProductId !== ing.global_product_id

  if (!hasChanges) continue

  const update = { custom_name: newName }
  if (newAmountText !== ing.amount_text) update.amount_text = newAmountText
  if (newProductId !== ing.global_product_id) update.global_product_id = newProductId

  const { error } = await admin
    .from('cocktail_ingredients')
    .update(update)
    .eq('id', ing.id)
  if (error) console.error(`! ${ing.id}:`, error.message)
}

console.log(`✓ ${quantitySplit} leading quantities extracted`)
console.log(`✓ ${titleCased} names title-cased`)
console.log(`✓ ${productLinked} rows linked to Casa Dragones products`)
