// Seed workspace_products for the Casa Dragones workspace — picks up the 5
// Casa Dragones expressions from the global catalog and inserts the stock/par
// data from the design spec. Safe to re-run: upserts.
//
// Run: node --env-file=.env.local _smoke/seed-casa-dragones-stock.mjs

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const STOCK_BY_EXPRESSION = {
  Joven: { stock: 14, par: 12, menu_price_cents: 29500 },
  Blanco: { stock: 22, par: 18, menu_price_cents: 13500 },
  'Reposado Mizunara': { stock: 6, par: 6, menu_price_cents: 42500 },
  'Añejo Barrel Blend': { stock: 9, par: 10, menu_price_cents: 34500 },
  'Blanco Cask-Strength': { stock: 4, par: 6, menu_price_cents: 18000 },
}

const { data: workspace } = await admin
  .from('workspaces')
  .select('id, slug, name')
  .eq('slug', 'casa-dragones')
  .maybeSingle()
if (!workspace) {
  console.error('No workspace slug "casa-dragones" found — sign up for one first')
  process.exit(1)
}
console.log(`→ workspace ${workspace.name} (${workspace.id})`)

const { data: products } = await admin
  .from('global_products')
  .select('id, expression, suggested_cost_cents')
  .eq('brand', 'Casa Dragones')
if (!products || products.length === 0) {
  console.error('No Casa Dragones products in global catalog — run migrations first')
  process.exit(1)
}

for (const p of products) {
  const stockData = STOCK_BY_EXPRESSION[p.expression]
  if (!stockData) {
    console.log(`  skip ${p.expression} (no stock entry)`)
    continue
  }

  const row = {
    workspace_id: workspace.id,
    global_product_id: p.id,
    stock: stockData.stock,
    par: stockData.par,
    cost_cents: p.suggested_cost_cents,
    menu_price_cents: stockData.menu_price_cents,
  }

  const { error } = await admin
    .from('workspace_products')
    .upsert(row, { onConflict: 'workspace_id,global_product_id' })

  if (error) {
    console.error(`  ✗ ${p.expression}: ${error.message}`)
  } else {
    console.log(`  ✓ ${p.expression} · ${stockData.stock} on hand (par ${stockData.par})`)
  }
}

console.log('\n✅ Casa Dragones stock seeded')
