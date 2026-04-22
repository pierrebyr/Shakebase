'use client'

import { useState } from 'react'
import { OpIcon } from '@/components/admin/Icon'

type Props = { workspaceId: string; workspaceName: string }

export function ImpersonateForm({ workspaceId, workspaceName }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')

  return (
    <>
      <button type="button" className="op-btn primary" onClick={() => setOpen(true)}>
        <OpIcon name="impersonate" />
        Sign in as owner
      </button>

      {open && (
        <div className="op-modal-overlay" onClick={() => setOpen(false)}>
          <div className="op-modal" onClick={(e) => e.stopPropagation()}>
            <div className="op-card-head" style={{ background: 'transparent' }}>
              <h3>Sign in as owner of {workspaceName}?</h3>
              <button type="button" className="op-btn ghost" onClick={() => setOpen(false)}>
                <OpIcon name="x" />
              </button>
            </div>
            <form action="/admin/impersonate/start" method="POST">
              <input type="hidden" name="workspace_id" value={workspaceId} />
              <div style={{ padding: 20 }}>
                <p className="mut" style={{ marginTop: 0, fontSize: 12.5, lineHeight: 1.55 }}>
                  Your admin session will be swapped for the workspace owner&rsquo;s session and
                  you&rsquo;ll be redirected to their dashboard. Every action you take is recorded
                  in the audit log bound to your admin identity. To exit, click{' '}
                  <b style={{ color: 'var(--op-ink-1)' }}>Exit session</b> in the banner at the top
                  of the workspace.
                </p>
                <label
                  className="mut mono"
                  style={{
                    fontSize: 10.5,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginTop: 18,
                    marginBottom: 6,
                  }}
                >
                  Reason (recommended)
                </label>
                <input
                  className="op-input"
                  style={{ width: '100%' }}
                  name="reason"
                  placeholder="e.g. ticket #4412 — pour cost not computing"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  autoFocus
                />
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 18,
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    className="op-btn ghost"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="op-btn primary">
                    <OpIcon name="impersonate" />
                    Start session
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
