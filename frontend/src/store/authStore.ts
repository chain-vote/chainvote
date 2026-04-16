import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type User = {
  id: string
  email: string
  role: 'VOTER' | 'COMMISSIONER' | 'ADMIN'
  isVerified: boolean
  voterHash: string | null
}

type AuthState = {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clear: () => {
        set({ token: null, user: null })
        localStorage.removeItem('chainvote:auth')
        // Force full reload to ensure all memory state is purged
        window.location.href = '/identity'
      },
    }),
    { name: 'chainvote:auth' },
  ),
)

