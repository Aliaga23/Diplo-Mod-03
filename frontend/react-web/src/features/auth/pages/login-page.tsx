import { zodResolver } from '@hookform/resolvers/zod'
import { WarningCircleIcon } from '@phosphor-icons/react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { loginSchema, useLogin, type LoginInput } from '@/features/auth/api'
import { homeFor, useSession } from '@/lib/auth-store'
import { errorMessage } from '@/lib/http'

export function LoginPage() {
  const session = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const login = useLogin()
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  if (session && !login.isSuccess) return <Navigate to={homeFor(session.role)} replace />

  const onSubmit = form.handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: (res) => navigate(from ?? homeFor(res.user.role), { replace: true }),
    }),
  )

  const { errors } = form.formState

  return (
    <AuthLayout
      title="Iniciar sesión"
      description="Ingresa con tu correo y contraseña."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-primary underline-offset-4 hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          {login.isError && (
            <Alert variant="destructive">
              <WarningCircleIcon />
              <AlertDescription>{errorMessage(login.error)}</AlertDescription>
            </Alert>
          )}
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Correo</FieldLabel>
            <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register('email')} />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...form.register('password')}
            />
            <FieldError errors={[errors.password]} />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </FieldGroup>
      </form>
    </AuthLayout>
  )
}
