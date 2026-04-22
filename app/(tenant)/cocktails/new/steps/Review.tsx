'use client'

import { Icon } from '@/components/icons'

export function StepReview({
  submitDraft,
  submitPublish,
  pending,
}: {
  submitDraft: () => void
  submitPublish: () => void
  pending: boolean
}) {
  return (
    <>
      <div className="panel-title" style={{ marginBottom: 12 }}>
        Ready to submit
      </div>
      <p style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 0 }}>
        Review the preview to the right. Publishing makes the cocktail visible to your whole
        workspace. You can always come back later via the Edit button on the detail page.
      </p>
      <div className="row gap-sm" style={{ marginTop: 24 }}>
        <button
          type="button"
          className="btn-primary"
          onClick={submitPublish}
          disabled={pending}
        >
          <Icon name="check" size={13} />
          {pending ? 'Publishing…' : 'Publish cocktail'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={submitDraft}
          disabled={pending}
        >
          {pending ? 'Saving…' : 'Save as draft'}
        </button>
      </div>
    </>
  )
}
