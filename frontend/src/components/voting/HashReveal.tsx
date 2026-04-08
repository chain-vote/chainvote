import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

function randomHex64() {
  const chars = '0123456789abcdef'
  let out = ''
  for (let i = 0; i < 64; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export function HashReveal({
  label,
  value,
  animating,
  durationMs = 800,
}: {
  label: string
  value?: string
  animating?: boolean
  durationMs?: number
}) {
  const target = value ?? useMemo(() => randomHex64(), [value])
  const [shown, setShown] = useState('')

  useEffect(() => {
    if (!animating) {
      setShown(target)
      return
    }

    setShown('')
    const steps = 64
    const stepMs = Math.max(8, Math.floor(durationMs / steps))
    let i = 0
    const t = window.setInterval(() => {
      i += 1
      setShown(target.slice(0, i))
      if (i >= target.length) window.clearInterval(t)
    }, stepMs)
    return () => window.clearInterval(t)
  }, [animating, target, durationMs])

  return (
    <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded p-3 space-y-2">
      <p className="text-ash text-[10px] tracking-widest uppercase font-sans">{label}</p>
      <motion.p
        animate={animating ? { x: [-2, 2, -1, 1, 0] } : {}}
        transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
        className="font-mono text-xs break-all leading-relaxed text-chaingreen"
      >
        {shown}
      </motion.p>
    </div>
  )
}

