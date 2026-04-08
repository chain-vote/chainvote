import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { VoterPassportCard } from '../components/ui/VoterPassportCard'
import { BackButton } from '../components/ui/BackButton'

export function VoterDashboard() {
  const user = useAuthStore((s) => s.user)
  
  const { data: elections, isLoading } = useQuery({
    queryKey: ['elections', 'active'],
    queryKeyHashFn: () => 'active-elections',
    queryFn: () => api.getActiveElections(),
  })

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-6xl mx-auto">
      <BackButton fallback="/identity" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-end mb-16 border-b border-white/5 pb-8">
          <div>
            <h2 className="font-cinzel text-4xl tracking-widest text-white uppercase mb-2">Active Rituals</h2>
            <p className="font-cinzel text-[10px] tracking-[0.3em] text-ash uppercase">Identified as: {user?.email}</p>
          </div>
          <div className="hidden lg:block ml-auto mr-12">
            <VoterPassportCard />
          </div>
        </div>
        
        <div className="lg:hidden mb-12">
          <VoterPassportCard />
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {elections?.map((election: any, idx: number) => (
              <motion.div
                key={election.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-void/30 backdrop-blur-md border border-white/10 p-8 rounded-xl hover:border-gold/30 transition-all overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-ash/30 uppercase tracking-tighter">
                   Relay: Active
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
      </motion.div>
    </div>
  )
}
