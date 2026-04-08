import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VoterSigil } from '../components/ui/VoterSigil'

interface SoulNode {
  hash: string
  position: number
  x: number
  y: number
  z: number
}

/**
 * HallOfSilence: A public 3D-like CSS constellation of voter sigils.
 * Every soul who voted appears as their unique geometric sigil floating
 * in the void — no identities, no hashes — just sacred geometry.
 * Feature #30.
 */
export function HallOfSilence({ votes }: { votes: { voteHash: string; voterHash?: string; position: number }[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  const nodes: SoulNode[] = votes.map((v, i) => {
    const angle = (i / Math.max(votes.length, 1)) * Math.PI * 2
    const radius = 30 + (i % 3) * 12
    return {
      hash: v.voteHash,
      position: v.position,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
      z: (i % 4) * 0.1,
    }
  })

  return (
    <div className="min-h-screen pt-24 pb-20 px-6">
      <div className="text-center mb-10">
        <h1 className="font-cinzel text-4xl tracking-widest text-white uppercase mb-3">Hall of Silence</h1>
        <p className="font-cinzel text-[10px] tracking-[0.3em] text-ash uppercase">
          {votes.length} Souls Have Cast Their Vote
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative w-full max-w-3xl mx-auto rounded-2xl border border-white/5 bg-void/40 overflow-hidden"
        style={{ height: '70vh' }}
      >
        {/* Star field background */}
        <div className="absolute inset-0">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 1.5 + 0.5}px`,
                height: `${Math.random() * 1.5 + 0.5}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.3 + 0.05,
              }}
            />
          ))}
        </div>

        {/* Soul nodes */}
        <AnimatePresence>
          {nodes.map((node) => (
            <motion.div
              key={node.hash}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: node.position * 0.05, duration: 0.6 }}
              className="absolute flex flex-col items-center gap-1 group cursor-pointer"
              style={{
                left: `calc(${node.x}% - 24px)`,
                top: `calc(${node.y}% - 24px)`,
                zIndex: Math.round(node.z * 10),
                transform: `scale(${0.7 + node.z * 0.6})`,
              }}
            >
              <VoterSigil hash={node.hash} size={48} />
              <div className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[8px] text-gold/40 whitespace-nowrap">
                #{node.position}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {votes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-cinzel text-ash/30 text-sm tracking-widest uppercase">The void awaits the first soul.</p>
          </div>
        )}
      </div>
    </div>
  )
}
