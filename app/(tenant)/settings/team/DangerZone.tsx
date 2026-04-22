'use client'

import { useActionState, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/icons'
import { transferOwnershipAction, deleteWorkspaceAction } from './actions'

type Transferable = { id: string; name: string }

const blankTransfer = { ok: true } as const

export function DangerZone({
  workspaceName,
  members,
}: {
  workspaceName: string
  members: Transferable[]
}) {
  const [transferOpen, setTransferOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div
      className="card card-pad"
      style={{
        borderColor: 'rgba(200,60,60,0.2)',
        background: 'linear-gradient(180deg, rgba(200,60,60,0.03), transparent)',
      }}
    >
      <div className="panel-title" style={{ marginBottom: 12, color: 'var(--crit)' }}>
        Danger zone
      </div>
      <div className="col" style={{ gap: 14 }}>
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div className="col" style={{ flex: 1, minWidth: 200 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-1)', fontWeight: 500 }}>
              Transfer ownership
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--ink-4)', lineHeight: 1.4 }}>
              Promote another member to Owner. You&apos;ll become an Editor.
            </span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '7px 14px' }}
            onClick={() => setTransferOpen(true)}
            disabled={members.length === 0}
          >
            Transfer
          </button>
        </div>
        <div style={{ borderTop: '1px solid var(--line-2)' }} />
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div className="col" style={{ flex: 1, minWidth: 200 }}>
            <span style={{ fontSize: 13, color: 'var(--crit)', fontWeight: 500 }}>
              Delete workspace
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--ink-4)', lineHeight: 1.4 }}>
              Permanent. All cocktails, collections &amp; access logs erased.
            </span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{
              padding: '7px 14px',
              color: 'var(--crit)',
              borderColor: 'rgba(200,60,60,0.2)',
            }}
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </button>
        </div>
      </div>

      {transferOpen && (
        <TransferModal
          workspaceName={workspaceName}
          members={members}
          onClose={() => setTransferOpen(false)}
        />
      )}
      {deleteOpen && (
        <DeleteModal workspaceName={workspaceName} onClose={() => setDeleteOpen(false)} />
      )}
    </div>
  )
}

function TransferModal({
  workspaceName,
  members,
  onClose,
}: {
  workspaceName: string
  members: Transferable[]
  onClose: () => void
}) {
  const [state, action, pending] = useActionState(transferOwnershipAction, blankTransfer)
  const [selectedId, setSelectedId] = useState(members[0]?.id ?? '')

  return (
    <ModalShell onClose={onClose} title="Transfer ownership" kicker="Danger zone">
      <form action={action} className="col" style={{ gap: 14 }}>
        <input type="hidden" name="membership_id" value={selectedId} />
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>
          The selected member becomes the new Owner. You&apos;ll remain on the workspace as an
          Editor. Billing access moves with ownership.
        </p>

        <label className="col" style={{ gap: 6 }}>
          <span className="panel-title">New owner</span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="sb-input"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="col" style={{ gap: 6 }}>
          <span className="panel-title">
            Type <span style={{ color: 'var(--ink-1)' }}>{workspaceName}</span> to confirm
          </span>
          <input name="confirm" required className="sb-input" />
        </label>

        {!('ok' in state) || state.ok ? null : (
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

        <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={pending || !selectedId}
            style={{ background: 'var(--crit)', color: '#fff' }}
          >
            {pending ? 'Transferring…' : 'Transfer ownership'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

function DeleteModal({ workspaceName, onClose }: { workspaceName: string; onClose: () => void }) {
  const [state, action, pending] = useActionState(deleteWorkspaceAction, blankTransfer)

  return (
    <ModalShell onClose={onClose} title="Delete workspace" kicker="Danger zone">
      <form action={action} className="col" style={{ gap: 14 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>
          This permanently deletes the workspace along with every cocktail, collection, creator,
          and member. <strong>This cannot be undone.</strong>
        </p>

        <label className="col" style={{ gap: 6 }}>
          <span className="panel-title">
            Type <span style={{ color: 'var(--crit)' }}>{workspaceName}</span> to confirm
          </span>
          <input name="confirm" required className="sb-input" autoComplete="off" />
        </label>

        {!('ok' in state) || state.ok ? null : (
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

        <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={pending}
            style={{ background: 'var(--crit)', color: '#fff' }}
          >
            <Icon name="trash" size={13} />
            {pending ? 'Deleting…' : 'Delete workspace'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

function ModalShell({
  title,
  kicker,
  children,
  onClose,
}: {
  title: string
  kicker: string
  children: React.ReactNode
  onClose: () => void
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', esc)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', esc)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const content = (
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
          maxWidth: 480,
          boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
        }}
      >
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
                color: 'var(--crit)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              {kicker}
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
              {title}
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
        <div style={{ padding: '22px 26px' }}>{children}</div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
