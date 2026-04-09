import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRole?: 'VOTER' | 'ADMIN'
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, token } = useAuthStore()
  const location = useLocation()

  if (!token) {
    const loginPath = allowedRole === 'ADMIN' ? '/auth/commissioner' : '/auth/voter'
    const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search)
    return <Navigate to={`${loginPath}?redirect=${redirectUrl}`} replace />
  }

  if (allowedRole && user?.role !== allowedRole) {
    // If user role doesn't match, redirect to their appropriate dashboard
    const fallback = user?.role === 'ADMIN' ? '/admin/dashboard' : '/voter/dashboard'
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
