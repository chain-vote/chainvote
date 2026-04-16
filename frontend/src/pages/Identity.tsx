import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { BackButton } from '../components/ui/BackButton'

export function Identity() {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()

  useEffect(() => {
    if (user && token) {
      navigate(user.role === 'ADMIN' || user.role === 'COMMISSIONER' ? '/admin/dashboard' : '/voter/dashboard')
    }
  }, [user, token, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <BackButton fallback="/" />
      <motion.h2 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="font-cinzel text-3xl tracking-[0.3em] text-white mb-16 uppercase opacity-80"
      >
        Choose Your Identity
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <IdentityCard 
          title="Election Commissioner"
          description="Access the Command Center to architect live elections, configure candidates, and publish the chain."
          link="/auth/commissioner"
          color="gold"
          delay={0.2}
        />
        <IdentityCard 
          title="Citizen Voter"
          description="Enter the ritual of truth. Authenticate to claim your cryptographic ballot and cast your vote."
          link="/auth/voter"
          color="white"
          delay={0.4}
        />
      </div>

    </div>
  )
}

function IdentityCard({ title, description, link, color, delay }: any) {
  const isGold = color === 'gold'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8 }}
    >
      <Link
        to={link}
        className={`group relative flex flex-col items-center justify-center p-12 h-full text-center border transition-all duration-500 rounded-lg overflow-hidden ${
          isGold 
            ? 'border-gold/20 bg-gold/5 hover:border-gold/60 hover:shadow-[0_0_40px_rgba(255,179,0,0.1)]' 
            : 'border-white/10 bg-white/5 hover:border-white/40 hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]'
        }`}
      >
        <div className={`font-cinzel text-xl tracking-widest uppercase mb-4 transition-colors ${isGold ? 'text-gold' : 'text-white'}`}>
          {title}
        </div>
        <p className="text-ash text-sm font-sans leading-relaxed tracking-wide opacity-60 group-hover:opacity-100 transition-opacity">
          {description}
        </p>

        {/* Decorative corner accents */}
        <div className={`absolute top-0 left-0 w-8 h-8 border-t border-l transition-opacity opacity-20 group-hover:opacity-100 ${isGold ? 'border-gold' : 'border-white'}`} />
        <div className={`absolute bottom-0 right-0 w-8 h-8 border-b border-r transition-opacity opacity-20 group-hover:opacity-100 ${isGold ? 'border-gold' : 'border-white'}`} />
      </Link>
    </motion.div>
  )
}
