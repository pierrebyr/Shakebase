import { AuthShell } from '@/components/auth/AuthShell'
import { LoginArt } from '@/components/auth/LoginArt'
import { LoginForm } from './LoginForm'
import '../auth.css'

export const metadata = {
  title: 'Sign in — ShakeBase',
}

export default function LoginPage() {
  return (
    <AuthShell
      envPill="R&D"
      helpText="New here?"
      helpHref="/signup"
      helpLink="Request access"
      kicker="Internal · Team portal"
      title={<>Welcome back.</>}
      sub={
        <>
          Sign in to the ShakeBase cocktail database — canonical recipes, live pour data and the
          R&amp;D workspace your team runs on.
        </>
      }
      art={<LoginArt />}
    >
      <LoginForm />
    </AuthShell>
  )
}
