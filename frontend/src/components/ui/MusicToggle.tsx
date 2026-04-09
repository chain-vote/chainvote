import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { musicEngine } from '../../lib/musicEngine'

export function MusicToggle() {
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('chainvote_music_muted') === 'true'
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Start music on first interaction
    const initMusic = () => {
      if (musicEngine.init()) {
        musicEngine.playTheme('harry_potter')
        musicEngine.setMuted(isMuted)
        setIsVisible(true)
        window.removeEventListener('click', initMusic)
      }
    }
    window.addEventListener('click', initMusic)
    return () => window.removeEventListener('click', initMusic)
  }, [isMuted])

  if (!isVisible) return null

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1, boxShadow: isMuted ? "0 0 15px rgba(255,179,0,0.2)" : "0 0 30px rgba(255,179,0,0.5)" }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        const next = !isMuted
        setIsMuted(next)
        musicEngine.setMuted(next)
        localStorage.setItem('chainvote_music_muted', String(next))
      }}
      className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-3 rounded-full border-2 backdrop-blur-xl transition-all font-cinzel text-[11px] tracking-[0.3em] uppercase
        ${isMuted 
          ? 'bg-void/40 border-gold/20 text-ash/60 opacity-60 hover:opacity-100 hover:border-gold/40' 
          : 'bg-gold/10 border-gold/60 text-gold shadow-[0_0_25px_rgba(212,175,55,0.2)]'}`}
    >
      <div className="relative flex items-center justify-center">
        <span className="text-lg relative z-10">
          {isMuted ? '⚡' : '🔥'}
        </span>
        {!isMuted && (
          <motion.span
            animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-gold/40 rounded-full blur-md"
          />
        )}
      </div>
      <span>{isMuted ? 'Manifest Hum' : 'Silence Hum'}</span>
    </motion.button>
  )
}
