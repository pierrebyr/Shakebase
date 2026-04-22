// One-off: confirm a user's email so they can sign in.
// Run: node --env-file=.env.local _smoke/confirm-email.mjs <email>

import { createClient } from '@supabase/supabase-js'

const email = process.argv[2]
if (!email) {
  console.error('Usage: node _smoke/confirm-email.mjs <email>')
  process.exit(1)
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// admin.listUsers is paginated. Find the user by email.
const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 })
if (listError) throw listError
const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
if (!user) {
  console.error(`No user with email ${email}`)
  process.exit(1)
}

const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
  email_confirm: true,
})
if (updateError) throw updateError

console.log(`✅ confirmed ${email} (user_id: ${user.id})`)

// Show their workspaces
const { data: memberships } = await admin
  .from('memberships')
  .select('role, joined_at, workspaces(slug, name, subscription_status)')
  .eq('user_id', user.id)
console.log('memberships:')
console.dir(memberships, { depth: 3 })
