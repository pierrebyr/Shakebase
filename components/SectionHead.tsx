import type { ReactNode } from 'react'

type Props = {
  kicker?: string
  title: string
  action?: ReactNode
}

export function SectionHead({ kicker, title, action }: Props) {
  return (
    <div
      className="row"
      style={{ justifyContent: 'space-between', marginBottom: 16, alignItems: 'flex-end' }}
    >
      <div className="col">
        {kicker && (
          <div className="page-kicker" style={{ marginBottom: 4 }}>
            {kicker}
          </div>
        )}
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 22,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}
