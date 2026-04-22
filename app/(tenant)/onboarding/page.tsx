import { getCurrentWorkspace } from '@/lib/workspace/context'

export default async function OnboardingPage() {
  const workspace = await getCurrentWorkspace()

  return (
    <div className="page fade-up" style={{ maxWidth: 720 }}>
      <div className="page-kicker">Welcome</div>
      <h1 className="page-title">Welcome to {workspace.name}.</h1>
      <p className="page-sub">
        Invite your team, pick your default units, and create your first cocktail. You&apos;re on a
        14-day trial — no charge until it ends.
      </p>
    </div>
  )
}
