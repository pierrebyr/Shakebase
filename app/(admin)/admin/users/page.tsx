import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { OpIcon } from '@/components/admin/Icon'
import { timeAgo } from '@/lib/admin/format'
import { UsersFilter } from './UsersFilter'

type Params = { searchParams: Promise<{ q?: string }> }

export default async function AdminUsersPage({ searchParams }: Params) {
  const admin = createAdminClient()
  const sp = await searchParams
  const q = (sp.q ?? '').trim().toLowerCase()

  const [{ data: userList }, { data: membershipRows }, { data: wsRows }, { data: profileRows }] =
    await Promise.all([
      admin.auth.admin.listUsers({ perPage: 500 }),
      admin.from('memberships').select('user_id, workspace_id, role').not('joined_at', 'is', null),
      admin.from('workspaces').select('id, name'),
      admin.from('profiles').select('id, full_name'),
    ])

  const users = userList.users
  const memberships = (membershipRows ?? []) as {
    user_id: string
    workspace_id: string
    role: string
  }[]
  const wsMap = new Map(((wsRows ?? []) as { id: string; name: string }[]).map((w) => [w.id, w.name]))
  const profiles = ((profileRows ?? []) as { id: string; full_name: string | null }[])
  const profileMap = new Map(profiles.map((p) => [p.id, p.full_name]))

  const filtered = users
    .filter((u) => {
      if (!q) return true
      return (
        u.email?.toLowerCase().includes(q) ||
        u.id.includes(q) ||
        (profileMap.get(u.id) ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const aT = a.last_sign_in_at ?? a.created_at ?? ''
      const bT = b.last_sign_in_at ?? b.created_at ?? ''
      return bT.localeCompare(aT)
    })

  return (
    <div className="op-page op-fade-up">
      <div className="op-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            {users.length} platform users
          </div>
          <h1 className="op-title">Users</h1>
          <p className="op-sub">
            Look up anyone by email or ID. See their memberships, reset password, lock the
            account.
          </p>
        </div>
      </div>

      <UsersFilter defaultQuery={q} resultCount={filtered.length} />

      <div className="op-card" style={{ padding: 0 }}>
        <div className="op-t-wrap">
          <table className="op-t">
            <thead>
              <tr>
                <th>User</th>
                <th>Memberships</th>
                <th>Created</th>
                <th>Last seen</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="op-empty">
                    No users match that query.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const userMem = memberships.filter((m) => m.user_id === u.id)
                  const initials = (u.email ?? '??').slice(0, 2).toUpperCase()
                  const name = profileMap.get(u.id) ?? u.email ?? u.id.slice(0, 8)
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 999,
                              background: 'var(--op-elev)',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: 11,
                              fontWeight: 500,
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{name}</div>
                            <div className="mut mono" style={{ fontSize: 10.5 }}>
                              {u.email ?? u.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {userMem.length === 0 ? (
                          <span className="op-chip warn">No workspaces</span>
                        ) : (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {userMem.slice(0, 3).map((m, i) => (
                              <Link
                                key={i}
                                href={`/admin/workspaces/${m.workspace_id}`}
                                className="op-chip"
                              >
                                {wsMap.get(m.workspace_id) ?? '—'} · {m.role}
                              </Link>
                            ))}
                            {userMem.length > 3 && (
                              <span className="op-chip">+{userMem.length - 3}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="mut mono" style={{ fontSize: 11.5 }}>
                        {timeAgo(u.created_at)}
                      </td>
                      <td className="mut mono" style={{ fontSize: 11.5 }}>
                        {timeAgo(u.last_sign_in_at)}
                      </td>
                      <td>
                        <button type="button" className="op-btn ghost sm">
                          <OpIcon name="more" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
