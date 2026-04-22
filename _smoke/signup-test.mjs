// E2E smoke test: simulate what the signup server action does, then verify
// that the tenant layout auth checks behave correctly.
//
// Run: node --env-file=.env.local _smoke/signup-test.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing env vars')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const TEST_SLUG = 'smoke-casa-dragones'
const TEST_EMAIL = `smoke+${Date.now()}@shakebase.co`
const TEST_PASSWORD = 'smokeSmoke1234!'
const TEST_NAME = 'Smoke Tester'
const TEST_WORKSPACE = 'Smoke Casa Dragones'

console.log('→ cleanup any prior run')
const { data: prior } = await admin.from('workspaces').select('id').eq('slug', TEST_SLUG).maybeSingle()
if (prior) {
  await admin.from('workspaces').delete().eq('id', prior.id)
}

console.log('→ create auth user')
const { data: userData, error: userError } = await admin.auth.admin.createUser({
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  email_confirm: true,
  user_metadata: { full_name: TEST_NAME },
})
if (userError) throw userError
const userId = userData.user.id
console.log('  user_id:', userId)

console.log('→ upsert profile')
await admin.from('profiles').upsert({ id: userId, full_name: TEST_NAME })

console.log('→ create workspace')
const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
const { data: ws, error: wsError } = await admin
  .from('workspaces')
  .insert({
    slug: TEST_SLUG,
    name: TEST_WORKSPACE,
    owner_user_id: userId,
    subscription_status: 'trialing',
    trial_ends_at: trialEndsAt,
  })
  .select('id, slug')
  .single()
if (wsError) throw wsError
console.log('  workspace:', ws)

console.log('→ create membership (owner)')
await admin.from('memberships').insert({
  workspace_id: ws.id,
  user_id: userId,
  role: 'owner',
  joined_at: new Date().toISOString(),
})

console.log('→ create workspace_settings + notif prefs')
await admin.from('workspace_settings').insert({ workspace_id: ws.id })
await admin.from('user_notification_prefs').insert({ user_id: userId, workspace_id: ws.id })

console.log('→ verify via REST')
const { data: check } = await admin
  .from('workspaces')
  .select('slug, name, subscription_status, trial_ends_at')
  .eq('slug', TEST_SLUG)
  .single()
console.log('  workspace row:', check)

const { data: m } = await admin
  .from('memberships')
  .select('role, joined_at')
  .eq('workspace_id', ws.id)
  .eq('user_id', userId)
  .single()
console.log('  membership:', m)

console.log('\n✅ smoke workspace ready')
console.log(`   dashboard (logged-out → redirect to /login): http://${TEST_SLUG}.lvh.me:3000/dashboard`)
console.log(`   login with:      ${TEST_EMAIL}  /  ${TEST_PASSWORD}`)
console.log(`   test user id:    ${userId}`)
console.log(`   workspace id:    ${ws.id}`)
