// Spread Casa Dragones cocktails' created_at timestamps across the last
// 12 months so the Analytics timeline looks alive (instead of 332 all
// dropped on the same day from the seed import).
//
// Weighted distribution: more activity in recent months, taper on the
// far-back ones — roughly like a real growing library.

import { createClient } from '@supabase/supabase-js'

const DRY = process.argv.includes('--dry')

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const { data: ws } = await admin
  .from('workspaces')
  .select('id, name')
  .eq('slug', 'casa-dragones')
  .maybeSingle()
if (!ws) {
  console.error('No workspace casa-dragones')
  process.exit(1)
}

const { data: cocktails } = await admin
  .from('cocktails')
  .select('id, name')
  .eq('workspace_id', ws.id)
  .order('id', { ascending: true })

const rows = (cocktails ?? [])
console.log(`→ ${rows.length} cocktails to redistribute`)

// Seeded RNG for reproducibility
let seed = 1776
function rnd() {
  seed = (seed * 1664525 + 1013904223) % 2 ** 32
  return seed / 2 ** 32
}

// Weights per month (index 0 = 11 months ago = oldest, index 11 = current).
// Noisy plateau rather than a smooth tapered curve so the chart looks
// organic instead of linear.
const monthWeights = [0.6, 1.3, 0.5, 1.1, 0.8, 1.4, 0.7, 1.2, 1.5, 0.9, 1.1, 0.6]
const totalWeight = monthWeights.reduce((s, w) => s + w, 0)

const now = new Date()
// Pre-compute month boundaries
const monthRanges = []
for (let i = 11; i >= 0; i--) {
  const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
  const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
  monthRanges.push({ start, end })
}

// Per-cocktail weighted-random month assignment — natural variance
// around the weights instead of a deterministic per-bucket count.
const cumulative = []
{
  let acc = 0
  for (const w of monthWeights) {
    acc += w
    cumulative.push(acc / totalWeight)
  }
}

function pickMonth() {
  const r = rnd()
  for (let m = 0; m < cumulative.length; m++) {
    if (r <= cumulative[m]) return m
  }
  return cumulative.length - 1
}

// Shuffle cocktails deterministically
const shuffled = [...rows]
for (let i = shuffled.length - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1))
  ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
}

// Assign each cocktail to a random month (weighted) and a random day
const updates = []
const countsPerMonth = Array(12).fill(0)
for (const c of shuffled) {
  const m = pickMonth()
  countsPerMonth[m]++
  const { start, end } = monthRanges[m]
  const windowMs = end.getTime() - start.getTime()
  const when = new Date(start.getTime() + rnd() * windowMs)
  updates.push({ id: c.id, name: c.name, created_at: when.toISOString() })
}

console.log('→ counts per month (oldest → newest):', countsPerMonth)

if (DRY) {
  console.log(`→ would update ${updates.length} rows`)
  for (const u of updates.slice(0, 10)) console.log(`  ${u.created_at.slice(0, 10)}  ${u.name}`)
  console.log('  …')
  process.exit(0)
}

// Apply
let ok = 0
let fail = 0
for (const u of updates) {
  const { error } = await admin
    .from('cocktails')
    .update({ created_at: u.created_at })
    .eq('id', u.id)
  if (error) { fail++; console.error('!', u.id, error.message) }
  else ok++
  if ((ok + fail) % 100 === 0) console.log(`  … ${ok + fail}/${updates.length}`)
}

console.log(`\n✓ ${ok} updated · ${fail} failed`)
