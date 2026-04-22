// Create Eli Martínez (Rubra) creator and link to Piña Traviesa.
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

const { data: existing } = await admin
  .from('creators')
  .select('id')
  .eq('workspace_id', ws.id)
  .ilike('name', 'Eli Martínez')
  .maybeSingle()

let creatorId = existing?.id
if (!creatorId) {
  const { data: inserted, error } = await admin
    .from('creators')
    .insert({
      workspace_id: ws.id,
      name: 'Eli Martínez',
      role: 'Bartender',
      venue: 'Rubra',
      city: 'Mexico City',
      country: 'Mexico',
      bio: 'Bartender at Rubra in Mexico City — part of the 200 Copas by Casa Dragones cocktail collaboration.',
    })
    .select('id')
    .single()
  if (error) {
    console.error('! creator insert failed:', error.message)
    process.exit(1)
  }
  creatorId = inserted.id
  console.log('+ Eli Martínez creator created')
} else {
  console.log('· Eli Martínez exists')
}

const { error: linkErr } = await admin
  .from('cocktails')
  .update({ creator_id: creatorId })
  .eq('workspace_id', ws.id)
  .eq('slug', 'pina-traviesa')
if (linkErr) {
  console.error('! link failed:', linkErr.message)
  process.exit(1)
}
console.log('✓ Piña Traviesa linked to Eli Martínez')
