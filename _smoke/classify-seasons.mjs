// Heuristic season classification for Casa Dragones cocktails.
//
// Rules (ordered by strength). A cocktail can land in multiple seasons.
//
// WINTER — dark / warm / spiced / cozy
//   coffee, café, espresso, hot, toddy, mulled, mole, chocolate,
//   cacao, eggnog/nog, spiced, cinnamon, clove, star anise, cardamom
//   (when warming), flip, milk punch, Añejo/Reposado+dark profile,
//   holiday/navidad, cream + amaro, whisky riff
//
// SPRING — floral / fresh / green / light
//   floral/flower, rose, elderflower (St-Germain), lavender, violet,
//   chamomile, jasmine, garden, herb-forward (basil, mint, cilantro
//   without citrus overload), pea flower, rhubarb, strawberry-fresh
//
// SUMMER — citrus / tropical / cooling / sparkling
//   paloma, spritz, highball, cooler, frozen, slushy, watermelon,
//   cucumber, pineapple, mango, passion, coconut (light), tonic,
//   soda, seltzer, grapefruit-forward, granita, popsicle/paleta,
//   agua fresca
//
// FALL — harvest / orchard / smoky / roasted / savory
//   apple, pear, fig, pumpkin, maple, persimmon, quince, caramel,
//   cranberry, chai, pumpkin, roasted, smoke/smoky (beyond hint),
//   mole, atole, pan de muerto, day-of-the-dead / muertos
//
// Priority: if multiple rules fire, keep them all (the column is
// text[]). If NONE fire, leave empty — agave classics like the
// Margarita work year-round and shouldn't be forced into a bucket.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')
const OVERWRITE = process.argv.includes('--overwrite')
const WORKSPACE_SLUG = process.argv.find((a) => a.startsWith('--ws='))?.slice(5) ?? 'casa-dragones'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// ─── heuristic matchers ──────────────────────────────────────────────

const WINTER = [
  /\b(coffee|café|cafe|espresso)\b/i,
  /\b(hot|toddy|mulled|mole)\b/i,
  /\b(choco|cacao)\b/i,
  /\b(eggnog|nog|flip)\b/i,
  /\b(milk punch)\b/i,
  /\b(cinnamon|clove|allspice|cardamom)\b/i,
  /\b(añejo|anejo)\b/i,
  /\b(navidad|holiday|christmas|winter)\b/i,
]

const SPRING = [
  /\b(rose|floral|flower|elderflower|lavender|violet|jasmine|chamomile)\b/i,
  /\b(pea flower|butterfly pea)\b/i,
  /\b(st[- ]?germain)\b/i,
  /\b(garden|spring)\b/i,
  /\b(hibiscus|jamaica)\b/i,
  /\b(rhubarb)\b/i,
]

const SUMMER = [
  /\b(paloma|spritz|cooler|highball|frozen|slushy|granita|popsicle|paleta)\b/i,
  /\b(watermelon|cucumber|pineapple|mango|passion|coconut|lychee|guava)\b/i,
  /\b(tonic|soda|seltzer|sparkling|prosecco|topo chico|cava|bubbl)\b/i,
  /\b(grapefruit|tropical)\b/i,
  /\b(agua fresca)\b/i,
  /\b(summer)\b/i,
]

const FALL = [
  /\b(apple|pear|fig|quince|persimmon|cranberry|pumpkin|maple|caramel)\b/i,
  /\b(chai|roasted|pan de muerto|muertos|day of the dead|dia de)\b/i,
  /\b(smok(ed|y))\b/i,
  /\b(atole|piloncillo)\b/i,
  /\b(autumn|fall|harvest)\b/i,
]

