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

  if (!token || !user) {
    // Redirect to login but save the current location they were trying to go to
    return <Navigate to="/auth/voter" state={{ from: location }} replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    // If user role doesn't match, redirect to their appropriate dashboard
    const fallback = user.role === 'ADMIN' ? '/admin/dashboard' : '/voter/dashboard'
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
