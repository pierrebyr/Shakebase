type Props = {
  workspaceName: string
  role: string
  inviterName?: string | null
}

const ROLE_COPY: Record<string, { eyebrow: string; rows: { b: string; s: string }[] }> = {
  owner: {
    eyebrow: 'Ownership transfer',
    rows: [
      { b: 'Full control.', s: 'Billing, team, and every spec in the library.' },
      { b: 'Transfer back any time.', s: 'Ownership is never locked in — one click.' },
      { b: 'A real audit trail.', s: 'Every change is logged to the workspace history.' },
    ],
  },
  editor: {
    eyebrow: 'You can shape the library',
    rows: [
      { b: 'Write and edit specs.', s: 'Add new cocktails, tweak methods, attach photos.' },
      { b: 'Get credited.', s: 'Your name sticks to the drinks you author — publicly.' },
      { b: 'Comment anywhere.', s: 'Tag a teammate on any step for feedback or review.' },
    ],
  },
  viewer: {
    eyebrow: 'Read-only access',
    rows: [
      { b: 'The full library.', s: 'Browse every cocktail, creator, and ingredient.' },
      { b: 'Export & print.', s: 'PDF menus, cost breakdowns, tasting sheets — yours.' },
      { b: 'Comment in context.', s: 'Leave feedback without risk of editing a spec.' },
    ],
  },
}

export function AcceptInviteArt({ workspaceName, role, inviterName }: Props) {
  const copy = ROLE_COPY[role.toLowerCase()] ?? ROLE_COPY.editor!
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  return (
    <div className="auth-art">
      <div className="art-frame" />
      <div className="art-top">
        <span className="art-eyebrow">Team invitation</span>
        <span className="art-meta">
          <b>{workspaceName}</b>
          <br />
          {roleLabel} seat
        </span>
      </div>
      <div className="big-orb" />
      <div className="steps-card">
        <h3>{copy.eyebrow}</h3>
        <ol>
          {copy.rows.map((row, i) => (
            <li key={i}>
              <div>
                <b>{row.b}</b>
                <span>{row.s}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="launch-chip">
        <i />
        {inviterName ? `Invited by ${inviterName}` : 'Your seat is ready'}
      </div>
    </div>
  )
}
