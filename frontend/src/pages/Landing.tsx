import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

export function Landing() {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()

  const handleEnter = () => {
    if (user && token) {
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/voter/dashboard')
    } else {
      navigate('/identity')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="text-center"
      >
        <div className="mb-8 w-full max-w-full overflow-hidden">
           <h1 className="font-cinzel text-4xl sm:text-8xl tracking-[0.1em] sm:tracking-[0.2em] text-white opacity-90 drop-shadow-[0_0_30px_rgba(255,179,0,0.4)] transition-all">
             CHAINVOTE
           </h1>
        </div>
        
        <p className="font-cinzel text-sm sm:text-lg tracking-[0.3em] text-gold/80 mb-12 max-w-2xl mx-auto uppercase">
          The Unbreakable Fabric of Cryptographic Truth
        </p>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleEnter}
            className="group relative px-12 py-4 overflow-hidden rounded border border-white/20 bg-void/30 backdrop-blur-sm transition-all hover:border-gold/50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="font-cinzel text-xs tracking-[0.4em] uppercase text-white group-hover:text-gold transition-colors">
              Enter
            </span>
          </button>

          <Link
            to="/about"
            className="font-cinzel text-[10px] tracking-[0.5em] uppercase text-ash hover:text-white transition-colors"
          >
            About
          </Link>
        </div>
      </motion.div>

      {/* Aesthetic flourish: Magical Sigil subtle background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-5">
        <svg viewBox="0 0 200 200" className="w-full h-full animate-spin-slow">
          <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <path d="M100 5 L182 170 L18 170 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <path d="M100 195 L18 30 L182 30 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>
    </div>
  )
}

