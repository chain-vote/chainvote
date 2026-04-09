import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

  const toggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    musicEngine.setMuted(next)
    localStorage.setItem('chainvote_music_muted', String(next))
  }

  if (!isVisible) return null

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-6 right-6 z-[100]"
    >
      <button
        onClick={toggleMute}
        className={`relative group p-3 rounded-full border transition-all duration-500 ${
          isMuted ? 'border-white/10 bg-void/50' : 'border-gold/40 bg-gold/10 shadow-[0_0_20px_rgba(255,179,0,0.2)]'
        }`}
        title={isMuted ? "Awaken the Harmonies" : "Silence the Celestial BGM"}
      >
         <div className="relative z-10">
           {isMuted ? (
             <span className="text-ash/40 group-hover:text-ash transition-colors">🔇</span>
           ) : (
             <motion.span 
               animate={{ rotate: [0, 5, -5, 0] }}
               transition={{ repeat: Infinity, duration: 2 }}
               className="text-gold block"
             >
               ⚡
             </motion.span>
           )}
         </div>
         
         <AnimatePresence>
           {!isMuted && (
             <motion.div 
               initial={{ opacity: 0, scale: 1 }}
               animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.4, 1] }}
               className="absolute inset-0 bg-gold/20 rounded-full blur-md"
             />
           )}
         </AnimatePresence>

         <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-void/80 backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-lg text-[8px] font-cinzel tracking-widest text-gold uppercase">
            BGM: Harry Potter
         </div>
      </button>
    </motion.div>
  )
}
