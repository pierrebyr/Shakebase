import { AuthShell } from '@/components/auth/AuthShell'
import { SignupArt } from '@/components/auth/SignupArt'
import { SignupForm } from './SignupForm'
import '../auth.css'

export const metadata = {
  title: 'Start your workspace — ShakeBase',
}

export default function SignupPage() {
  return (
    <AuthShell
      envPill="Trial"
      helpText="Already have a workspace?"
      helpHref="/login"
      helpLink="Sign in →"
      kicker="Stand up your workspace · 90 seconds"
      title={<>Start with your subdomain.</>}
      sub={
        <>
          14-day free trial. No credit card required. Your workspace lives on its own subdomain —
          claim it now, it stays yours.
        </>
      }
      art={<SignupArt />}
    >
      <SignupForm />
    </AuthShell>
  )
}
