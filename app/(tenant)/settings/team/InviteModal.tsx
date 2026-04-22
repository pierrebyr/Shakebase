'use client'

import { useActionState, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/icons'
import { inviteTeammateAction, type InviteResult } from './actions'

const initialState: InviteResult = { ok: true, provider: 'console', acceptUrl: '' } as InviteResult

const ROLES = [
  { id: 'editor', name: 'Editor', desc: 'Create, edit, organise' },
  { id: 'viewer', name: 'Viewer', desc: 'Read-only + comment' },
] as const

export function InviteModal({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(inviteTeammateAction, initialState)
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', esc)
    // Lock body scroll while the modal is open so the background can't
    // shift under it (the /settings/team page is long enough to scroll).
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', esc)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const emailOk = /.+@.+\..+/.test(email)

  // Render to document.body via a portal so the modal escapes any ancestor
  // transform/filter context (e.g. .page.fade-up's animation sets a
  // transform, which makes position: fixed positioned relative to the page
  // instead of the viewport — that's why the modal appeared inside the
  // scroll column and the backdrop blur didn't cover the sidebar nav).
  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(20,15,10,0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        overflow: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card fade-up"
        style={{
          padding: 0,
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
        }}
      >
        <form action={action}>
          <div
            style={{
              padding: '22px 26px 18px',
              borderBottom: '1px solid var(--line-2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div className="col">
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: 'var(--ink-4)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Invite
              </span>
              <h2
                style={{
                  margin: '2px 0 0',
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 24,
                }}
              >
                Bring someone in.
              </h2>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              style={{ width: 30, height: 30 }}
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          <div style={{ padding: '22px 26px' }}>
            <div className="col" style={{ gap: 16 }}>
              <label className="col" style={{ gap: 6 }}>
                <span className="panel-title">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="person@casadragones.com"
                  className="sb-input"
                />
              </label>

              <div className="col" style={{ gap: 6 }}>
                <span className="panel-title">Role</span>
                <div className="row gap-sm">
                  {ROLES.map((r) => {
                    const active = role === r.id
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: `1px solid ${active ? 'var(--ink-1)' : 'var(--line-1)'}`,
                          background: active ? 'var(--bg-sunken)' : '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: 2,
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-1)' }}>
                          {r.name}
                        </span>
                        <span
                          className="mono"
                          style={{
                            fontSize: 9.5,
                            color: 'var(--ink-4)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {r.desc}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <input type="hidden" name="role" value={role} />
              </div>

              <label className="col" style={{ gap: 6 }}>
                <span className="panel-title">
                  Personal note{' '}
                  <span style={{ textTransform: 'none', color: 'var(--ink-4)' }}>(optional)</span>
                </span>
                <textarea
                  name="message"
                  rows={3}
                  placeholder="Welcome to the library…"
                  className="sb-input"
                  style={{ resize: 'vertical' }}
                />
              </label>

              {!state.ok && (
                <div
                  role="alert"
                  style={{
                    fontSize: 12.5,
                    color: 'var(--crit)',
                    background: '#fdf0f0',
                    border: '1px solid #f0cccc',
                    padding: '8px 12px',
                    borderRadius: 10,
                  }}
                >
                  {state.error}
                </div>
              )}

              {state.ok && state.provider === 'console' && state.acceptUrl && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-3)',
                    background: 'var(--bg-sunken)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: 'var(--ink-2)' }}>Dev mode — no email sent.</strong>{' '}
                  Copy the invite link:
                  <div
                    className="mono"
                    style={{
                      marginTop: 6,
                      padding: '6px 8px',
                      background: '#fff',
                      border: '1px solid var(--line-1)',
                      borderRadius: 6,
                      fontSize: 11,
                      wordBreak: 'break-all',
                      userSelect: 'all',
                    }}
                  >
                    {state.acceptUrl}
                  </div>
                </div>
              )}
              {state.ok && state.provider === 'resend' && state.acceptUrl && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: 'var(--ok)',
                    background: '#e3f0e9',
                    borderRadius: 10,
                    padding: '8px 12px',
                  }}
                >
                  Invite sent to {email}.
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              padding: '16px 26px',
              borderTop: '1px solid var(--line-2)',
              background: 'var(--bg-sunken)',
              borderRadius: '0 0 20px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>
              1 seat will be consumed
            </span>
            <div className="row gap-sm">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!emailOk || pending}
                style={{ opacity: emailOk ? 1 : 0.5 }}
              >
                <Icon name="arrow-r" size={12} />
                {pending ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}

export function InviteModalTrigger({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        <Icon name="plus" size={13} />
        {children ?? 'Invite members'}
      </button>
      {open && <InviteModal onClose={() => setOpen(false)} />}
    </>
  )
}
