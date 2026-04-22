'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { getUser } from '@/lib/auth/session'

const AppearanceSchema = z.object({
  density: z.enum(['comfortable', 'compact']),
  typography: z.enum(['default', 'editorial', 'technical']),
  accent: z.enum(['amber', 'agave', 'hibiscus', 'lagoon']),
  reduce_motion: z.string().optional(),
})

export type AppearanceResult = { ok: true } | { ok: false; error: string }

export async function updateAppearanceAction(
  _: unknown,
  formData: FormData,
): Promise<AppearanceResult> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  const workspace = await getCurrentWorkspace()

  const parsed = AppearanceSchema.safeParse({
    density: formData.get('density'),
    typography: formData.get('typography'),
    accent: formData.get('accent'),
    reduce_motion: String(formData.get('reduce_motion') ?? ''),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('workspace_settings')
    .upsert({
      workspace_id: workspace.id,
      density: parsed.data.density,
      typography: parsed.data.typography,
      accent: parsed.data.accent,
      reduce_motion: parsed.data.reduce_motion === 'on',
    } as never)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/settings/appearance')
  return { ok: true }
}
