import { requireUser } from '@/lib/auth/session'
import { getCurrentWorkspace } from '@/lib/workspace/context'
import { SettingsNav } from './SettingsNav'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const workspace = await getCurrentWorkspace()
  const isOwner = workspace.owner_user_id === user.id

  return (
    <div className="page fade-up">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
          gap: 40,
          maxWidth: 1080,
        }}
        className="settings-layout"
      >
        <SettingsNav isOwner={isOwner} />
        <div className="col" style={{ gap: 20, minWidth: 0 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
