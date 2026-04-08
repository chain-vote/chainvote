import { useMemo } from 'react'

interface VoterSigilProps {
  hash: string | undefined
  size?: number
  className?: string
}

/**
 * VoterSigil: A deterministic, generative geometric sigil.
 * Creates a unique "sacred geometry" pattern for every voter hash.
 */
export function VoterSigil({ hash, size = 64, className = '' }: VoterSigilProps) {
  const elements = useMemo(() => {
    if (!hash) return null
    
    // Seed-based random values from hash
    const seed = hash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const getVal = (idx: number, mod: number) => {
      const charCode = hash.charCodeAt(idx % hash.length)
      return (seed + charCode * (idx + 1)) % mod
    }

    const points: string[] = []
    const numLines = 6 + (seed % 4)
    const center = 50
    const radius = 40

    // Generate symmetric geometric patterns
    for (let i = 0; i < numLines; i++) {
      const angle1 = (getVal(i, 360) * Math.PI) / 180
      const angle2 = (getVal(i + 5, 360) * Math.PI) / 180
      
      const x1 = center + Math.cos(angle1) * radius
      const y1 = center + Math.sin(angle1) * radius
      const x2 = center + Math.cos(angle2) * radius
      const y2 = center + Math.sin(angle2) * radius
      
      points.push(`M ${x1} ${y1} L ${x2} ${y2}`)
      // Symmetric pair
      points.push(`M ${center - (x1 - center)} ${y1} L ${center - (x2 - center)} ${y2}`)
    }

    const circles = [
      { r: 10 + (seed % 15), opacity: 0.3 },
      { r: 35 + (seed % 10), opacity: 0.1 }
    ]

    return { points, circles, seed }
  }, [hash])

  if (!hash || !elements) return (
    <div 
      style={{ width: size, height: size }} 
      className={`bg-white/5 rounded-full animate-pulse ${className}`} 
    />
  )

  const color = `hsl(${elements.seed % 360}, 70%, 70%)`

  return (
    <svg 
      viewBox="0 0 100 100" 
      width={size} 
      height={size} 
      className={`filter drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] transition-all duration-700 ${className}`}
    >
      <defs>
        <linearGradient id={`grad-${hash}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      
      {/* Background Circles */}
      {elements.circles.map((c, i) => (
        <circle 
          key={i} 
          cx="50" cy="50" r={c.r} 
          fill="none" 
          stroke={`url(#grad-${hash})`}
          strokeWidth="0.5" 
          strokeOpacity={c.opacity}
        />
      ))}

      {/* Runic Points */}
      <circle cx="50" cy="50" r="2" fill="#d4af37" />
      
      {/* Connection Lines */}
      {elements.points.map((p, i) => (
        <path 
          key={i} 
          d={p} 
          stroke="white" 
          strokeWidth="0.5" 
          strokeOpacity="0.2"
          className="animate-pulse"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}

      {/* Core Geometry */}
      <polygon 
        points="50,20 80,50 50,80 20,50" 
        fill="none" 
        stroke={`url(#grad-${hash})`}
        strokeWidth="1"
        strokeOpacity="0.6"
      />
    </svg>
  )
}
