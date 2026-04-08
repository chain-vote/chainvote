import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface OverlayProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  type?: 'alert' | 'confirm'
  confirmText?: string
  cancelText?: string
  children?: ReactNode
}

export function Overlay({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'alert',
  confirmText = 'Proceed',
  cancelText = 'Cancel',
  children
}: OverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-void/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-void/60 border border-white/10 rounded-2xl p-8 shadow-2xl overflow-hidden"
          >
            {/* Glossy highlight */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-ash/40 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <h3 className="font-cinzel text-xl tracking-[0.2em] text-white uppercase mb-4 text-center">{title}</h3>
            <p className="text-ash text-xs leading-relaxed font-sans text-center uppercase tracking-wider mb-8 opacity-80">
              {message}
            </p>

            {children && <div className="mb-8">{children}</div>}

            <div className="flex gap-4">
              {type === 'confirm' && (
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border border-white/10 rounded font-cinzel text-[10px] tracking-[0.3em] uppercase text-ash hover:text-white hover:bg-white/5 transition-all"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={() => {
                  if (onConfirm) onConfirm()
                  else onClose()
                }}
                className={`flex-1 py-3 rounded font-cinzel text-[10px] tracking-[0.4em] uppercase transition-all shadow-lg ${
                  type === 'confirm' 
                    ? 'bg-ember/10 border border-ember/40 text-ember hover:bg-ember hover:text-white shadow-ember/20' 
                    : 'bg-gold/10 border border-gold/40 text-gold hover:bg-gold hover:text-void shadow-gold/20'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
