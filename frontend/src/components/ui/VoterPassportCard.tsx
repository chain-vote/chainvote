import { useQuery } from '@tanstack/react-query'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { api } from '../../lib/api'
import { VoterSigil } from './VoterSigil'
import { useEffect } from 'react'

export function VoterPassportCard() {
  const { data: passport, isLoading } = useQuery({
    queryKey: ['passport'],
    queryFn: () => api.getPassport(),
  })

  // 3D Glassmorphism Tilt effect
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 })
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 })
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7deg', '7deg'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  if (isLoading) {
    return <div className="h-48 w-full md:w-96 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
  }

  const hash = passport?.document?.id?.split(':').pop() || passport?.voterHash || passport?.traditionalPassport?.voterHash
  const count = passport?.electionCount || passport?.traditionalPassport?.electionCount || 0
  const level = passport?.sigilLevel || passport?.traditionalPassport?.sigilLevel || 1

  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full md:w-[400px] rounded-2xl bg-void/50 backdrop-blur-2xl border border-gold/30 p-8 shadow-[0_0_50px_rgba(212,175,55,0.05)] overflow-hidden cursor-crosshair group"
    >
      {/* Holographic sweep */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      
      <div className="flex justify-between items-start mb-6" style={{ transform: 'translateZ(20px)' }}>
        <div>
          <h3 className="font-cinzel text-xl text-gold tracking-widest uppercase shadow-gold/50 drop-shadow-md">
            Soul Manifest
          </h3>
          <p className="font-mono text-[8px] text-ash/60 tracking-[0.4em] uppercase mt-1">Cryptographic Passport</p>
        </div>
        <div className="bg-gold/10 px-3 py-1 border border-gold/30 rounded font-cinzel text-[10px] text-gold tracking-widest">
          Rank {level}
        </div>
      </div>

      <div className="flex items-center gap-6" style={{ transform: 'translateZ(30px)' }}>
        <div className="shrink-0 bg-void/80 rounded-full p-2 border border-white/5 ring-1 ring-gold/20 relative">
          <VoterSigil hash={hash} size={70 + (level * 5)} className="filter drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
        </div>
        <div className="space-y-4 w-full">
          <div>
            <div className="text-[7px] font-cinzel text-white/40 uppercase tracking-widest">Identity Hash</div>
            <div className="font-mono text-[10px] text-white/90 break-all leading-tight opacity-70 border-l border-gold/30 pl-2 mt-1">
              {hash}
            </div>
          </div>
          <div className="flex justify-between items-end border-t border-white/5 pt-2">
            <div>
              <div className="text-[7px] font-cinzel text-white/40 uppercase tracking-widest">Rituals Completed</div>
              <div className="font-cinzel text-lg text-white mt-1">{count}</div>
            </div>
            {passport?.isW3cDID && (
              <div className="text-[9px] font-mono text-chaingreen uppercase tracking-widest bg-chaingreen/10 px-2 py-1 rounded">
                W3C DID Verified
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decorative corner brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/40 m-3" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/40 m-3" />
    </motion.div>
  )
}
