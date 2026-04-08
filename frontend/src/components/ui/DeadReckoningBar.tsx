import { motion } from 'framer-motion'

type WaypointStatus = 'pending' | 'active' | 'done'

const WAYPOINTS = [
  { id: 'identity', label: 'Identity Verified' },
  { id: 'proof', label: 'ZKP Generated' },
  { id: 'hash', label: 'Hash Forged' },
  { id: 'chain', label: 'Chain Linked' },
  { id: 'merkle', label: 'Merkle Sealed' },
]

const stageToWaypoint: Record<string, string> = {
  otp_sent: 'identity',
  shrouded_proof: 'proof',
  computing: 'hash',
  chaining: 'chain',
  sealing: 'merkle',
  confirmed: 'merkle',
}

/**
 * DeadReckoningBar: A celestial navigation progress metaphor for the vote ceremony.
 * Shows a glowing dot traveling across waypoints from Identity → Merkle Sealed.
 * Feature #28.
 */
export function DeadReckoningBar({ stage }: { stage: string }) {
  const activeId = stageToWaypoint[stage]

  const getStatus = (id: string): WaypointStatus => {
    const activeIdx = WAYPOINTS.findIndex(w => w.id === activeId)
    const thisIdx = WAYPOINTS.findIndex(w => w.id === id)
    if (stage === 'confirmed') return 'done'
    if (thisIdx < activeIdx) return 'done'
    if (thisIdx === activeIdx) return 'active'
    return 'pending'
  }

  if (stage === 'idle') return null

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4">
      <div className="relative flex items-center justify-between">
        {/* Connector line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/5" />

        {WAYPOINTS.map((wp, i) => {
          const status = getStatus(wp.id)
          return (
            <div key={wp.id} className="relative flex flex-col items-center z-10" style={{ flex: i === 0 || i === WAYPOINTS.length - 1 ? '0 0 auto' : '1' }}>
              {/* Dot */}
              <motion.div
                className={`w-3 h-3 rounded-full border transition-colors duration-500 ${
                  status === 'done'
                    ? 'bg-chaingreen border-chaingreen shadow-[0_0_8px_rgba(0,255,128,0.4)]'
                    : status === 'active'
                    ? 'bg-gold border-gold shadow-[0_0_12px_rgba(212,175,55,0.8)]'
                    : 'bg-transparent border-white/15'
                }`}
                animate={status === 'active' ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              {/* Label */}
              <div className={`mt-2 font-cinzel text-[7px] tracking-widest uppercase text-center whitespace-nowrap ${
                status === 'done' ? 'text-chaingreen/60' : status === 'active' ? 'text-gold' : 'text-ash/20'
              }`}>
                {wp.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
