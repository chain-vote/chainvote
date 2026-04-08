import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function VoidBackground() {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number; symbol: string }[]>([])
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const runes = ['Ψ', 'Ω', 'Σ', 'Δ', 'ϔ', 'Λ', 'Ξ', 'Π', 'Φ']
    const p = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 12 + 8,
      duration: Math.random() * 15 + 15,
      symbol: runes[Math.floor(Math.random() * runes.length)]
    }))
    setParticles(p)

    const handleMouseMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="fixed inset-0 z-0 bg-void overflow-hidden pointer-events-none">
      {/* Nebula Flares */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-gold/5 blur-[120px] rounded-full animate-void-drift" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-ember/5 blur-[100px] rounded-full animate-void-drift" style={{ animationDirection: 'reverse' }} />
      
      {/* Stars/Data Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0.05, y: `${p.y}%`, x: `${p.x}%` }}
          animate={{ 
            opacity: [0.05, 0.2, 0.05],
            y: [`${p.y}%`, `${(p.y + 5) % 100}%`],
            translateX: mouse.x * (p.size / 20),
            translateY: mouse.y * (p.size / 20),
          }}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity, 
            ease: "linear",
            opacity: { duration: 4, repeat: Infinity }
          }}
          className="absolute text-gold font-cinzel select-none filter blur-[0.5px]"
          style={{ fontSize: p.size, left: `${p.x}%`, top: `${p.y}%` }}
        >
          {p.symbol}
        </motion.div>
      ))}

      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} 
      />
    </div>
  )
}
