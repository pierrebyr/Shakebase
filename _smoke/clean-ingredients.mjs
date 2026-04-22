// Clean up ingredient rows introduced by xlsx3 import:
//   1. Strip leading bullets/dashes/tabs ("•\t", "- ", "* ")
//   2. Remove meta-lines (Garnish:, Glassware:, Ice:, Preparation:, For:, Note:)
//      and use them to populate the proper cocktail fields.
//   3. Truncate trailing "X for garnish" clauses from long ingredient names.

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
  .select('id, slug, name, glass_type, garnish')
  .eq('workspace_id', ws.id)

// Paginate ingredients
let allIngs = []
for (let page = 0; ; page++) {
  const { data } = await admin
    .from('cocktail_ingredients')
    .select('id, cocktail_id, position, custom_name, amount_text')
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

const META_RE = /^(?:garnish|glassware|ice|preparation|serve|note|method|base|prep|instructions?|for)\s*:\s*(.+)$/i
const BULLET_RE = /^(?:[•\t\*\-\u2022]\s*)+/
const GARNISH_SUFFIX_RE = /\s+(?:and\s+)?(?:spiraled\s+)?(?:[\w\s]+?)\s+for\s+garnish\.?$/i

let cleanedIngs = 0, setGarnish = 0, setGlass = 0
for (const c of cocktails) {
  const ings = ingByCocktail.get(c.id) ?? []
  let patch = {}
  const toUpdate = []
  const toDelete = []

  for (const i of ings) {
    let name = (i.custom_name ?? '').trim()
    // Strip leading bullets
    const originalName = name
    name = name.replace(BULLET_RE, '').trim()

    // Detect meta
    const meta = name.match(META_RE)
    if (meta) {
      const key = name.split(':')[0].toLowerCase().trim()
      const val = meta[1].trim()
      if (key === 'garnish' && !c.garnish) {
        patch.garnish = val.charAt(0).toUpperCase() + val.slice(1)
        setGarnish++
      } else if ((key === 'glassware' || key === 'glass') && (!c.glass_type || c.glass_type === 'Coupe')) {
        // Normalize common glass names
        const g = val.toLowerCase()
        if (g.includes('old fashion') || g.includes('rocks')) patch.glass_type = 'Old Fashioned'
        else if (g.includes('coupe') || g.includes('coup')) patch.glass_type = 'Coupe'
        else if (g.includes('highball') || g.includes('collins') || g.includes('high-ball')) patch.glass_type = 'Highball'
        else if (g.includes('nick') && g.includes('nora')) patch.glass_type = 'Nick & Nora'
        else if (g.includes('martini')) patch.glass_type = 'Martini'
        else if (g.includes('flute')) patch.glass_type = 'Flute'
        else if (g.includes('wine') || g.includes('tulip')) patch.glass_type = 'Wine'
        else if (g.includes('mug')) patch.glass_type = 'Mug'
        else if (g.includes('pilsner') || g.includes('pint')) patch.glass_type = 'Pilsner'
        else patch.glass_type = val.charAt(0).toUpperCase() + val.slice(1)
        setGlass++
      }
      // Always delete meta-like lines
      toDelete.push(i.id)
      continue
    }

    // Detect trailing "... for garnish" suffix. Strategy: find the LAST
    // occurrence of a garnish-indicating word (peel / twist / slice / sprig /
    // wheel / zest / leaf / spiral / rim) and split there.
    const forGarnishMatch = name.match(/^(.+?)\s+((?:[A-Za-z]+\s+)*(?:peel|twist|slice|sprig|wheel|zest|leaf|rim|spiral|peels|twists|slices|sprigs|wheels|zests|leaves|rims|spirals|dust|shaving|shavings)(?:\s+[^.]*?)?)\s+for\s+garnish\.?$/i)
    if (forGarnishMatch && forGarnishMatch[1].length > 8) {
      name = forGarnishMatch[1].replace(/\s+$/, '')
      if (!c.garnish) {
        const gar = forGarnishMatch[2].trim()
        if (gar.length > 2 && gar.length < 80) {
          patch.garnish = gar.charAt(0).toUpperCase() + gar.slice(1)
          setGarnish++
        }
      }
    }

    if (name !== originalName) {
      toUpdate.push({ id: i.id, custom_name: name })
    }
  }

  // Apply updates
  for (const u of toUpdate) {
    const { error } = await admin
      .from('cocktail_ingredients')
      .update({ custom_name: u.custom_name })
      .eq('id', u.id)
    if (!error) cleanedIngs++
  }
  for (const delId of toDelete) {
    await admin.from('cocktail_ingredients').delete().eq('id', delId)
    cleanedIngs++
  }
  if (Object.keys(patch).length > 0) {
    await admin.from('cocktails').update(patch).eq('id', c.id)
  }
}

console.log(`✓ ${cleanedIngs} ingredient rows cleaned/removed`)
console.log(`✓ ${setGarnish} garnish fields populated from meta`)
console.log(`✓ ${setGlass} glass fields populated from meta`)
