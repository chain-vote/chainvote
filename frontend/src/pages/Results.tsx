import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { BackButton } from '../components/ui/BackButton'

export function Results() {
  const [sp] = useSearchParams()
  const electionId = sp.get('electionId')
  const user = useAuthStore((s) => s.user)

  const electionQuery = useQuery({
    queryKey: ['election', electionId],
    enabled: !!electionId,
    queryFn: () => api.getElection(electionId!),
  })

  const chainQuery = useQuery({
    queryKey: ['chain', electionId],
    enabled: !!electionId,
    queryFn: () => api.getChain(electionId!),
    refetchInterval: 1500,
  })

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const v of chainQuery.data ?? []) {
      m.set(v.candidateId, (m.get(v.candidateId) ?? 0) + 1)
    }
    return m
  }, [chainQuery.data])

  const candidates: any[] = electionQuery.data?.candidates ?? []

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <BackButton fallback="/identity" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-void/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 lg:p-12 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
          <div>
            <h1 className="font-cinzel text-4xl text-white tracking-[0.2em] uppercase">The Final Count</h1>
            <p className="font-cinzel text-[10px] tracking-[0.3em] text-ash uppercase mt-2">
              {electionQuery.data?.title || 'Unknown Election'}
            </p>
          </div>
          <Link 
            to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/voter/dashboard'}
            className="font-cinzel text-[10px] tracking-[0.5em] uppercase text-ash hover:text-white transition-colors"
          >
            ← Return to Command
          </Link>
        </div>

        {!electionId && <div className="text-ember font-mono text-center text-xs uppercase tracking-widest">Spectral Error: Election ID Missing</div>}

        {electionId && (
          <div className="space-y-6">
            {candidates.map((c, idx) => {
              const count = counts.get(c.id) ?? 0
              const total = (chainQuery.data ?? []).length
              const percent = total > 0 ? (count / total) * 100 : 0
              
              return (
                <motion.div 
                  key={c.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative rounded-xl border border-white/5 bg-void/20 p-6 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 h-full bg-gold/5 transition-all duration-1000" style={{ width: `${percent}%` }} />
                  
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-cinzel text-xl text-white tracking-widest group-hover:text-gold transition-colors">{c.name}</div>
                      {c.manifesto && <div className="text-[10px] text-ash italic opacity-60 mt-1 uppercase tracking-tighter">"{c.manifesto}"</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xl text-white">{count}</div>
                      <div className="font-mono text-[10px] text-gold/60">{percent.toFixed(1)}%</div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
            
            <footer className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-2 opacity-50">
               <div className="font-mono text-[10px] text-ash uppercase tracking-tighter">
                 {(chainQuery.data ?? []).length} CRITICALLY HASHED VOTES
               </div>
               <div className="font-cinzel text-[9px] text-ash tracking-[0.4em] uppercase">Universal Truth Verified</div>
            </footer>
          </div>
        )}
      </motion.div>
    </div>
  )
}

