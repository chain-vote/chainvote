import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { VoterPassportCard } from '../components/ui/VoterPassportCard'
import { BackButton } from '../components/ui/BackButton'
import { useOrientation } from '../hooks/useOrientation'

export function VoterDashboard() {
  const user = useAuthStore((s) => s.user)
  const { isLandscape } = useOrientation()
  
  const { data: elections, isLoading } = useQuery({
    queryKey: ['elections', 'active'],
    queryKeyHashFn: () => 'active-elections',
    queryFn: () => api.getActiveElections(),
  })

  return (
    <div className={`min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto transition-all duration-500`}>
      <BackButton fallback="/identity" />
      
      <motion.div
        layout
        className={`flex ${isLandscape ? 'flex-row gap-12' : 'flex-col'}`}
      >
        {/* Adaptive Sidebar/Header */}
        <div className={`${isLandscape ? 'w-1/3 sticky top-32 h-fit' : 'w-full mb-12'}`}>
          <motion.div layout className="border-b border-white/5 pb-8 mb-8">
            <h2 className="font-cinzel text-4xl tracking-widest text-white uppercase mb-2">Active Rituals</h2>
            <p className="font-cinzel text-[10px] tracking-[0.3em] text-ash uppercase">Identified as: {user?.email}</p>
          </motion.div>
          
          <motion.div 
            layout 
            className={`${isLandscape ? 'scale-90 origin-top-left' : ''}`}
          >
            <VoterPassportCard />
          </motion.div>
        </div>

        {/* Ritual Manifestation Pane (The Grid) */}
        <div className={`${isLandscape ? 'w-2/3' : 'w-full'}`}>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
            </div>
          ) : elections?.length === 0 ? (
            <div className="text-center py-20 border border-white/5 rounded-2xl bg-void/20">
              <p className="font-cinzel text-ash tracking-widest uppercase">The chain is currently silent.</p>
              <p className="text-ash/40 text-[10px] mt-2 uppercase tracking-tighter">No active elections found</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${isLandscape ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
              {elections?.map((election: any, idx: number) => (
                <motion.div
                  key={election.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative bg-void/30 backdrop-blur-md border border-white/10 p-8 rounded-xl hover:border-gold/30 transition-all overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 flex flex-col items-end gap-2">
                    <div className="font-mono text-[9px] text-ash/30 uppercase tracking-tighter">
                       Relay: Active
                    </div>
                    {election.isWhitelistedOnly ? (
                      <div className="bg-ember/10 border border-ember/30 text-ember text-[8px] px-2 py-0.5 rounded font-cinzel tracking-widest uppercase">
                        Whitelist Radius
                      </div>
                    ) : (
                      <div className="bg-gold/10 border border-gold/30 text-gold text-[8px] px-2 py-0.5 rounded font-cinzel tracking-widest uppercase">
                        Public Ballot
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-cinzel text-xl text-white tracking-widest mb-3 group-hover:text-gold transition-colors">{election.title}</h3>
                  <p className="text-ash/60 text-sm mb-8 line-clamp-2 italic">"{election.description}"</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-[10px] font-mono text-ash uppercase">
                      Candidates: {election.candidates.length}
                    </div>
                    <Link
                      to={`/vote?electionId=${election.id}`}
                      className="font-cinzel text-[11px] tracking-[0.3em] uppercase px-6 py-2 border border-white/20 rounded hover:bg-white/5 hover:border-gold/50 transition-all text-white hover:text-gold"
                    >
                      Enter Ballot
                    </Link>
                  </div>

                  <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold group-hover:w-full transition-all duration-700" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
