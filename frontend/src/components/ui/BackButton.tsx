import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export function BackButton({ fallback = '/' }: { fallback?: string }) {
  const navigate = useNavigate()

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => {
        if (window.history.length > 2) {
          navigate(-1)
        } else {
          navigate(fallback)
        }
      }}
      className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-void/50 backdrop-blur-md border border-white/10 rounded-full font-cinzel text-[10px] tracking-widest text-ash hover:text-gold hover:border-gold/30 transition-all uppercase"
    >
      <span className="text-sm">←</span>
      <span>Back</span>
    </motion.button>
  )
}
