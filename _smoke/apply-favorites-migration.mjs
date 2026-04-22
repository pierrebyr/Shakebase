// Apply user_cocktail_favorites migration via admin client.
// Uses the pg-meta endpoint to run DDL with the service role key.
import { readFile } from 'node:fs/promises'

const PROJECT_REF = 'xvabacttezunlmluywxl'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY missing')
  process.exit(1)
}

const sql = await readFile(
  './supabase/migrations/20260421155940_user_cocktail_favorites.sql',
  'utf8',
)

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${SERVICE_KEY}`,
  },
  body: JSON.stringify({ query: sql }),
})

const text = await res.text()
console.log('status', res.status)
console.log(text)
