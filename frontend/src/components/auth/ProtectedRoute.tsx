import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRole?: 'VOTER' | 'ADMIN' | 'COMMISSIONER'
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, token } = useAuthStore()
  
  if (!token) {
    const loginPath = allowedRole === 'ADMIN' || allowedRole === 'COMMISSIONER' ? '/auth/admin' : '/auth/voter'
    const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search)
    return <Navigate to={`${loginPath}?redirect=${redirectUrl}`} replace />
  }

  // Verification Check: If user is COMMISSIONER and not verified, redirect to pending
  if (user?.role === 'COMMISSIONER' && !user.isVerified) {
    return <Navigate to="/verification-pending" replace />
  }

  if (allowedRole && user?.role !== allowedRole) {
    // Super admins (ADMIN) can access anything
    if (user?.role === 'ADMIN') return <>{children}</>

    // If user role doesn't match, redirect to their appropriate dashboard
    const fallback = user?.role === 'COMMISSIONER' ? '/admin/dashboard' : '/voter/dashboard'
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
