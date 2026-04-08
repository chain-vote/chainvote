import { motion } from 'framer-motion'
import { useEffect } from 'react'

/**
 * TheSilence: A 3-second full-screen darkening "meditation" overlay
 * that appears before the voter sees their ballot choices.
 * Forces a moment of gravity before the irreversible act of voting.
 * Feature #14.
 */
export function TheSilence({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timeout = setTimeout(onComplete, 3200)
    return () => clearTimeout(timeout)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8] }}
        transition={{ duration: 3, times: [0, 0.25, 0.75, 1] }}
        className="flex flex-col items-center gap-6"
      >
        {/* Void Eye */}
        <div className="relative">
          <motion.div
            className="w-24 h-24 rounded-full border border-gold/20"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-4 h-4 rounded-full bg-gold/60 shadow-[0_0_20px_rgba(212,175,55,0.8)]" />
          </motion.div>
        </div>

        <div className="font-cinzel text-white/40 text-[10px] tracking-[0.8em] uppercase">
          The Silence
        </div>
        <div className="font-sans text-ash/30 text-[9px] text-center max-w-xs">
          Your vote is permanent, anonymous, and cryptographically sealed.
          <br />Consider carefully.
        </div>
      </motion.div>
    </motion.div>
  )
}
