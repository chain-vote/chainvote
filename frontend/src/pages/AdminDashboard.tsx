import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Overlay } from '../components/ui/Overlay'
import { ritualChime } from '../components/layout/TerminalAtmosphere'
import { ManifestationHeatmap } from '../components/ui/ManifestationHeatmap'
import { BackButton } from '../components/ui/BackButton'
import { useOrientation } from '../hooks/useOrientation'
import { useOtpTimer } from '../hooks/useOtpTimer'
import { DynamicCodeDisplay } from '../components/auth/DynamicCodeDisplay'

export function AdminDashboard() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const { isLandscape } = useOrientation()

  const [overlay, setOverlay] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'alert' | 'confirm' | 'delete'
    electionId?: string
    onConfirm?: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  })

  const [deleteOtp, setDeleteOtp] = useState('')
  const [deleteMaster, setDeleteMaster] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showAddEC, setShowAddEC] = useState(false)
  const [newEC, setNewEC] = useState({ email: '', password: '' })

  const otpResend = async () => {
    const data = await api.requestActionOtp()
    setPreviewUrl(data.previewUrl ?? null)
  }

  const otpTimer = useOtpTimer(otpResend)

  const otpMutation = useMutation({
    mutationFn: () => api.requestActionOtp(),
    onSuccess: (data) => {
      setPreviewUrl(data.previewUrl ?? null)
      setOtpSent(true)
      otpTimer.start()
    },
    onError: (err: any) => {
      setOverlay({
        isOpen: true,
        title: 'Ritual Interrupted',
        message: err.message || 'The courier failed to deliver the OTP.',
        type: 'alert'
      })
    }
  })

  const { data: elections, isLoading } = useQuery({
    queryKey: ['elections', 'active'],
    queryFn: () => api.getActiveElections(),
  })

  // Super Admin specific query
  const isSuperAdmin = user?.email === 'tanaytrivedi24@gmail.com'
  const { data: pendingCommissioners, refetch: refetchPending } = useQuery({
    queryKey: ['commissioners', 'pending'],
    queryFn: () => api.getPendingCommissioners(),
    enabled: isSuperAdmin
  })

  const verifyCommissionerMutation = useMutation({
    mutationFn: (id: string) => api.verifyCommissioner(id),
    onSuccess: () => {
      ritualChime('success')
      refetchPending()
      setOverlay({
        isOpen: true,
        title: 'Identity Manifested',
        message: 'The Commissioner has been successfully verified and added to the official scroll.',
        type: 'alert'
      })
    }
  })

  const addCommissionerMutation = useMutation({
    mutationFn: (params: typeof newEC) => api.addCommissioner(params),
    onSuccess: () => {
      ritualChime('success')
      refetchPending()
      setShowAddEC(false)
      setNewEC({ email: '', password: '' })
      setOverlay({
        isOpen: true,
        title: 'Commissioner Added',
        message: 'A new identity has been manually manifested and verified on the scroll.',
        type: 'alert'
      })
    },
    onError: (err: any) => {
      setOverlay({
        isOpen: true,
        title: 'Manifestation Failed',
        message: err.message || 'The ritual was rejected by the database.',
        type: 'alert'
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, otp, masterCode }: { id: string; otp: string; masterCode: string }) =>
      api.deleteElection(id, { otp, masterCode }),
    onSuccess: (data) => {
      ritualChime('success')
      setOverlay({
        isOpen: true,
        title: 'Purge Complete',
        message: data.message || 'The election node has been successfully removed from the chain.',
        type: 'alert',
        onConfirm: () => {
          setOverlay(prev => ({ ...prev, isOpen: false }))
          queryClient.invalidateQueries({ queryKey: ['elections', 'active'] })
        }
      })
    },
    onError: (err: any) => {
      setOverlay({
        isOpen: true,
        title: 'Purge Failed',
        message: err.message || 'The chain resisted the deletion attempt. Ritual incomplete.',
        type: 'alert'
      })
    }
  })

  const handleShare = (election: any) => {
    ritualChime('success')
    const candidatesStr = election.candidates?.map((c: any) => c.name).join(' vs ') || 'Candidates TBD'
    const link = `${window.location.origin}/vote?electionId=${election.id}`
    const message = `Cast your Will in ${election.title} where ${candidatesStr}. Participate in the ritual: ${link}`

    navigator.clipboard.writeText(message)
    setOverlay({
      isOpen: true,
      title: 'Link Manifested',
      message: 'The recruitment spell has been captured into your clipboard.',
      type: 'alert'
    })
  }

  const handleDelete = (id: string, title: string) => {
    ritualChime('click')
    setDeleteOtp('')
    setDeleteMaster('')
    setOverlay({
      isOpen: true,
      title: 'Initiate Purge',
      message: `You are about to purge the "${title}" node. This will erase all candidates and votes from the ledger.`,
      type: 'delete',
      electionId: id,
      onConfirm: () => {
        if (!deleteMaster || deleteOtp.length !== 6) {
          ritualChime('fail')
          return
        }
        deleteMutation.mutate({ id, otp: deleteOtp, masterCode: deleteMaster })
      }
    })
  }

  return (
    <div className={`min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto transition-all duration-500`}>
      <BackButton fallback="/identity" />

      <motion.div
        layout
        className={`flex ${isLandscape ? 'flex-row gap-12' : 'flex-col'}`}
      >
        {/* Adaptive Control Panel */}
        <div className={`${isLandscape ? 'w-2/5 sticky top-32 h-fit space-y-8' : 'w-full space-y-12'}`}>
          <div className="flex justify-between items-end border-b border-white/5 pb-8">
            <div>
              <h2 className="font-cinzel text-2xl sm:text-4xl tracking-[0.2em] sm:tracking-[0.3em] text-gold uppercase mb-2">Command Center</h2>
              <p className="font-cinzel text-[10px] tracking-[0.3em] text-ash uppercase">Commissioner: {user?.email}</p>
            </div>
            {!isLandscape && (
              <Link
                to="/admin/create"
                className="font-cinzel text-[11px] tracking-[0.4em] uppercase px-8 py-3 bg-gold/10 border border-gold/40 text-gold hover:bg-gold hover:text-void rounded transition-all shadow-[0_0_20px_rgba(255,179,0,0.1)]"
              >
                Publish New Election
              </Link>
            )}
          </div>

          {isLandscape && (
            <Link
              to="/admin/create"
              className="block text-center font-cinzel text-[11px] tracking-[0.4em] uppercase px-8 py-5 bg-gold/10 border border-gold/40 text-gold hover:bg-gold hover:text-void rounded transition-all shadow-[0_0_20px_rgba(255,179,0,0.1)]"
            >
              Publish New Election
            </Link>
          )}

          <div className="bg-void/50 border border-gold/30 p-6 rounded-lg hover:bg-gold/5 transition-all cursor-pointer group" onClick={() => window.location.href = '/admin/db-engine'}>
            <h3 className="font-cinzel text-gold text-lg tracking-widest uppercase mb-2 group-hover:text-white transition-colors">Vault Query Engine (SQL)</h3>
            <p className="text-ash text-[11px] uppercase tracking-tighter opacity-60">Directly interface with the SQLite cryptosystem.</p>
          </div>

          {/* Manifestation Heatmap */}
          <div className="bg-void/20 border border-white/5 p-6 rounded-xl">
            <div className="font-cinzel text-[9px] tracking-[0.5em] text-ash uppercase mb-4">Ether Activity</div>
            <ManifestationHeatmap voteCount={elections?.reduce((acc: number, e: any) => acc + (e._count?.votes ?? 0), 0) ?? 0} />
          </div>

          {/* Super Admin Control: Commissioner Requests */}
          {isSuperAdmin && pendingCommissioners && pendingCommissioners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gold/5 border border-gold/20 p-6 rounded-xl space-y-4"
            >
              <div className="font-cinzel text-[10px] tracking-[0.4em] text-gold uppercase mb-2">Pending Identities ({pendingCommissioners.length})</div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {pendingCommissioners.map((ec: any) => (
                  <div key={ec.id} className="border-b border-white/5 pb-4 last:border-0">
                    <div className="text-white text-xs truncate mb-1">{ec.email}</div>
                    <div className="text-[9px] text-ash/60 uppercase tracking-widest mb-3">
                      {ec.location || 'Unknown Realm'} • {ec.occupation || 'Wanderer'}
                    </div>
                    <button
                      onClick={() => verifyCommissionerMutation.mutate(ec.id)}
                      disabled={verifyCommissionerMutation.isPending}
                      className="w-full py-2 bg-gold/10 border border-gold/30 text-[9px] font-cinzel tracking-[0.3em] uppercase text-gold hover:bg-gold hover:text-void transition-all disabled:opacity-50"
                    >
                      {verifyCommissionerMutation.isPending ? 'Verifying...' : 'Approve Identity'}
                    </button>
                  </div>
                ))}
              </div>

              {!showAddEC ? (
                <button
                  onClick={() => setShowAddEC(true)}
                  className="w-full py-3 border border-dashed border-gold/30 text-[9px] font-cinzel tracking-[0.3em] uppercase text-ash hover:text-gold hover:bg-gold/5 transition-all"
                >
                  + Manually Manifest New Identity
                </button>
              ) : (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <input
                    placeholder="Courier Email"
                    value={newEC.email}
                    onChange={(e) => setNewEC(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-void border border-white/10 rounded px-3 py-2 text-xs focus:border-gold outline-none text-ash"
                  />
                  <input
                    placeholder="Binding Password"
                    type="password"
                    value={newEC.password}
                    onChange={(e) => setNewEC(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-void border border-white/10 rounded px-3 py-2 text-xs focus:border-gold outline-none text-ash"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddEC(false)}
                      className="flex-1 py-2 text-[9px] font-cinzel tracking-widest uppercase text-ash hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => addCommissionerMutation.mutate(newEC)}
                      disabled={addCommissionerMutation.isPending}
                      className="flex-1 py-2 bg-gold/20 border border-gold/40 text-[9px] font-cinzel tracking-widest uppercase text-gold hover:bg-gold hover:text-void"
                    >
                      {addCommissionerMutation.isPending ? 'Binding...' : 'Manifest'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Managed Chains Pane */}
        <div className={`${isLandscape ? 'w-3/5' : 'w-full mt-12'}`}>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="font-cinzel text-[10px] tracking-[0.5em] text-ash uppercase mb-6">Managed Chains ({elections?.length})</h3>
              {elections?.map((election: any, idx: number) => (
                <motion.div
                  key={election.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group flex flex-col gap-6 bg-void/30 backdrop-blur-md border border-white/10 p-6 rounded-xl hover:border-gold/30 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 px-3 py-1 bg-white/5 border-l border-b border-white/10 flex items-center gap-3">
                    {election.creatorId === user?.id && (
                      <span className="font-cinzel text-[7px] text-chaingreen tracking-widest uppercase opacity-70">
                        Soul Creator
                      </span>
                    )}
                    {election.isWhitelistedOnly ? (
                      <span className="bg-ember/10 text-ember text-[7px] px-2 py-0.5 rounded font-cinzel tracking-widest uppercase">
                        Whitelist Radius
                      </span>
                    ) : (
                      <span className="bg-gold/10 text-gold text-[7px] px-2 py-0.5 rounded font-cinzel tracking-widest uppercase">
                        Public Ballot
                      </span>
                    )}
                  </div>

                  <div className="pt-2">
                    <h3 className="font-cinzel text-lg text-white tracking-widest mb-1 group-hover:text-gold transition-colors">{election.title}</h3>
                    <div className="font-mono text-[9px] text-ash/40 uppercase tracking-tighter break-all">
                      ID: {election.id}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
                    <Link
                      to={`/audit?electionId=${election.id}`}
                      className="font-cinzel text-[9px] tracking-[0.3em] uppercase text-ash hover:text-white transition-colors border-r border-white/10 pr-3"
                    >
                      Audit
                    </Link>
                    <Link
                      to={`/results?electionId=${election.id}`}
                      className="font-cinzel text-[9px] tracking-[0.3em] uppercase text-ash hover:text-white transition-colors border-r border-white/10 pr-3"
                    >
                      Results
                    </Link>
                    <Link
                      to={`/admin/analytics?electionId=${election.id}`}
                      className="font-cinzel text-[9px] tracking-[0.3em] uppercase text-gold hover:text-gold/100 border-r border-white/10 pr-3"
                    >
                      Analytics
                    </Link>
                    <button
                      onClick={() => handleShare(election)}
                      className="font-cinzel text-[9px] tracking-[0.3em] uppercase text-gold/60 hover:text-gold"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => handleDelete(election.id, election.title)}
                      className="ml-auto font-cinzel text-[9px] tracking-[0.3em] uppercase text-ember/40 hover:text-ember"
                    >
                      Purge
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <Overlay
        isOpen={overlay.isOpen}
        onClose={() => setOverlay(prev => ({ ...prev, isOpen: false }))}
        onConfirm={overlay.onConfirm}
        title={overlay.title}
        message={overlay.message}
        type={overlay.type === 'delete' ? 'confirm' : overlay.type}
        confirmText={overlay.type === 'delete' ? 'Purge Node' : (overlay.type === 'confirm' ? 'Confirm' : 'Acknowledge')}
      >
        {overlay.type === 'delete' && (
          <div className="space-y-6">
            <DynamicCodeDisplay />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-cinzel text-ash tracking-widest uppercase">Email OTP</label>
                <input
                  value={deleteOtp}
                  onChange={(e) => setDeleteOtp(e.target.value)}
                  maxLength={6}
                  className="w-full bg-void/40 border border-gold/20 rounded px-3 py-2 text-center font-mono tracking-widest focus:border-gold outline-none text-gold"
                  placeholder="******"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-cinzel text-ash tracking-widest uppercase">Master Key</label>
                <input
                  value={deleteMaster}
                  onChange={(e) => setDeleteMaster(e.target.value.toUpperCase())}
                  maxLength={3}
                  className="w-full bg-void/40 border border-gold/20 rounded px-3 py-2 text-center font-mono tracking-widest focus:border-gold outline-none text-gold"
                  placeholder="***"
                />
              </div>
            </div>
            {!otpMutation.isPending && !otpSent && (
              <button
                onClick={() => otpMutation.mutate()}
                className="w-full py-2 bg-gold/5 border border-gold/20 text-[9px] font-cinzel tracking-widest text-gold uppercase hover:bg-gold/10 transition-colors"
                type="button"
              >
                Send Action OTP
              </button>
            )}
            {otpSent && <p className="text-[8px] text-chaingreen text-center uppercase tracking-widest">OTP Sent to Courier</p>}
          </div>
        )}
      </Overlay>
    </div>
  )
}
