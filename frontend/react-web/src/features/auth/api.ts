// auth · POST /api/auth/login y /api/auth/register
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'

import { authStore } from '@/lib/auth-store'
import { http } from '@/lib/http'
import type { AuthResponse } from '@/lib/types'

export const loginSchema = z.object({
  email: z.email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Ingresa tu nombre'),
  email: z.email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})
export type RegisterInput = z.infer<typeof registerSchema>

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => http.post<AuthResponse>('/auth/login', input),
    onSuccess: (res) => authStore.set(res.token),
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => http.post<AuthResponse>('/auth/register', input),
    onSuccess: (res) => authStore.set(res.token),
  })
}
