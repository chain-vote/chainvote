import { useState } from 'react'
import { motion, Reorder } from 'framer-motion'

interface Candidate {
  id: string
  name: string
  manifesto?: string
}

interface RankedBallotProps {
  candidates: Candidate[]
  onConfirm: (rankings: { candidateId: string; rank: number }[]) => void
  disabled?: boolean
}

/**
 * RankedBallot: Drag-to-rank candidate ordering interface for Feature #16.
 * Voters drag candidates into their preferred order; submitting generates
 * the ranked array for the IRV tallying algorithm.
 */
export function RankedBallot({ candidates, onConfirm, disabled }: RankedBallotProps) {
  const [ordered, setOrdered] = useState<Candidate[]>(candidates)

  const handleConfirm = () => {
    const rankings = ordered.map((c, i) => ({ candidateId: c.id, rank: i + 1 }))
    onConfirm(rankings)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h2 className="font-cinzel text-xl text-gold tracking-widest uppercase">Rank Your Choices</h2>
        <p className="font-sans text-ash/60 text-[11px]">
          Drag candidates to reorder by preference. Rank 1 is your first choice.
          <br />If your first choice cannot win, your next choice counts.
        </p>
      </div>

      <Reorder.Group axis="y" values={ordered} onReorder={setOrdered} className="space-y-3 list-none">
        {ordered.map((candidate, idx) => (
          <Reorder.Item
            key={candidate.id}
            value={candidate}
            className="cursor-grab active:cursor-grabbing"
          >
            <motion.div
              whileDrag={{ scale: 1.03, boxShadow: '0 0 30px rgba(212,175,55,0.3)' }}
              className="flex items-center gap-4 bg-void/50 border border-white/10 rounded-xl px-5 py-4 hover:border-gold/20 transition-colors"
            >
              {/* Rank badge */}
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 font-cinzel text-xs
                ${idx === 0 ? 'border-gold bg-gold/20 text-gold' :
                  idx === 1 ? 'border-white/30 bg-white/5 text-white/60' :
                  'border-white/10 text-ash/40'}`}
              >
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-cinzel text-sm text-white tracking-wide">{candidate.name}</div>
                {candidate.manifesto && (
                  <div className="font-sans text-[10px] text-ash/40 mt-0.5 truncate">{candidate.manifesto}</div>
                )}
              </div>

              {/* Drag indicator */}
              <div className="flex flex-col gap-0.5 opacity-20">
                {[0,1,2].map(i => <div key={i} className="w-4 h-0.5 bg-white rounded" />)}
              </div>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <div className="mt-2 p-4 bg-void/30 border border-gold/10 rounded-lg space-y-1">
        {ordered.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 text-[10px] font-mono text-ash/50">
            <span className="text-gold/60">{i + 1}.</span>
            <span>{c.name}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleConfirm}
        disabled={disabled}
        className="w-full py-4 bg-ember/20 border border-ember/40 text-ember font-cinzel text-xs tracking-[0.4em] uppercase rounded hover:bg-ember/30 transition-all disabled:opacity-40"
      >
        Confirm Ranked Ballot
      </button>
    </div>
  )
}
