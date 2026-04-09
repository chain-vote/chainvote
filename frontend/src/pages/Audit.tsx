import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useChainStore } from '../store/chainStore'
import { useAuthStore } from '../store/authStore'
import { TamperDemo } from '../components/audit/TamperDemo'
import { MerkleTree3D } from '../components/three/MerkleTree3D'
import { ritualChime } from '../components/layout/TerminalAtmosphere'
import { BackButton } from '../components/ui/BackButton'
import { AuditCountdown } from '../components/ui/AuditCountdown'

export function Audit() {
  const [sp] = useSearchParams()
  const electionId = sp.get('electionId')
  const user = useAuthStore((s) => s.user)
  const setElectionId = useChainStore((s) => s.setElectionId)
  const merkleRoot = useChainStore((s) => s.merkleRoot)

  useEffect(() => {
    setElectionId(electionId ?? null)
  }, [electionId, setElectionId])

  const chainQuery = useQuery({
    queryKey: ['chain', electionId],
    enabled: !!electionId,
    queryFn: () => api.getChain(electionId!),
    refetchInterval: 1200,
  })

  const integrityQuery = useQuery({
    queryKey: ['integrity', electionId],
    enabled: !!electionId,
    queryFn: () => api.verifyChain(electionId!),
    refetchInterval: 900,
  })

  const electionQuery = useQuery({
    queryKey: ['election', electionId],
    enabled: !!electionId,
    queryFn: () => api.getElection(electionId!),
  })

  const handleDownloadLedger = async () => {
    if (!electionId) return
    const url = `${import.meta.env.VITE_API_URL}/api/admin/elections/${electionId}/export`
    const token = useAuthStore.getState().token
    
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', `ledger_${electionId}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Ledger export ritual interrupted:', err)
    }
  }

  const integrityByVoteHash = useMemo(() => {
    const m: Record<string, boolean> = {}
    for (const row of integrityQuery.data ?? []) {
      const voteHash = row.vote_hash ?? row.voteHash
      if (voteHash) m[voteHash] = !!row.chain_intact
    }
    return m
  }, [integrityQuery.data])

  useEffect(() => {
    const hasBreach = Object.values(integrityByVoteHash).some(v => v === false)
    if (hasBreach) {
      ritualChime('fail')
    }
  }, [integrityByVoteHash])

  if (!electionId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-void/70 backdrop-blur-md p-6 sm:p-8">
          <h1 className="font-cinzel text-3xl text-ember">Missing electionId</h1>
          <p className="mt-4 text-ash font-sans text-sm">Return to Landing and open Audit from an active election.</p>
          <div className="mt-6">
            <Link to="/" className="px-6 py-2 rounded bg-ember text-white font-cinzel text-xs tracking-widest uppercase">
              Return
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const votes = chainQuery.data ?? []
  const election = electionQuery.data

  const isSealed = election?.auditVisibility === 'SEALED' && new Date(election.endTime) > new Date()

  if (electionQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  if (isSealed) {
    return (
      <div className="min-h-screen bg-void">
         <BackButton fallback="/identity" />
         <div className="pt-32">
           <AuditCountdown endTime={election!.endTime} title={election!.title} />
         </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <BackButton fallback="/identity" />
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <MerkleTree3D />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:py-20 lg:pt-32 pointer-events-auto flex flex-col items-center">
        <div className="w-full max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
            <div>
              <h1 className="font-cinzel text-4xl text-gold">Audit Explorer</h1>
              <p className="mt-2 text-ash text-sm font-sans">
                Public chain read. Integrity verification. Real-time breach signaling.
              </p>
            </div>
            <div className="text-left md:text-right w-full md:w-auto overflow-hidden">
              <div className="text-[10px] tracking-widest uppercase text-ash font-sans">Merkle Root</div>
              <div className="mt-2 font-mono text-[11px] text-gold break-all w-full md:w-80">{merkleRoot || '—'}</div>
            </div>
          </div>

          <div className="mt-10 grid lg:grid-cols-[1fr_380px] gap-8">
            <div className="rounded-2xl border border-white/10 bg-void/70 backdrop-blur-md overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="font-cinzel tracking-wide text-white">Vote Chain</div>
                <div className="text-[11px] font-mono text-ash">{votes.length} votes</div>
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                {votes.map((v: any, idx: number) => {
                  const intact = integrityByVoteHash[v.voteHash] !== false
                  return (
                    <div key={v.id} className="relative">
                      {/* Connection Line */}
                      {idx > 0 && (
                        <div className="absolute left-10 -top-4 w-0.5 h-4 bg-gradient-to-b from-white/10 to-gold/30" />
                      )}
                      
                      <div className="px-6 py-4 border-b border-white/5 relative z-10 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-[10px] tracking-widest uppercase font-sans text-ash">
                            {new Date(v.timestamp).toLocaleString()}
                          </div>
                          <div
                            className={`text-[10px] tracking-widest uppercase font-sans ${
                              intact ? 'text-chaingreen' : 'text-ember'
                            }`}
                          >
                            {intact ? 'Chain intact' : 'Broken link'}
                          </div>
                        </div>
                        <div className={`mt-2 font-mono text-[11px] break-all ${intact ? 'text-white' : 'text-ember hologram-glitch'}`}>
                          {v.voteHash}
                        </div>
                        <div className="mt-2 font-mono text-[10px] text-ash break-all opacity-40">{v.prevHash}</div>
                      </div>
                    </div>
                  )
                })}
                {votes.length === 0 && (
                  <div className="px-6 py-10 text-ash font-sans text-sm">No votes yet. Cast one to crystallize a node.</div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <TamperDemo
                electionId={electionId}
                votes={votes.map((v: any) => ({ id: v.id, voteHash: v.voteHash, candidateId: v.candidateId }))}
              />
              <div className="rounded-2xl border border-white/10 bg-void/70 backdrop-blur-md p-6">
                <div className="font-cinzel text-white">Navigation</div>
                <div className="mt-4 flex flex-col sm:flex-row lg:flex-col gap-3">
                  <Link
                    to={`/vote?electionId=${electionId}`}
                    className="flex justify-center px-6 py-2 rounded bg-ember text-white font-cinzel text-xs tracking-widest uppercase shadow-ember"
                  >
                    Cast Vote
                  </Link>
                  <Link
                    to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/voter/dashboard'}
                    className="flex justify-center px-6 py-2 rounded border border-white/10 text-ash font-cinzel text-[10px] tracking-widest uppercase hover:text-white transition-all"
                  >
                    ← Return to Command
                  </Link>
                  
                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={handleDownloadLedger}
                      className="flex justify-center px-6 py-2 rounded bg-gold/10 border border-gold/40 text-gold font-cinzel text-xs tracking-widest uppercase hover:bg-gold hover:text-void transition-all shadow-[0_0_20px_rgba(255,179,0,0.1)]"
                    >
                      Download Ledger
                    </button>
                  )}

                  <Link
                    to="/"
                    className="flex justify-center px-6 py-2 rounded border border-white/15 text-white/90 font-cinzel text-xs tracking-widest uppercase hover:border-white/30"
                  >
                    Landing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