function classify(c) {
  const hay = [
    c.name,
    c.category ?? '',
    (c.flavor_profile ?? []).join(' '),
    c.ingredients ?? '',
    c.tasting_notes ?? '',
    c.spirit_base ?? '',
  ]
    .join(' ')
    .toLowerCase()

  const seasons = new Set()

  if (WINTER.some((re) => re.test(hay))) seasons.add('Winter')
  if (SPRING.some((re) => re.test(hay))) seasons.add('Spring')
  if (SUMMER.some((re) => re.test(hay))) seasons.add('Summer')
  if (FALL.some((re) => re.test(hay))) seasons.add('Fall')

  // Guardrails — tropical + coffee would be weird. Remove Summer if
  // Winter AND no explicit summer signal.
  if (seasons.has('Winter') && seasons.size > 1) {
    // Winter tends to dominate — but a spritz with a dash of cinnamon is
    // still a summer drink. So keep multiple only when summer signal is
    // strong (paloma / spritz / highball / tropical).
    const strongSummer = /\b(paloma|spritz|highball|frozen|watermelon|cucumber)\b/i.test(hay)
    if (!strongSummer) seasons.delete('Summer')
  }

  // "mezcal" alone is fall-ish but if it's in a bright citrus build, don't
  // force Fall.
  if (seasons.has('Fall') && /\b(paloma|frozen|spritz)\b/i.test(hay)) {
    seasons.delete('Fall')
  }

  // Order the output consistently.
  const order = ['Spring', 'Summer', 'Fall', 'Winter']
  return order.filter((s) => seasons.has(s))
}

// ─── main ────────────────────────────────────────────────────────────

const { data: ws } = await supabase
  .from('workspaces')
  .select('id, slug, name')
  .eq('slug', WORKSPACE_SLUG)
  .maybeSingle()
if (!ws) {
  console.error(`Workspace "${WORKSPACE_SLUG}" not found.`)
  process.exit(1)
}
console.log(`Workspace: ${ws.name} (${ws.slug}) ${ws.id}`)

// Pull cocktails + their ingredients
const { data: cocktails } = await supabase
  .from('cocktails')
  .select(
    'id, name, season, category, spirit_base, flavor_profile, tasting_notes, ' +
      'cocktail_ingredients(global_ingredient_id, workspace_ingredient_id, custom_name, ' +
      'global_ingredients(name), workspace_ingredients(name))',
  )
  .eq('workspace_id', ws.id)
  .neq('status', 'archived')
  .order('name')

const rows = cocktails ?? []
console.log(`Scanning ${rows.length} cocktails…\n`)

let touched = 0
let unchanged = 0
let skippedExisting = 0
const bySeason = { Spring: 0, Summer: 0, Fall: 0, Winter: 0, none: 0 }

for (const c of rows) {
  const existing = (c.season ?? []).filter(Boolean)
  if (existing.length > 0 && !OVERWRITE) {
    skippedExisting++
    for (const s of existing) bySeason[s] = (bySeason[s] ?? 0) + 1
    continue
  }

  const ings = (c.cocktail_ingredients ?? [])
    .map(
      (i) =>
        i.global_ingredients?.name ??
        i.workspace_ingredients?.name ??
        i.custom_name ??
        '',
    )
    .filter(Boolean)
    .join(', ')

  const proposed = classify({
    name: c.name,
    category: c.category,
    spirit_base: c.spirit_base,
    flavor_profile: c.flavor_profile,
    tasting_notes: c.tasting_notes,
    ingredients: ings,
  })

  if (proposed.length === 0) bySeason.none++
  else for (const s of proposed) bySeason[s] = (bySeason[s] ?? 0) + 1

  const same =
    existing.length === proposed.length &&
    existing.every((s) => proposed.includes(s))
  if (same) {
    unchanged++
    continue
  }

  console.log(
    `  ${c.name}\n    [${existing.join(', ') || '—'}] → [${proposed.join(', ') || '—'}]`,
  )

  if (!DRY_RUN) {
    const { error } = await supabase
      .from('cocktails')
      .update({ season: proposed })
      .eq('id', c.id)
    if (error) {
      console.error(`    ✗ update failed: ${error.message}`)
      continue
    }
  }
  touched++
}

console.log(
  `\n━━━ Done. ${DRY_RUN ? '(DRY RUN — no writes) ' : ''}Updated ${touched}, unchanged ${unchanged}, skipped-existing ${skippedExisting}.`,
)
console.log(`    Distribution: ${JSON.stringify(bySeason)}`)
