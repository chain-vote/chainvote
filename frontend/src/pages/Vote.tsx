import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useChainStore } from '../store/chainStore'
import { useVoteStore } from '../store/voteStore'
import { CandidateCard } from '../components/voting/CandidateCard'
import { VoteCeremony } from '../components/voting/VoteCeremony'
import { BackButton } from '../components/ui/BackButton'
import { useOrientation } from '../hooks/useOrientation'
import { motion } from 'framer-motion'

export function Vote() {
  const [sp] = useSearchParams()
  const electionId = sp.get('electionId')
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const voterHash = user?.voterHash
  const { isLandscape } = useOrientation()

  const setElectionId = useChainStore((s) => s.setElectionId)
  const selectedCandidateId = useVoteStore((s) => s.selectedCandidateId)
  const setSelectedCandidateId = useVoteStore((s) => s.setSelectedCandidateId)

  useEffect(() => {
    setElectionId(electionId ?? null)
  }, [electionId, setElectionId])

  const electionQuery = useQuery({
    queryKey: ['election', electionId],
    enabled: !!electionId,
    queryFn: () => api.getElection(electionId!),
  })

  const candidates = electionQuery.data?.candidates ?? []
  const selectedCandidate = useMemo(
    () => candidates.find((c: any) => c.id === selectedCandidateId) ?? null,
    [candidates, selectedCandidateId],
  )

  if (!token || !voterHash) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-void/70 backdrop-blur-md p-8">
          <h1 className="font-cinzel text-3xl text-ember">Unauthenticated</h1>
          <p className="mt-4 text-ash font-sans text-sm leading-relaxed">
            You must verify an OTP before you can cast a vote.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/"
              className="px-6 py-2 rounded border border-white/15 text-white/90 font-cinzel text-xs tracking-widest uppercase"
            >
              Return
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen transition-all duration-500">
      <BackButton fallback="/voter/dashboard" />
      <div className="relative z-10 px-6 pt-32 pb-20 pointer-events-auto">
        <div className={`mx-auto ${isLandscape ? 'max-w-7xl' : 'max-w-6xl'}`}>
          
          <motion.div 
            layout
            className={`flex ${isLandscape ? 'flex-row gap-12' : 'flex-col'}`}
          >
            {/* Adaptive Header Section */}
            <div className={`${isLandscape ? 'w-2/5 sticky top-32 h-fit space-y-8' : 'w-full mb-12'}`}>
              <div className="pb-8 border-b border-white/10">
                <h1 className="font-cinzel text-4xl lg:text-5xl text-gold tracking-tight">{electionQuery.data?.title ?? 'Supreme Ballot'}</h1>
                <p className="mt-4 text-ash/80 text-sm font-sans leading-relaxed">
                  {electionQuery.data?.description ?? 'The ancient ledger awaits your cryptographic signature.'}
                </p>
              </div>
              
              <div className="bg-void/40 backdrop-blur-md border border-white/5 p-4 rounded-xl">
                <div className="text-[9px] tracking-[0.2em] uppercase text-ash/60 font-sans mb-1">Voter Identification</div>
                <div className="font-mono text-[11px] text-chaingreen/80 break-all leading-tight">{voterHash}</div>
              </div>

              {/* Action Links (Simplified for Sidebar) */}
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/voter/dashboard"
                  className="px-4 py-2 rounded border border-white/10 text-ash font-cinzel text-[9px] tracking-widest uppercase hover:text-white"
                >
                  ← Back
                </Link>
                {electionId && (
                  <Link
                    to={`/audit?electionId=${electionId}`}
                    className="px-4 py-2 rounded border border-gold/20 bg-gold/5 text-gold font-cinzel text-[9px] tracking-widest uppercase"
                  >
                    Audit
                  </Link>
                )}
              </div>
            </div>

            {/* Voting Arena */}
            <div className={`${isLandscape ? 'w-3/5' : 'w-full'}`}>
              {!selectedCandidate && electionQuery.data?.votingMode !== 'RANKED' && (
                <div className={`grid gap-6 ${
                  candidates.length === 1 ? 'max-w-md mx-auto grid-cols-1' : 
                  isLandscape ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'
                }`}>
                  {candidates.map((c: any) => (
                    <CandidateCard
                      key={c.id}
                      name={c.name}
                      manifesto={c.manifesto}
                      selected={selectedCandidateId === c.id}
                      onSelect={() => setSelectedCandidateId(c.id)}
                    />
                  ))}
                </div>
              )}

              {selectedCandidate && electionId && electionQuery.data?.votingMode !== 'RANKED' && (
                <div className="rounded-2xl border border-white/10 bg-void/70 backdrop-blur-md">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <div className="font-cinzel text-gold tracking-wide">Ceremony</div>
                    <button
                      onClick={() => setSelectedCandidateId(null)}
                      className="text-[11px] font-cinzel tracking-widest uppercase text-ash hover:text-white"
                    >
                      Change candidate
                    </button>
                  </div>
                  <VoteCeremony
                    electionId={electionId}
                    candidateId={selectedCandidate.id}
                    candidateName={selectedCandidate.name}
                  />
                </div>
              )}

              {electionQuery.data?.votingMode === 'RANKED' && electionId && !selectedCandidate && (
                <div className="rounded-2xl border border-white/10 bg-void/70 backdrop-blur-md p-8">
                  <div className="font-cinzel text-gold tracking-widest uppercase mb-8 text-center text-sm border-b border-gold/10 pb-4">
                    Ranked Choice Manifestation
                  </div>
                  <VoteCeremony
                     electionId={electionId}
                     candidateId={candidates[0]?.id || ''}
                     candidateName="Ranked Ballot"
                     isRanked={true}
                     candidates={candidates}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

