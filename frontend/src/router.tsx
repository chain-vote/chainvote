import { createBrowserRouter, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from './lib/api'
import { App } from './App'
import { Landing, Identity, AuthFlow, Vote, Audit, Results, AdminDashboard, AdminCreate, VoterDashboard, About, ElectionAnalytics } from './pages'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { VerifyReceipt } from './pages/VerifyReceipt'
import { HallOfSilence } from './pages/HallOfSilence'
import { DatabaseEngine } from './pages/DatabaseEngine'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'identity', element: <Identity /> },
      { path: 'auth/:mode', element: <AuthFlow /> },
      { path: 'about', element: <About /> },

      // Public utility pages
      { path: 'verify', element: <VerifyReceipt /> },
      { path: 'hall/:electionId', element: <HallOfSilenceWrapper /> },

      { path: 'vote', element: <ProtectedRoute allowedRole="VOTER"><Vote /></ProtectedRoute> },
      { path: 'audit', element: <Audit /> },
      { path: 'results', element: <Results /> },

      { path: 'voter/dashboard', element: <ProtectedRoute allowedRole="VOTER"><VoterDashboard /></ProtectedRoute> },

      { path: 'admin/dashboard', element: <ProtectedRoute allowedRole="ADMIN"><AdminDashboard /></ProtectedRoute> },
      { path: 'admin/create', element: <ProtectedRoute allowedRole="ADMIN"><AdminCreate /></ProtectedRoute> },
      { path: 'admin/analytics', element: <ProtectedRoute allowedRole="ADMIN"><ElectionAnalytics /></ProtectedRoute> },
      { path: 'admin/db-engine', element: <ProtectedRoute allowedRole="ADMIN"><DatabaseEngine /></ProtectedRoute> },
    ],
  },
])

// HallOfSilence wrapper to pass votes from URL param
function HallOfSilenceWrapper() {
  const { electionId } = useParams<{ electionId: string }>()
  const { data } = useQuery({
    queryKey: ['chain', electionId],
    queryFn: () => api.getChain(electionId!),
    enabled: !!electionId,
  })
  return <HallOfSilence votes={(data ?? []).map((v: any, i: number) => ({ voteHash: v.voteHash, position: i + 1 }))} />
}
