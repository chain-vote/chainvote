import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../lib/api'

interface DynamicCodeDisplayProps {
  onCodeAvailable?: (code: string) => void
}

export function DynamicCodeDisplay({ onCodeAvailable }: DynamicCodeDisplayProps) {
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCode = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getDynamicCode()
      setCode(data.code)
      if (onCodeAvailable) onCodeAvailable(data.code)
    } catch (err: any) {
      setError('Failed to fetch ritual code')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCode()
  }, [])

  return (
    <div className="bg-void/40 border border-white/10 rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-cinzel text-[10px] tracking-[0.4em] text-ash uppercase">Master Ritual Key</h4>
        <button 
          onClick={fetchCode}
          disabled={loading}
          className="text-[9px] font-cinzel tracking-widest text-gold/60 hover:text-gold uppercase"
        >
          {loading ? 'Manifesting...' : 'Regenerate'}
        </button>
      </div>

      <div className="flex items-center justify-center gap-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-12 flex items-center gap-1"
            >
              {[0, 1, 2].map(i => (
                <motion.div 
                   key={i}
                   animate={{ height: [8, 16, 8] }}
                   transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                   className="w-1 bg-gold/40"
                />
              ))}
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-ember text-[10px] font-mono"
            >
              {error}
            </motion.div>
          ) : (
            <motion.div 
              key="code"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex gap-3"
            >
              {code?.split('').map((char, i) => (
                <div 
                  key={i} 
                  className="w-10 h-14 bg-white/5 border border-gold/20 rounded flex items-center justify-center text-xl font-cinzel text-gold shadow-[0_0_15px_rgba(255,179,0,0.1)]"
                >
                  {char}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-[9px] text-center text-ash/40 uppercase tracking-widest leading-relaxed">
        Type this ephemeral code into the validation scroll below.<br/>
        This key self-destructs upon one usage or after 5 minutes.
      </p>
    </div>
  )
}
