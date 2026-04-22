// Clean up creators:
//   1. Unlink the "-" placeholder creator from cocktails, then delete it.
//   2. Merge obvious duplicates (encoding variants, spelling variants) into
//      the canonical record. Repoint all linked cocktails.
//   3. Delete creators with zero cocktails AND no bio/awards/specialties.
//
// Run: node --env-file=.env.local _smoke/clean-creators.mjs

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

// ─── 1. "-" placeholder ──────────────────────────────────────────────
const { data: dashCreator } = await admin
  .from('creators')
  .select('id')
  .eq('workspace_id', ws.id)
  .eq('name', '-')
  .maybeSingle()
if (dashCreator) {
  const { data: unlinked } = await admin
    .from('cocktails')
    .update({ creator_id: null })
    .eq('creator_id', dashCreator.id)
    .select('id')
  console.log(`· unlinked "${dashCreator.id}" from ${unlinked?.length ?? 0} cocktails`)
  await admin.from('creators').delete().eq('id', dashCreator.id)
  console.log('- deleted "-" placeholder creator')
}

// ─── 2. Merge duplicates ────────────────────────────────────────────
// Each entry: aliases → canonical name (first one must exist or be created)
const MERGE_GROUPS = [
  { canonical: 'José Luis León', aliases: ['Jose Luis Leon'] },
  { canonical: 'César Ponce', aliases: ['Cesar Ponce', 'Cesar Ponec'] },
  { canonical: 'Óscar Escobar', aliases: ['Oscar Escobar'] },
  { canonical: 'Germán Ortega', aliases: ['German Ortega'] },
  { canonical: 'Óscar Valle', aliases: ['Oscar Valle'] },
  { canonical: 'Luis Franklin Hernández', aliases: ['Luid Franklin Hernández'] },
  { canonical: 'Ángela Díaz', aliases: ['Angela Díaz'] },
  { canonical: 'Scott Villalobos', aliases: ['Scott Villaobos'] },
  { canonical: 'Osvaldo Vázquez', aliases: ['Psvaldo Vázquez', 'Osvaldo Vazquez'] },
  { canonical: 'Jim Meehan', aliases: ['Jum Meehan'] },
  { canonical: 'Mike Espinoza', aliases: ['Miguel Espinoza'] },
  { canonical: 'Miguel Angel Gómez', aliases: ['Miguel Angel Gomez'] },
  { canonical: 'Raúl Torrecilla', aliases: ['Raél Torrecilla'] },
  { canonical: 'Elena Reygadas', aliases: ['Elena Reygadas y Johan Valderrábano', 'Elena Reygadas y Johan Valderrabano'] },
  { canonical: 'Jose Luis Martinez Martinez', aliases: ['Julian Cox& Jorge Vallejo', 'Julian Cox & Jorge Vallejo'] }, // not really duplicates — leave
]

// Actually remove the last erroneous merge
MERGE_GROUPS.pop()

for (const group of MERGE_GROUPS) {
  const { data: canonical } = await admin
    .from('creators')
    .select('id')
    .eq('workspace_id', ws.id)
    .eq('name', group.canonical)
    .is('deleted_at', null)
    .maybeSingle()
  if (!canonical) {
    console.warn(`! canonical "${group.canonical}" not found — skip`)
    continue
  }

  for (const alias of group.aliases) {
    const { data: dup } = await admin
      .from('creators')
      .select('id')
      .eq('workspace_id', ws.id)
      .eq('name', alias)
      .is('deleted_at', null)
      .maybeSingle()
    if (!dup) continue
    // Repoint cocktails
    const { data: repointed } = await admin
      .from('cocktails')
      .update({ creator_id: canonical.id })
      .eq('creator_id', dup.id)
      .select('id')
    // Delete duplicate
    await admin.from('creators').delete().eq('id', dup.id)
    console.log(`~ merged "${alias}" → "${group.canonical}" (${repointed?.length ?? 0} cocktails)`)
  }
}

// ─── 3. Delete 0-cocktail creators without info ─────────────────────
const { data: allCreators } = await admin
  .from('creators')
  .select('id, name, bio, specialties, awards, book, philosophy, role, venue')
  .eq('workspace_id', ws.id)
  .is('deleted_at', null)

const { data: cocktails } = await admin
  .from('cocktails')
  .select('creator_id')
  .eq('workspace_id', ws.id)
const linked = new Set(cocktails.map((c) => c.creator_id).filter(Boolean))

let orphanDeleted = 0
for (const c of allCreators) {
  if (linked.has(c.id)) continue
  const hasBio = c.bio && c.bio.trim().length > 0
  const hasSpec = c.specialties && c.specialties.length > 0
  const hasAwards = c.awards && c.awards.length > 0
  const hasPhil = c.philosophy && c.philosophy.trim().length > 0
  const hasBook = c.book && c.book.title
  const hasRole = c.role && c.role !== 'Mixologist' // role is seeded as default
  if (hasBio || hasSpec || hasAwards || hasPhil || hasBook || hasRole) continue
  await admin.from('creators').delete().eq('id', c.id)
  console.log(`- orphan deleted: ${c.name}`)
  orphanDeleted++
}

console.log(`\n✓ ${orphanDeleted} orphan creators removed`)

const { count: final } = await admin
  .from('creators')
  .select('*', { count: 'exact', head: true })
  .eq('workspace_id', ws.id)
  .is('deleted_at', null)
console.log(`→ creator count now: ${final}`)
