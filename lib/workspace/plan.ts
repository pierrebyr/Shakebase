import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export type Plan = 'creator' | 'starter' | 'studio' | 'enterprise'

// Caps applied server-side per plan. Enforced in the mutation actions
// that create billable resources so a free-tier workspace can't sneak
// past the UI limits by calling the server action directly.
export const PLAN_CAPS: Record<
  Plan,
  { cocktails: number | null; seats: number | null; venues: number | null }
> = {
  creator: { cocktails: 25, seats: 1, venues: 1 },
  starter: { cocktails: 200, seats: 5, venues: 1 },
  studio: { cocktails: null, seats: null, venues: null },
  enterprise: { cocktails: null, seats: null, venues: null },
}

export function planLabel(plan: Plan): string {
  return plan === 'creator'
    ? 'Creator'
    : plan === 'starter'
      ? 'Starter'
      : plan === 'studio'
        ? 'Studio'
        : 'Enterprise'
}

// Returns an error message if the workspace has reached its cocktail
// cap, otherwise null. Uses the admin client so we count every row
// including archived (archived still takes a slot — prevents a user
// from gaming the cap by archiving drafts).
export async function checkCocktailCap(
  workspaceId: string,
  plan: Plan,
): Promise<string | null> {
  const cap = PLAN_CAPS[plan].cocktails
  if (cap == null) return null
  const admin = createAdminClient()
  const { count } = await admin
    .from('cocktails')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
  const current = count ?? 0
  if (current >= cap) {
    return `Your ${planLabel(plan)} plan is capped at ${cap} cocktails. Upgrade to add more.`
  }
  return null
}
