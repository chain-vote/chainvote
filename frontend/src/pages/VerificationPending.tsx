import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Overlay } from '../components/ui/Overlay'
import { useState } from 'react'

export function VerificationPending() {
  const { clear, user } = useAuthStore()
  const [showOverlay, setShowOverlay] = useState(false)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-void">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,179,0,0.03)_0%,transparent_70%)]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8 relative z-10"
      >
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full border border-gold/20 flex items-center justify-center relative">
            <motion.div 
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-gold/5"
            />
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-gold/60 fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="font-cinzel text-2xl tracking-[0.2em] text-white uppercase">
            Identity Pending
          </h1>
          <p className="text-ash text-sm leading-relaxed opacity-60 font-sans px-4">
            Greeting, Commissioner <span className="text-white/80">{user?.email}</span>. Your ritual of registration is complete, 
            but your identity must be verified by the <span className="text-gold/80 italic">High Architect</span> before you can 
            access the command center.
          </p>
          <p className="text-[10px] uppercase font-cinzel tracking-widest text-ash/40">
            Current Status: Spectral (Awaiting Manifestation)
          </p>
        </div>

        <div className="pt-8 space-y-4">
          <button 
            onClick={() => setShowOverlay(true)}
            className="w-full bg-white/5 border border-white/10 py-4 rounded-lg font-cinzel text-[10px] tracking-[0.3em] text-ash hover:text-white hover:border-gold/30 transition-all uppercase"
          >
            Check Status
          </button>
          
          <button 
            onClick={() => clear()}
            className="w-full font-cinzel text-[9px] tracking-[0.4em] text-ash/30 hover:text-ember transition-colors uppercase pt-4"
          >
            ← Sever Connection (Logout)
          </button>
        </div>
      </motion.div>

      <Overlay 
        isOpen={showOverlay}
        onClose={() => setShowOverlay(false)}
        title="Check Manifestation"
        message="The High Architect has not yet added your essence to the verified scroll. Please try again later or contact the system administrator."
        confirmText="Understood"
      />
    </div>
  )
}
