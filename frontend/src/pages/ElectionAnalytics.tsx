import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { BackButton } from '../components/ui/BackButton'
import { ritualChime } from '../components/layout/TerminalAtmosphere'
import { useEffect } from 'react'

export function ElectionAnalytics() {
  const [searchParams] = useSearchParams()
  const electionId = searchParams.get('electionId')

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', electionId],
    queryFn: () => api.getAnalytics(electionId!),
    enabled: !!electionId,
  })

  useEffect(() => {
    ritualChime('success')
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  const candidates = Object.entries(data?.analytics?.candidates || {})

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-6xl mx-auto">
      <BackButton fallback="/admin/dashboard" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-16 border-b border-white/5 pb-8">
          <h2 className="font-cinzel text-4xl tracking-widest text-gold uppercase mb-2">Soul Insights</h2>
          <p className="font-cinzel text-[10px] tracking-[0.3em] text-ash uppercase">Demographic Manifestation Ledger: {electionId}</p>
        </div>

        {candidates.length === 0 ? (
          <div className="text-center py-20 bg-void/30 border border-white/5 rounded-xl">
             <p className="font-cinzel text-ash tracking-widest text-sm uppercase">No manifestations recorded for this node yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12">
            {candidates.map(([id, stats]: [string, any]) => (
              <div key={id} className="bg-void/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] font-cinzel text-6xl select-none uppercase tracking-tighter">
                   {stats.name}
                </div>

                <h3 className="font-cinzel text-xl text-gold tracking-widest uppercase mb-8 border-b border-gold/10 pb-4 inline-block">{stats.name}</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Age Distribution */}
                  <div className="space-y-4">
                    <h4 className="font-cinzel text-[10px] tracking-[0.3em] text-ash uppercase">Age Spheres</h4>
                    <div className="space-y-3">
                      {Object.entries(stats.ageBuckets).map(([bucket, count]: [string, any]) => (
                        <div key={bucket} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-ash/60 uppercase">
                            <span>{bucket} cycles</span>
                            <span>{count}</span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${(count / 10) * 100}%` }} // Simplified percentage for visualization
                               className="h-full bg-gold/40" 
                             />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Location Distribution */}
                  <div className="space-y-4">
                    <h4 className="font-cinzel text-[10px] tracking-[0.3em] text-ash uppercase">Territorial Clusters</h4>
                    <div className="space-y-3">
                      {Object.entries(stats.locations).map(([loc, count]: [string, any]) => (
                        <div key={loc} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-ash/60 uppercase">
                            <span>{loc}</span>
                            <span>{count}</span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${(count / 10) * 100}%` }}
                               className="h-full bg-ember/40" 
                             />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Occupation Distribution */}
                  <div className="space-y-4">
                    <h4 className="font-cinzel text-[10px] tracking-[0.3em] text-ash uppercase">Guild Orientations</h4>
                    <div className="space-y-3">
                      {Object.entries(stats.occupations).map(([occ, count]: [string, any]) => (
                        <div key={occ} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-ash/60 uppercase">
                            <span>{occ}</span>
                            <span>{count}</span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${(count / 10) * 100}%` }}
                               className="h-full bg-gold/60" 
                             />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
