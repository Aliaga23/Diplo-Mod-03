import { zodResolver } from '@hookform/resolvers/zod'
import { WarningCircleIcon } from '@phosphor-icons/react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { registerSchema, useRegister, type RegisterInput } from '@/features/auth/api'
import { homeFor, useSession } from '@/lib/auth-store'
import { errorMessage } from '@/lib/http'

export function RegisterPage() {
  const session = useSession()
  const navigate = useNavigate()
  const register = useRegister()
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  if (session && !register.isSuccess) return <Navigate to={homeFor(session.role)} replace />

  const onSubmit = form.handleSubmit((values) =>
    register.mutate(values, {
      onSuccess: (res) => {
        toast.success(`Bienvenido, ${res.user.name}`)
        navigate('/', { replace: true })
      },
    }),
  )

  const { errors } = form.formState

  return (
    <AuthLayout
      title="Crear cuenta"
      description="Regístrate como cliente para comprar entradas."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          {register.isError && (
            <Alert variant="destructive">
              <WarningCircleIcon />
              <AlertDescription>{errorMessage(register.error)}</AlertDescription>
            </Alert>
          )}
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
            <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...form.register('name')} />
            <FieldError errors={[errors.name]} />
          </Field>
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
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...form.register('password')}
            />
            <FieldDescription>Mínimo 8 caracteres. Se guarda cifrada.</FieldDescription>
            <FieldError errors={[errors.password]} />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={register.isPending}>
            {register.isPending ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </FieldGroup>
      </form>
    </AuthLayout>
  )
}
