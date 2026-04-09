import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Overlay } from '../components/ui/Overlay'
import { ritualChime } from '../components/layout/TerminalAtmosphere'
import { ManifestationHeatmap } from '../components/ui/ManifestationHeatmap'
import { BackButton } from '../components/ui/BackButton'

export function AdminDashboard() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  
  const [overlay, setOverlay] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'alert' | 'confirm'
    onConfirm?: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  })

  const { data: elections, isLoading } = useQuery({
    queryKey: ['elections', 'active'],
    queryKeyHashFn: () => 'active-elections-admin',
    queryFn: () => api.getActiveElections(),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, otp, masterCode }: { id: string; otp: string; masterCode: string }) => 
      api.deleteElection(id, { otp, masterCode }),
    onSuccess: (data) => {
      ritualChime('success')
      setOverlay({
        isOpen: true,
        title: 'Purge Complete',
        message: data.message || 'The election node has been successfully removed from the chain.',
        type: 'alert',
        onConfirm: () => {
          setOverlay(prev => ({ ...prev, isOpen: false }))
          queryClient.invalidateQueries({ queryKey: ['elections', 'active'] })
        }
      })
    },
    onError: (err: any) => {
      setOverlay({
        isOpen: true,
        title: 'Purge Failed',
        message: err.message || 'The chain resisted the deletion attempt. Ritual incomplete.',
        type: 'alert'
      })
    }
  })

  const handleShare = (election: any) => {
    ritualChime('success')
    const candidatesStr = election.candidates?.map((c: any) => c.name).join(' vs ') || 'Candidates TBD'
    const link = `${window.location.origin}/vote?electionId=${election.id}`
    const message = `Cast your Will in ${election.title} where ${candidatesStr}. Participate in the ritual: ${link}`
    
    navigator.clipboard.writeText(message)
    setOverlay({
      isOpen: true,
      title: 'Link Manifested',
      message: 'The recruitment spell has been captured into your clipboard.',
      type: 'alert'
    })
  }

  const handleDelete = (id: string, title: string) => {
    ritualChime('click')
    setOverlay({
      isOpen: true,
      title: 'Initiate Purge',
      message: `Are you sure you want to purge the "${title}" node? This will erase all candidates and votes associated with it. This action is irreversible on the chain.`,
      type: 'confirm',
      onConfirm: () => {
        setOverlay(prev => ({ ...prev, isOpen: false }))
        const masterCode = window.prompt("Enter Master Code to authorize node purge:") || '';
        if (!masterCode) return;
        const otp = window.prompt("Enter the 6-digit OTP code to complete Dual-Lock Purge:") || '';
        if (!otp) return;
        
        deleteMutation.mutate({ id, otp, masterCode })
      }
    })
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-6xl mx-auto">
      <BackButton fallback="/identity" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-end mb-16 border-b border-white/5 pb-8">
          <div>
            <h2 className="font-cinzel text-4xl tracking-widest text-gold uppercase mb-2">Command Center</h2>
            <p className="font-cinzel text-[10px] tracking-[0.3em] text-ash uppercase">Commissioner: {user?.email}</p>
          </div>
          <Link
            to="/admin/create"
            className="font-cinzel text-[11px] tracking-[0.4em] uppercase px-8 py-3 bg-gold/10 border border-gold/40 text-gold hover:bg-gold hover:text-void rounded transition-all shadow-[0_0_20px_rgba(255,179,0,0.1)]"
          >
            Publish New Election
          </Link>
        </div>

        <div className="bg-void/50 border border-gold/30 p-6 rounded-lg mb-12 hover:bg-gold/5 transition-all cursor-pointer group" onClick={() => window.location.href = '/admin/db-engine'}>
           <h3 className="font-cinzel text-gold text-lg tracking-widest uppercase mb-2 group-hover:text-white transition-colors">Vault Query Engine (SQL)</h3>
           <p className="text-ash text-sm">Directly interface with the SQLite cryptosystem. Seeded data is available.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
             <div className="w-10 h-10 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* Manifestation Heatmap */}
            <div className="mb-2">
              <div className="font-cinzel text-[9px] tracking-[0.5em] text-ash uppercase mb-3">Ether Activity</div>
              <ManifestationHeatmap voteCount={elections?.reduce((acc: number, e: any) => acc + (e._count?.votes ?? 0), 0) ?? 0} />
            </div>

            <h3 className="font-cinzel text-[10px] tracking-[0.5em] text-ash uppercase mb-2">Managed Chains</h3>
            {elections?.map((election: any, idx: number) => (
              <motion.div
                key={election.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group flex flex-col md:flex-row md:items-center justify-between gap-6 bg-void/30 backdrop-blur-md border border-white/10 p-8 rounded-xl hover:border-gold/30 transition-all relative overflow-hidden"
              >
                <div>
                  <h3 className="font-cinzel text-lg text-white tracking-widest mb-1 group-hover:text-gold transition-colors">{election.title}</h3>
                  <div className="font-mono text-[9px] text-ash/40 uppercase tracking-tighter break-all max-w-md">
                    ID: {election.id}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Link
                    to={`/audit?electionId=${election.id}`}
                    className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-ash hover:text-white transition-colors border-r border-white/10 pr-4"
                  >
                    View Integrity
                  </Link>
                   <Link
                    to={`/results?electionId=${election.id}`}
                    className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-ash hover:text-white transition-colors border-r border-white/10 pr-4"
                  >
                    Results
                  </Link>
                  <button
                    onClick={() => handleShare(election)}
                    className="font-cinzel text-[10px] tracking-[0.3em] uppercase text-gold hover:brightness-125 transition-all"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => handleDelete(election.id, election.title)}
                    className="ml-4 font-cinzel text-[10px] tracking-[0.3em] uppercase text-ember/60 hover:text-ember transition-colors"
                  >
                    Purge
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <Overlay 
        isOpen={overlay.isOpen}
        onClose={() => setOverlay(prev => ({ ...prev, isOpen: false }))}
        onConfirm={overlay.onConfirm}
        title={overlay.title}
        message={overlay.message}
        type={overlay.type}
        confirmText={overlay.type === 'confirm' ? 'Purge Node' : 'Acknowledge'}
      />
    </div>
  )
}
