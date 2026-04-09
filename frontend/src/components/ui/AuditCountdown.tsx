import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ritualChime } from '../layout/TerminalAtmosphere'

interface AuditCountdownProps {
  endTime: string
  title: string
}

export function AuditCountdown({ endTime, title }: AuditCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft(null)
        clearInterval(timer)
        window.location.reload() // Or trigger a reveal
        return
      }

      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  if (!timeLeft) return null

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gold/5 blur-3xl rounded-full animate-pulse" />
          <div className="relative z-10 w-32 h-32 mx-auto border-2 border-gold/20 rounded-full flex items-center justify-center bg-void/50 backdrop-blur-md">
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="text-gold opacity-40 text-4xl font-cinzel select-none"
             >
               ✧
             </motion.div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-gold rounded-full animate-ping" />
             </div>
          </div>
        </div>

        <h2 className="font-cinzel text-3xl text-white tracking-[0.3em] uppercase mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          Ledger Shrouded
        </h2>
        <p className="font-cinzel text-[10px] tracking-[0.4em] text-gold uppercase mb-12 opacity-80">
          Cryptographic Seal in Effect for {title}
        </p>

        <div className="grid grid-cols-4 gap-4 max-w-md mx-auto mb-16">
          {[
            { label: 'Days', value: timeLeft.d },
            { label: 'Hours', value: timeLeft.h },
            { label: 'Minutes', value: timeLeft.m },
            { label: 'Seconds', value: timeLeft.s },
          ].map((unit, i) => (
            <div key={unit.label} className="bg-void/40 border border-white/5 p-4 rounded-xl backdrop-blur-sm group hover:border-gold/20 transition-all">
              <div className="font-mono text-3xl text-white tabular-nums group-hover:text-gold transition-colors">
                {unit.value.toString().padStart(2, '0')}
              </div>
              <div className="font-cinzel text-[8px] text-ash/40 uppercase tracking-widest mt-1">
                {unit.label}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <p className="text-ash/60 text-[11px] leading-relaxed max-w-sm mx-auto italic font-sans">
            "The truth is forged in the silence of the chain. When the hourglass empties, the manifest shall be revealed to all souls."
          </p>
          <div className="pt-8 flex justify-center gap-8">
             <div className="flex flex-col items-center gap-1">
                <div className="w-1 h-1 bg-chaingreen rounded-full animate-pulse" />
                <span className="text-[8px] text-ash/30 uppercase tracking-tighter">Chain Integrity: Intact</span>
             </div>
             <div className="flex flex-col items-center gap-1">
                <div className="w-1 h-1 bg-gold rounded-full animate-pulse" />
                <span className="text-[8px] text-ash/30 uppercase tracking-tighter">Seal: Dual-Lock Active</span>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
