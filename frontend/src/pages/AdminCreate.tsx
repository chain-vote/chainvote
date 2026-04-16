import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Overlay } from '../components/ui/Overlay'
import { useOtpTimer } from '../hooks/useOtpTimer'
import { BackButton } from '../components/ui/BackButton'
import { ritualChime } from '../components/layout/TerminalAtmosphere'
import { DynamicCodeDisplay } from '../components/auth/DynamicCodeDisplay'

export function AdminCreate() {
  const navigate = useNavigate()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [candidates, setCandidates] = useState([{ name: '', manifesto: '' }, { name: '', manifesto: '' }])
  const [pathCount, setPathCount] = useState('2')
  
  const [otp, setOtp] = useState('')
  const [masterCode, setMasterCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isWhitelistedOnly, setIsWhitelistedOnly] = useState(false)
  const [whitelistedEmailsText, setWhitelistedEmailsText] = useState('')
  const [votingMode, setVotingMode] = useState<'NORMAL' | 'RANKED'>('NORMAL')
  const [atmosphereTheme, setAtmosphereTheme] = useState<string>('void')
  const [quorumPercent, setQuorumPercent] = useState<string>('')
  const [durationDays, setDurationDays] = useState<string>('30')
  const [publishAsDraft, setPublishAsDraft] = useState(false)
  const [auditVisibility, setAuditVisibility] = useState<'OPEN' | 'SEALED'>('OPEN')
  const [endTime, setEndTime] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 16)
  })
  const [overlay, setOverlay] = useState<{
    isOpen: boolean
    title: string
    message: string
  }>({
    isOpen: false,
    title: '',
    message: ''
  })

  // Dynamic Architect Logic
  const handlePathCountChange = (val: string) => {
    setPathCount(val)
    const count = parseInt(val) || 0
    if (count > 0 && count <= 50) {
      const next = [...candidates]
      if (count > next.length) {
        for (let i = next.length; i < count; i++) {
          next.push({ name: '', manifesto: '' })
        }
      } else {
        next.splice(count)
      }
      setCandidates(next)
    }
  }

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
        message: err.message || 'The courier failed to deliver the OTP. Check your connection to the chain.'
      })
    }
  })

  const publishMutation = useMutation({
    mutationFn: (data: any) => api.createElection(data),
    onSuccess: () => navigate('/admin/dashboard'),
    onError: (err: any) => {
      ritualChime('fail')
      setOverlay({
        isOpen: true,
        title: 'Publication Failed',
        message: err.message || 'The ballot could not be linked to the chain. Verification ritual may have failed.'
      })
    }
  })

  const handleAddCandidate = () => {
    setCandidates([...candidates, { name: '', manifesto: '' }])
    setPathCount((candidates.length + 1).toString())
  }

  const handleCandidateChange = (idx: number, field: string, val: string) => {
    const next = [...candidates]
    ;(next[idx] as any)[field] = val
    setCandidates(next)
  }

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = "The oracle requires a title to name the ritual."
    if (!description.trim()) newErrors.description = "A mandate is necessary to guide the souls."
    if (candidates.filter(c => c.name.trim() !== '').length < 2) {
      newErrors.candidates = "At least two paths (candidates) must be defined for a valid ritual."
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      ritualChime('fail')
      return
    }

    if (!otpSent) {
      otpMutation.mutate()
      return
    }
    
    if (!masterCode) {
      setErrors(prev => ({ ...prev, masterCode: "The Master Code is required for the Dual-Lock ritual." }))
      return
    }

    if (otp.length !== 6) {
      setErrors(prev => ({ ...prev, otp: "The OTP must be a 6-digit manifest." }))
      return
    }

    const whitelistedEmails = whitelistedEmailsText
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.includes('@'))

    publishMutation.mutate({ 
      title, 
      description, 
      candidates: candidates.filter(c => c.name.trim() !== ''), 
      otp, 
      masterCode,
      isWhitelistedOnly,
      whitelistedEmails,
      votingMode,
      atmosphereTheme,
      quorumPercent: quorumPercent ? parseInt(quorumPercent) : undefined,
      endTime: new Date(endTime).toISOString(),
      publishAsDraft,
      auditVisibility,
    })
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <BackButton fallback="/admin/dashboard" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-void/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 lg:p-12 shadow-2xl relative"
      >
        <div className="flex justify-between items-start mb-12">
          <div>
            <h2 className="font-cinzel text-3xl tracking-[0.2em] text-white uppercase mb-2">Architect New Election</h2>
            <p className="font-cinzel text-[10px] tracking-[0.3em] text-ash uppercase">Phase 1: Defining the Ballot</p>
          </div>
        </div>

        <form onSubmit={handlePublish} className="space-y-12">
          {/* Section 1: Core Data & Visibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="space-y-6 p-6 border border-white/5 bg-void/20 rounded-xl">
                <div className="space-y-2">
                  <label className="font-cinzel text-[10px] tracking-widest text-gold uppercase">Election Title</label>
                  <input 
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      if (errors.title) setErrors(prev => ({ ...prev, title: '' }))
                    }}
                    className={`w-full bg-void/50 border rounded-lg px-4 py-3 text-sm focus:border-gold/30 outline-none transition-colors ${
                      errors.title ? 'border-ember/50 shadow-[0_0_10px_rgba(255,100,100,0.1)]' : 'border-white/5'
                    }`}
                    placeholder="The Eternal Assembly"
                  />
                  {errors.title && <p className="text-[9px] text-ember uppercase tracking-widest mt-1 ml-1">{errors.title}</p>}
                </div>
                <div className="space-y-2">
                  <label className="font-cinzel text-[10px] tracking-widest text-gold uppercase">Mandate / Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      if (errors.description) setErrors(prev => ({ ...prev, description: '' }))
                    }}
                    className={`w-full bg-void/50 border rounded-lg px-4 py-3 text-sm focus:border-gold/30 outline-none h-32 resize-none transition-colors ${
                      errors.description ? 'border-ember/50 shadow-[0_0_10px_rgba(255,100,100,0.1)]' : 'border-white/5'
                    }`}
                    placeholder="Define the purpose of this cryptographic gathering..."
                  />
                  {errors.description && <p className="text-[9px] text-ember uppercase tracking-widest mt-1 ml-1">{errors.description}</p>}
                </div>
              </div>

              {/* Ritual Parameters */}
              <div className="space-y-6 p-6 border border-white/5 bg-void/20 rounded-xl">
                <div className="space-y-2">
                  <label className="font-cinzel text-[10px] tracking-widest text-gold uppercase">Audit Visibility Ritual</label>
                  <div className="flex bg-void/50 rounded-lg p-1 border border-white/5">
                    {(['OPEN', 'SEALED'] as const).map(m => (
                      <button
                        key={m} type="button"
                        onClick={() => setAuditVisibility(m)}
                        className={`flex-1 py-1.5 font-cinzel text-[9px] tracking-widest uppercase rounded transition-all ${
                          auditVisibility === m ? 'bg-gold/20 text-gold shadow-[0_0_10px_rgba(212,175,55,0.1)]' : 'text-ash/40 hover:text-ash'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-ash/40 font-sans italic">
                    {auditVisibility === 'OPEN' 
                      ? 'Nodes are witnessed in real-time as they are forged.' 
                      : 'The ledger remains shrouded until the manifestation ends.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="font-cinzel text-[10px] tracking-widest text-gold uppercase">Manifestation End (Seal Breaking)</label>
                  <input 
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-void/50 border border-white/5 rounded-lg px-4 py-3 text-sm focus:border-gold/30 outline-none text-ash"
                    required
                  />
                </div>
              </div>

              {/* Voting Mode */}
              <div className="space-y-4">
                <label className="font-cinzel text-[10px] tracking-widest text-gold uppercase">Voting Mode</label>
                <div className="flex gap-3">
                  {(['NORMAL', 'RANKED'] as const).map(m => (
                    <button
                      key={m} type="button"
                      onClick={() => setVotingMode(m)}
                      className={`flex-1 py-3 font-cinzel text-[10px] tracking-widest uppercase rounded border transition-all ${
                        votingMode === m ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-ash/50 hover:border-white/20'
                      }`}
                    >
                      {m === 'NORMAL' ? 'Normal' : 'Ranked'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <label className="font-cinzel text-[10px] tracking-widest text-gold uppercase">Candidates / Paths</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-ash/40 uppercase font-mono">Count:</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="50"
                      value={pathCount}
                      onChange={(e) => handlePathCountChange(e.target.value)}
                      className="w-12 bg-void/50 border border-white/10 rounded px-2 py-1 text-[10px] text-gold focus:border-gold outline-none font-mono"
                    />
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleAddCandidate}
                  className="font-cinzel text-[9px] text-gold hover:text-white transition-colors uppercase tracking-widest bg-gold/5 px-3 py-1.5 border border-gold/10 rounded hover:bg-gold/10"
                >
                  + Add Path
                </button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {errors.candidates && <p className="text-[9px] text-ember uppercase tracking-widest text-center mb-4">{errors.candidates}</p>}
                {candidates.map((c, i) => (
                  <div key={i} className="space-y-2 p-4 border border-white/5 bg-void/20 rounded-xl relative group">
                    <button 
                      type="button"
                      onClick={() => setCandidates(candidates.filter((_, idx) => idx !== i))}
                      className="absolute top-2 right-2 text-[10px] text-ash/20 hover:text-ember opacity-0 group-hover:opacity-100 transition-all font-sans"
                    >
                      ✕
                    </button>
                    <input 
                      value={c.name}
                      onChange={(e) => {
                        handleCandidateChange(i, 'name', e.target.value)
                        if (errors.candidates) setErrors(prev => ({ ...prev, candidates: '' }))
                      }}
                      placeholder={`Candidate ${i + 1} Name`}
                      className="w-full bg-transparent text-sm border-b border-white/5 py-1 focus:border-gold/30 outline-none"
                    />
                    <input 
                      value={c.manifesto}
                      onChange={(e) => handleCandidateChange(i, 'manifesto', e.target.value)}
                      placeholder="Manifesto (Optional)"
                      className="w-full bg-transparent text-[11px] text-ash py-1 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2.5: Participation Filter (Mystical Whitelisting) */}
          <div className="pt-8 border-t border-white/5 space-y-6">
             <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-cinzel text-xs tracking-widest text-white uppercase">Sovereign Whitelist</h4>
                  <p className="text-[9px] text-ash/60 uppercase tracking-tighter mt-1">If active, only recognized souls can participate.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWhitelistedOnly(!isWhitelistedOnly)}
                  className={`px-4 py-2 border rounded font-cinzel text-[10px] tracking-widest uppercase transition-all ${
                    isWhitelistedOnly ? 'bg-gold/20 border-gold text-gold shadow-[0_0_15px_rgba(255,179,0,0.2)]' : 'border-white/10 text-ash'
                  }`}
                >
                  {isWhitelistedOnly ? 'Active' : 'Open Ritual'}
                </button>
             </div>

             <AnimatePresence>
               {isWhitelistedOnly && (
                 <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                 >
                   <div className="space-y-2">
                      <label className="font-cinzel text-[9px] tracking-widest text-ash uppercase">Authorized Voter Emails (One per line)</label>
                      <textarea
                        value={whitelistedEmailsText}
                        onChange={(e) => setWhitelistedEmailsText(e.target.value)}
                        className="w-full bg-void/50 border border-gold/10 rounded-lg px-4 py-3 text-sm focus:border-gold/30 outline-none h-32 resize-none font-mono text-ash"
                        placeholder="voter-1@chain.local&#10;voter-2@chain.local"
                      />
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* Section 3: Final Ritual */}
          <div className="pt-12 border-t border-white/10">
            <h3 className="font-cinzel text-[11px] tracking-[0.4em] text-center text-white uppercase mb-8">Verification Ritual</h3>
            
            <div className="max-w-md mx-auto space-y-8">
              {!otpSent ? (
                <div className="text-center">
                   <p className="text-ash text-[11px] mb-6 uppercase tracking-wider opacity-60">You must authorize this publication via Email OTP</p>
                   <button
                    type="button"
                    onClick={() => otpMutation.mutate()}
                    disabled={otpMutation.isPending}
                    className="w-full py-4 border border-gold/40 text-gold font-cinzel text-xs tracking-[0.4em] uppercase hover:bg-gold/10 transition-all rounded shadow-[0_0_15px_rgba(255,179,0,0.1)]"
                   >
                     {otpMutation.isPending ? 'Summoning OTP...' : 'Request Action OTP'}
                   </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* OTP Countdown */}
                  {otpTimer.secondsLeft !== null && !otpTimer.isExpired && (
                    <div className="flex items-center justify-center gap-2">
                      <div className={`font-mono text-sm tabular-nums ${
                        otpTimer.secondsLeft < 60 ? 'text-ember' : 'text-chaingreen'
                      }`}>
                        {otpTimer.formatted}
                      </div>
                      <div className="font-cinzel text-[9px] text-ash/50 uppercase tracking-widest">remaining</div>
                    </div>
                  )}

                  {/* OTP Expired */}
                  {otpTimer.isExpired && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-ember/10 border border-ember/30 rounded-lg px-4 py-3 text-center space-y-2"
                    >
                      <p className="font-cinzel text-ember text-[11px] tracking-widest uppercase">10 Minutes Passed — OTP Invalid</p>
                      <p className="font-sans text-ash/60 text-[10px]">Your ritual seal has expired.</p>
                      <button
                        type="button"
                        onClick={otpTimer.handleResend}
                        disabled={otpTimer.isResending}
                        className="w-full py-2 border border-gold/40 text-gold font-cinzel text-[10px] tracking-widest uppercase rounded hover:bg-gold/10 transition-all disabled:opacity-40"
                      >
                        {otpTimer.isResending ? 'Summoning...' : 'Click to Send New OTP'}
                      </button>
                    </motion.div>
                  )}

                    <div className="md:col-span-2">
                       <DynamicCodeDisplay />
                    </div>
                    <div className="space-y-2">
                       <label className="font-cinzel text-[9px] tracking-widest text-ash uppercase">Email OTP</label>
                       <input
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value)
                          if (errors.otp) setErrors(prev => ({ ...prev, otp: '' }))
                        }}
                        maxLength={6}
                        disabled={otpTimer.isExpired}
                        className={`w-full bg-void/50 border rounded px-4 py-3 text-center font-mono tracking-[0.5em] focus:border-gold outline-none disabled:opacity-30 ${
                          errors.otp ? 'border-ember/50 shadow-[0_0_10px_rgba(255,100,100,0.1)]' : 'border-gold/30'
                        }`}
                        placeholder="******"
                       />
                       {errors.otp && <p className="text-[8px] text-ember uppercase tracking-widest mt-1 text-center font-mono">{errors.otp}</p>}
                    </div>
                    <div className="space-y-2">
                       <label className="font-cinzel text-[9px] tracking-widest text-ash uppercase">Enter Master Code</label>
                       <input
                        value={masterCode}
                        onChange={(e) => {
                          setMasterCode(e.target.value.toUpperCase())
                          if (errors.masterCode) setErrors(prev => ({ ...prev, masterCode: '' }))
                        }}
                        maxLength={3}
                        className={`w-full bg-void/50 border rounded px-4 py-3 text-center font-mono tracking-[0.5em] focus:border-gold outline-none ${
                          errors.masterCode ? 'border-ember/50 shadow-[0_0_10px_rgba(255,100,100,0.1)]' : 'border-gold/30'
                        }`}
                        placeholder="***"
                       />
                       {errors.masterCode && <p className="text-[8px] text-ember uppercase tracking-widest mt-1 text-center font-mono">{errors.masterCode}</p>}
                    </div>

                  <div className="text-center">
                    {otpSent && !otpTimer.isExpired && (
                      <div className="font-cinzel text-[10px] tracking-[0.2em] text-chaingreen uppercase mb-4">
                        Ritual Manifested! Check your email.
                      </div>
                    )}
                    {previewUrl && (
                      <div className="group border-t border-white/5 pt-4 mt-2">
                         <p className="text-[9px] text-ash/40 uppercase tracking-widest mb-1 italic text-center">Courier Delayed? Not received?</p>
                         <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-gold/60 hover:text-gold font-cinzel tracking-[0.2em] uppercase transition-colors"
                        >
                          Check Ritual Log
                        </a>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={publishMutation.isPending || otpTimer.isExpired}
                    className="w-full py-5 bg-gold text-void font-cinzel text-sm tracking-[0.5em] uppercase hover:brightness-110 transition-all rounded shadow-[0_0_30px_rgba(255,179,0,0.3)] disabled:opacity-50"
                  >
                    {publishMutation.isPending ? 'Binding to Chain...' : 'Publish Election'}
                  </button>
                </div>
              )}

              {error && <p className="text-ember text-[10px] text-center uppercase tracking-widest mt-4 font-mono">{error}</p>}
            </div>
          </div>
        </form>
      </motion.div>

      <Overlay 
        isOpen={overlay.isOpen}
        onClose={() => setOverlay(prev => ({ ...prev, isOpen: false }))}
        title={overlay.title}
        message={overlay.message}
        confirmText="Acknowledge"
      />
    </div>
  )
}
