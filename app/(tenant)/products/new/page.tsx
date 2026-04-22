import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { AddProductForm } from './AddProductForm'
import { Icon } from '@/components/icons'
import { SuggestProductModal } from '@/components/catalog/SuggestProductModal'
import { MySuggestions } from '@/components/catalog/MySuggestions'

type GlobalProductRow = {
  id: string
  brand: string
  expression: string
  category: string
  abv: number | null
  origin: string | null
}

export default async function AddProductPage() {
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()

  const [{ data: globals }, { data: workspacePs }] = await Promise.all([
    supabase
      .from('global_products')
      .select('id, brand, expression, category, abv, origin')
      .order('brand')
      .order('expression'),
    supabase.from('workspace_products').select('global_product_id').eq('workspace_id', workspace.id),
  ])

  const products = (globals ?? []) as unknown as GlobalProductRow[]
  const alreadyAddedIds = ((workspacePs ?? []) as unknown as { global_product_id: string }[]).map(
    (r) => r.global_product_id,
  )

  return (
    <div className="page fade-up">
      <div className="page-head">
        <Link
          href="/products"
          className="row gap-sm"
          style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}
        >
          <Icon name="chevron-l" size={13} />
          Products
        </Link>
        <div className="page-kicker">Shared catalog</div>
        <h1 className="page-title">Add a bottle.</h1>
        <p className="page-sub">
          Search {products.length} brands from the ShakeBase catalog. Pick one and capture your
          workspace-specific stock, par level, and cost.
        </p>
      </div>

      <AddProductForm products={products} alreadyAddedIds={alreadyAddedIds} />

      <div
        style={{
          marginTop: 28,
          padding: 18,
          borderTop: '1px solid var(--line-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div className="col" style={{ gap: 2, maxWidth: '52ch' }}>
          <div className="panel-title">Missing from the shared catalog?</div>
          <p style={{ fontSize: 12.5, color: 'var(--ink-3)', margin: 0, lineHeight: 1.55 }}>
            Suggest a bottle the whole ShakeBase community should see. A moderator approves or
            merges it with an existing entry.
          </p>
        </div>
        <SuggestProductModal />
      </div>

      <div style={{ marginTop: 28 }}>
        <MySuggestions kind="product" />
      </div>
    </div>
  )
}
