import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'

export function TamperDemo({
  electionId,
  votes,
}: {
  electionId: string
  votes: { id: string; voteHash: string; candidateId: string }[]
}) {
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const [triggered, setTriggered] = useState(false)

  const tamperMutation = useMutation({
    mutationFn: ({ voteId }: { voteId: string }) => api.tamperDemo({ voteId, electionId }),
    onSuccess: () => setTriggered(true),
  })

  return (
    <div className="border border-ember/20 rounded-xl p-8 space-y-6 bg-void/40 backdrop-blur-xl shadow-[0_0_30px_rgba(255,69,0,0.05)]">
      <h3 className="font-cinzel text-ember text-base tracking-[0.2em] uppercase">The Distortion Ritual</h3>
      <p className="text-ash text-[11px] leading-relaxed font-sans opacity-70 uppercase tracking-tight">
        Directly alter the archival records to simulate an outside containment breach. 
        Witness the cryptographic fabric shatter in real time.
      </p>
      <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
        {votes.map((vote) => (
          <button
            key={vote.id}
            onClick={() => setSelectedVote(vote.id)}
            className={`w-full text-left p-3 rounded border transition-all duration-300 ${
              selectedVote === vote.id
                ? 'border-ember bg-ember/10 text-white'
                : 'border-white/5 text-ash/40 hover:border-white/20'
            }`}
          >
            <div className="text-[10px] font-mono tracking-tighter truncate">{vote.voteHash}</div>
          </button>
        ))}
      </div>
      {selectedVote && !triggered && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => tamperMutation.mutate({ voteId: selectedVote })}
          className="w-full py-4 bg-ember/10 border border-ember/40 text-ember font-cinzel text-xs tracking-[0.4em] uppercase rounded hover:bg-ember hover:text-white transition-all duration-500 shadow-[0_0_30px_rgba(255,69,0,0.2)]"
        >
          Iterate Corruption
        </motion.button>
      )}
      {triggered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-ember font-cinzel text-[10px] tracking-[0.3em] uppercase py-2"
        >
          Breach Normalized. Watch the Tree.
        </motion.div>
      )}
      {tamperMutation.isError && (
        <div className="text-[9px] text-ash/50 font-mono text-center uppercase tracking-tighter">
          Containment active: Admin Ritual Missing
        </div>
      )}
    </div>
  )
}

