import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'

export function VoterIDCard() {
  const user = useAuthStore((s) => s.user)
  
  if (!user) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      className="relative group perspective-[1000px] w-full max-w-sm h-56 mx-auto mb-16"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-white/5 to-ember/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-700 group-hover:rotate-x-2 group-hover:rotate-y-6">
        {/* Holographic Slices */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.4)_40%,transparent_60%)] bg-[length:200%_100%] animate-shimmer pointer-events-none" />
        
        {/* Card Header */}
        <div className="p-6 flex justify-between items-start">
          <div>
            <h3 className="font-cinzel text-xs tracking-[0.3em] text-gold uppercase mb-1">Voter Identity</h3>
            <p className="font-mono text-[9px] text-ash tracking-tight uppercase">ChainVote Protocol v1.0</p>
          </div>
          <div className="w-10 h-10 border border-gold/40 rounded bg-gold/5 flex items-center justify-center p-1">
             <div className="w-full h-full border border-gold/20 flex flex-col justify-around py-1">
                {[1,2,3].map(i => <div key={i} className="h-0.5 bg-gold/30 mx-1" />)}
             </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 mt-4">
          <p className="font-cinzel text-lg text-white tracking-widest">{user.email.split('@')[0]}</p>
          <p className="font-mono text-[9px] text-ash/60 mt-1">{user.email}</p>
        </div>

        {/* Cryptographic Proof */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-white/5 border-t border-white/10 backdrop-blur-sm">
           <div className="flex justify-between items-end">
              <div className="flex-1 overflow-hidden">
                <p className="text-[8px] font-mono text-ash/40 uppercase tracking-widest mb-1">Voter Hash Seal</p>
                <p className="text-[9px] font-mono text-chaingreen truncate pr-4">{user.voterHash || 'IDENTITY_NOT_SEALED'}</p>
              </div>
              <div className="text-[8px] font-mono text-ash/60 text-right uppercase">
                Role: {user.role}
              </div>
           </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2" />
      </div>
    </motion.div>
  )
}
