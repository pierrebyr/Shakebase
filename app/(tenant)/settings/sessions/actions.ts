'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/session'

export async function signOutOthersAction(): Promise<void> {
  const user = await getUser()
  if (!user) return
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'others' })
  revalidatePath('/settings/sessions')
}
