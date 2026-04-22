'use client'

import { useState } from 'react'
import { OpIcon } from '@/components/admin/Icon'

type Suggestion = {
  id: string
  kind: 'product' | 'ingredient'
  name: string
  category: string | null
  note: string | null
  brand: string | null
  expression: string | null
  abv: number | null
  origin: string | null
  description: string | null
  default_unit: string | null
  status: string
  suggested_at: string
  reviewed_at: string | null
  rejection_reason: string | null
}

type Dupe = { id: string; label: string; kind: 'product' | 'ingredient' }

type Props = {
  s: Suggestion
  submitterEmail: string | null
  workspaceName: string | null
  dupes: Dupe[]
}

export function SuggestionRow({ s, submitterEmail, workspaceName, dupes }: Props) {
  const [showReject, setShowReject] = useState(false)
  const [showMerge, setShowMerge] = useState(false)

  const isPending = s.status === 'pending'
  const label =
    s.kind === 'product' && s.brand
      ? `${s.brand} — ${s.expression ?? s.name}`
      : s.name

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        padding: '16px 18px',
        borderBottom: '1px solid var(--op-line-2)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background:
            s.kind === 'product' ? 'rgba(217,165,104,0.15)' : 'rgba(127,174,207,0.15)',
          color: s.kind === 'product' ? 'var(--op-accent)' : 'var(--op-info)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <OpIcon name={s.kind === 'product' ? 'catalog' : 'sparkles'} size={16} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <b style={{ fontWeight: 500, fontSize: 14 }}>{label}</b>
          <span className="op-chip">{s.kind}</span>
          {s.category && (
            <span className="mut mono" style={{ fontSize: 11 }}>
              {s.category}
            </span>
          )}
          {s.abv != null && (
            <span className="mut mono" style={{ fontSize: 11 }}>
              {s.abv}%
            </span>
          )}
          {dupes.length > 0 && (
            <span className="op-chip warn">
              <OpIcon name="warning" size={10} />
              possible dupe
            </span>
          )}
          {s.status === 'approved' && <span className="op-chip ok">approved</span>}
          {s.status === 'merged' && <span className="op-chip info">merged</span>}
          {s.status === 'rejected' && <span className="op-chip crit">rejected</span>}
        </div>
        <div className="mut" style={{ fontSize: 12, marginTop: 4 }}>
          Suggested by{' '}
          <b style={{ color: 'var(--op-ink-2)', fontWeight: 500 }}>
            {submitterEmail ?? 'unknown'}
          </b>
          {workspaceName && <> · {workspaceName}</>} · {relDate(s.suggested_at)}
        </div>
        {s.note && (
          <div className="mut" style={{ fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
            &ldquo;{s.note}&rdquo;
          </div>
        )}
        {s.rejection_reason && (
          <div className="crit" style={{ fontSize: 12, marginTop: 4 }}>
            Rejected: {s.rejection_reason}
          </div>
        )}

        {dupes.length > 0 && isPending && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              background: 'rgba(226,179,90,0.06)',
              border: '1px solid rgba(226,179,90,0.2)',
              borderRadius: 8,
            }}
          >
            <div
              className="warn"
              style={{
                fontSize: 11,
                fontWeight: 500,
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <OpIcon name="warning" size={11} />
              Possible duplicates
            </div>
            {dupes.map((d) => (
              <form
                key={d.id}
                action={`/admin/catalog/${s.id}/action`}
                method="POST"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 0',
                  fontSize: 12,
                }}
              >
                <input type="hidden" name="op" value="merge" />
                <input type="hidden" name="merge_target_id" value={d.id} />
                <OpIcon name="merge" size={11} style={{ color: 'var(--op-ink-3)' }} />
                <span style={{ flex: 1 }}>{d.label}</span>
                <button type="submit" className="op-btn sm">
                  Merge into this
                </button>
              </form>
            ))}
          </div>
        )}
      </div>

      {isPending && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <form action={`/admin/catalog/${s.id}/action`} method="POST">
            <input type="hidden" name="op" value="approve" />
            <button type="submit" className="op-btn sm primary">
              <OpIcon name="check" />
              Approve
            </button>
          </form>
          <button
            type="button"
            className="op-btn ghost sm"
            onClick={() => setShowReject(true)}
            title="Reject"
          >
            <OpIcon name="x" />
          </button>
        </div>
      )}

      {showReject && (
        <div className="op-modal-overlay" onClick={() => setShowReject(false)}>
          <div className="op-modal" onClick={(e) => e.stopPropagation()}>
            <div className="op-card-head" style={{ background: 'transparent' }}>
              <h3>Reject suggestion</h3>
              <button type="button" className="op-btn ghost" onClick={() => setShowReject(false)}>
                <OpIcon name="x" />
              </button>
            </div>
            <form action={`/admin/catalog/${s.id}/action`} method="POST">
              <input type="hidden" name="op" value="reject" />
              <div style={{ padding: 20 }}>
                <p className="mut" style={{ marginTop: 0, fontSize: 12.5 }}>
                  The submitter can see the reason if they look at their workspace&rsquo;s
                  submissions. Keep it factual.
                </p>
                <label
                  className="mut mono"
                  style={{
                    fontSize: 10.5,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginTop: 14,
                    marginBottom: 6,
                  }}
                >
                  Reason (optional)
                </label>
                <textarea
                  className="op-input"
                  style={{ width: '100%', minHeight: 70, resize: 'vertical' }}
                  name="rejection_reason"
                  placeholder="e.g. duplicate of Monkey 47 Gin · exists under Schwarzwald Destillerie"
                  autoFocus
                />
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 16,
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    className="op-btn ghost"
                    onClick={() => setShowReject(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="op-btn danger">
                    <OpIcon name="x" />
                    Reject
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMerge && (
        <div className="op-modal-overlay" onClick={() => setShowMerge(false)}>
          <div className="op-modal" onClick={(e) => e.stopPropagation()}>
            <div className="op-card-head" style={{ background: 'transparent' }}>
              <h3>Merge suggestion</h3>
              <button type="button" className="op-btn ghost" onClick={() => setShowMerge(false)}>
                <OpIcon name="x" />
              </button>
            </div>
            <div style={{ padding: 20 }} className="mut">
              Pick a dupe inline to merge — or close this modal and use the per-row merge buttons.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function relDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
