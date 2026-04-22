// Fix the 7 ingredient rows that still contain "for garnish" suffix.
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

// Load all ingredients, find ones with "for garnish"
let allIngs = []
for (let page = 0; ; page++) {
  const { data } = await admin
    .from('cocktail_ingredients')
    .select('id, cocktail_id, custom_name, position')
    .range(page * 1000, page * 1000 + 999)
  if (!data || data.length === 0) break
  allIngs.push(...data)
  if (data.length < 1000) break
}

const targets = allIngs.filter((i) => /for\s+garnish/i.test(i.custom_name ?? ''))

for (const ing of targets) {
  const name = ing.custom_name.trim()
  // Get current cocktail to see if garnish is empty
  const { data: c } = await admin
    .from('cocktails')
    .select('id, name, garnish')
    .eq('id', ing.cocktail_id)
    .maybeSingle()
  if (!c) continue

  // Special case: Alazan's ingredient contains both ingredient + garnish
  if (/dashfire\s+clove\s+bitters/i.test(name)) {
    // Split: ingredient = "of Dashfire Clove Bitters", garnish = "Spiraled orange peel and cloves"
    await admin
      .from('cocktail_ingredients')
      .update({ custom_name: 'Dashfire Clove Bitters' })
      .eq('id', ing.id)
    if (!c.garnish) {
      await admin
        .from('cocktails')
        .update({ garnish: 'Spiraled orange peel and cloves' })
        .eq('id', c.id)
    }
    console.log(`~ ${c.name}: split ingredient + garnish`)
    continue
  }

  // Default: the whole thing is garnish → move to garnish field, delete ingredient row
  const garnish = name
    .replace(/\s+for\s+garnish\.?$/i, '')
    .replace(/^\d+\s+/, '')
    .trim()
  const capitalized = garnish.charAt(0).toUpperCase() + garnish.slice(1)
  if (!c.garnish) {
    await admin.from('cocktails').update({ garnish: capitalized }).eq('id', c.id)
  }
  await admin.from('cocktail_ingredients').delete().eq('id', ing.id)
  console.log(`~ ${c.name}: moved to garnish → "${capitalized}"`)
}

console.log(`\n✓ ${targets.length} fixed`)
