import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Pulse {
  id: number
  x: number
  y: number
  createdAt: number
}

/**
 * ManifestationHeatmap: A live visual of cryptographic "Node Pulses"
 * representing sealed ballots washing across the Ether.
 * No vote data is ever exposed — this is purely atmospheric.
 */
export function ManifestationHeatmap({ voteCount = 0 }: { voteCount?: number }) {
  const [pulses, setPulses] = useState<Pulse[]>([])
  const [ripples, setRipples] = useState<Pulse[]>([])
  const nextId = useRef(0)
  const prevCount = useRef(voteCount)

  // Spawn a pulse when new votes arrive
  useEffect(() => {
    if (voteCount > prevCount.current) {
      const newPulses = Array.from({ length: voteCount - prevCount.current }, () => ({
        id: nextId.current++,
        x: 10 + Math.random() * 80,
        y: 15 + Math.random() * 70,
        createdAt: Date.now(),
      }))
      setPulses(p => [...p, ...newPulses])
      setRipples(p => [...p, ...newPulses])
      setTimeout(() => {
        const ids = new Set(newPulses.map(p => p.id))
        setRipples(p => p.filter(r => !ids.has(r.id)))
      }, 2000)
    }
    prevCount.current = voteCount
  }, [voteCount])

  // Background ambient pulses (decorative even when no votes)
  useEffect(() => {
    const interval = setInterval(() => {
      const ambient: Pulse = {
        id: nextId.current++,
        x: 10 + Math.random() * 80,
        y: 15 + Math.random() * 70,
        createdAt: Date.now(),
      }
      setPulses(p => [...p.slice(-30), ambient])
      setTimeout(() => {
        setPulses(p => p.filter(r => r.id !== ambient.id))
      }, 4000)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-48 rounded-xl border border-white/5 bg-void/60 overflow-hidden">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="heatgrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#d4af37" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#heatgrid)" />
      </svg>

      {/* Label */}
      <div className="absolute top-3 left-4 font-cinzel text-[9px] tracking-widest text-ash/40 uppercase z-10">
        Node Manifestation — {voteCount} seals
      </div>

      {/* Live pulse dots */}
      <AnimatePresence>
        {pulses.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0.7, scale: 0 }}
            animate={{ opacity: [0.7, 0.3, 0], scale: [0, 1.5, 0.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3.5, ease: 'easeOut' }}
            className="absolute w-3 h-3 rounded-full bg-gold/40 border border-gold/30 shadow-[0_0_8px_rgba(212,175,55,0.5)]"
            style={{ left: `calc(${p.x}% - 6px)`, top: `calc(${p.y}% - 6px)` }}
          />
        ))}
      </AnimatePresence>

      {/* Ripple rings for actual vote events */}
      <AnimatePresence>
        {ripples.map(r => (
          <motion.div
            key={`ripple-${r.id}`}
            initial={{ opacity: 0.8, scale: 0.2 }}
            animate={{ opacity: 0, scale: 4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="absolute w-6 h-6 rounded-full border border-gold/60"
            style={{ left: `calc(${r.x}% - 12px)`, top: `calc(${r.y}% - 12px)` }}
          />
        ))}
      </AnimatePresence>

      {/* Crosshair */}
      <div className="absolute bottom-3 right-4 font-mono text-[8px] text-gold/20 uppercase tracking-widest">
        Ether Relay: Active
      </div>
    </div>
  )
}
