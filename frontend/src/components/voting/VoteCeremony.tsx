import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { HashReveal } from './HashReveal'
import { useAuthStore } from '../../store/authStore'
import { Overlay } from '../ui/Overlay'
import { ritualChime } from '../layout/TerminalAtmosphere'
import { useOtpTimer } from '../../hooks/useOtpTimer'
import { RitualScroll } from '../ui/RitualScroll'
import { useQueryClient } from '@tanstack/react-query'
import { VoterSigil } from '../ui/VoterSigil'

type Stage = 'idle' | 'otp_sent' | 'shrouded_proof' | 'computing' | 'chaining' | 'sealing' | 'confirmed'

export function VoteCeremony({
  candidateId,
  electionId,
  candidateName,
}: {
  candidateId: string
  electionId: string
  candidateName: string
}) {
  const [stage, setStage] = useState<Stage>('idle')
  const [otp, setOtp] = useState('')
  const [zkpProof, setZkpProof] = useState<string | null>(null)
  const [isScrollOpen, setIsScrollOpen] = useState(false)
  const [result, setResult] = useState<{
    voteHash: string
    prevHash: string
    merkleRoot: string
    position: number
  } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sealingDots, setSealingDots] = useState(0)
  const [overlay, setOverlay] = useState<{
    isOpen: boolean
    title: string
    message: string
  }>({
    isOpen: false,
    title: '',
    message: ''
  })

  const user = useAuthStore((s) => s.user)
  const voterHash = user?.voterHash
  const queryClient = useQueryClient()

  // Animate sealing dots
  useEffect(() => {
    if (stage === 'sealing') {
      const id = setInterval(() => setSealingDots(d => (d + 1) % 4), 400)
      return () => clearInterval(id)
    }
  }, [stage])

  const otpMutation = useMutation({
    mutationFn: () => api.requestActionOtp(),
    onSuccess: (data) => {
      setPreviewUrl(data.previewUrl ?? null)
      setStage('otp_sent')
      otpTimer.start()
    },
    onError: (err: any) => {
      setOverlay({
        isOpen: true,
        title: 'Summoning Failed',
        message: err.message || 'The OTP courier failed to manifest. Ritual aborted.'
      })
    }
  })

  const otpTimer = useOtpTimer(async () => {
    const data = await api.requestActionOtp()
    setPreviewUrl(data.previewUrl ?? null)
  })

  const castMutation = useMutation({
    mutationFn: () => api.castVote({ electionId, candidateId, otp }),
    onSuccess: (data) => {
      setResult(data)
      setStage('confirmed')
      ritualChime('success')
      queryClient.invalidateQueries({ queryKey: ['passport'] })
    },
    onError: (err: any) => {
      setOverlay({
        isOpen: true,
        title: 'Sealing Denied',
        message: err.message || 'The chain rejected the ballot. Seal ritual failed.'
      })
      setStage('otp_sent')
    }
  })

  const handleCast = async () => {
    setStage('shrouded_proof')
    ritualChime('crystal')
    await new Promise((r) => setTimeout(r, 1200))
    const proof = Math.random().toString(36).substring(2, 10).toUpperCase()
    setZkpProof(proof)
    setStage('computing')
    ritualChime('click')
    await new Promise((r) => setTimeout(r, 800))
    setStage('chaining')
    ritualChime('click')
    await new Promise((r) => setTimeout(r, 700))
    setStage('sealing')
    castMutation.mutate()
  }

  return (
    <div className="flex flex-col items-center gap-8 p-4 sm:p-8 w-full max-w-[100vw] overflow-hidden">
      <AnimatePresence mode="wait">
        {stage === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 text-center max-w-2xl"
          >
            {/* Voter Sigil Identity */}
            {voterHash && (
              <div className="flex flex-col items-center gap-2">
                <VoterSigil hash={voterHash} size={80} />
                <p className="font-mono text-[8px] text-ash/30 tracking-widest uppercase">Identity Verified</p>
              </div>
            )}

            <h1 className="text-3xl font-cinzel text-gold uppercase tracking-widest">Cast Your Vote</h1>
            <p className="text-ash text-[10px] font-cinzel tracking-widest uppercase">You are voting for</p>
            <p className="text-3xl font-cinzel text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{candidateName}</p>
            <p className="text-[11px] text-ash max-w-sm leading-relaxed font-sans opacity-60">
              Your vote will be cryptographically chained to the ballot. It cannot be altered, deleted, or duplicated.
              Authorization via OTP is required.
            </p>

            <button
              onClick={() => otpMutation.mutate()}
              disabled={otpMutation.isPending}
              className="mt-2 px-10 py-5 bg-gold/10 border border-gold/40 text-gold font-cinzel text-xs tracking-[0.4em] uppercase rounded
                         hover:bg-gold hover:text-void transition-all duration-300 shadow-[0_0_40px_rgba(255,179,0,0.1)] w-full sm:w-auto"
            >
              {otpMutation.isPending ? 'Summoning OTP...' : 'Request Action OTP'}
            </button>
          </motion.div>
        )}

        {stage === 'otp_sent' && (
          <motion.div
            key="otp_sent"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <h1 className="text-2xl font-cinzel text-white tracking-widest uppercase">Verify Authorization</h1>

            {/* OTP Countdown Timer */}
            <AnimatePresence>
              {otpTimer.secondsLeft !== null && !otpTimer.isExpired && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className={`font-mono text-sm tabular-nums ${
                    otpTimer.secondsLeft < 60 ? 'text-ember' : 'text-chaingreen'
                  }`}>
                    {otpTimer.formatted}
                  </div>
                  <div className="font-cinzel text-[9px] text-ash/50 uppercase tracking-widest">remaining</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* OTP Expired Notice */}
            {otpTimer.isExpired && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-ember/10 border border-ember/30 rounded-lg px-6 py-4 text-center space-y-3 max-w-xs"
              >
                <p className="font-cinzel text-ember text-[11px] tracking-widest uppercase">
                  10 Minutes Have Passed — OTP Invalid
                </p>
                <p className="font-sans text-ash/60 text-[10px]">Your ritual seal has expired. A new OTP must be summoned.</p>
                <button
                  onClick={otpTimer.handleResend}
                  disabled={otpTimer.isResending}
                  className="w-full py-2 border border-gold/40 text-gold font-cinzel text-[10px] tracking-widest uppercase rounded hover:bg-gold/10 transition-all disabled:opacity-40"
                >
                  {otpTimer.isResending ? 'Summoning...' : 'Click to Send New OTP'}
                </button>
              </motion.div>
            )}

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              disabled={otpTimer.isExpired}
              className="w-48 bg-void/50 border border-gold/30 rounded px-4 py-3 text-center font-mono text-xl tracking-[0.6em] text-white focus:border-gold outline-none disabled:opacity-30"
              placeholder="******"
            />

            {!otpTimer.isExpired && (
              <div className="font-cinzel text-[10px] tracking-[0.2em] text-chaingreen uppercase mb-2">
                Ritual Manifested! Check your email.
              </div>
            )}

            {previewUrl && (
              <div className="mt-2 group">
                <p className="text-[9px] text-ash/40 uppercase tracking-widest mb-1 italic">Courier Delayed? Not received?</p>
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

            <button
              onClick={handleCast}
              disabled={otp.length !== 6 || castMutation.isPending || otpTimer.isExpired}
              className="mt-4 px-12 py-4 bg-ember text-white font-cinzel text-xs tracking-[0.4em] uppercase rounded
                         hover:brightness-110 transition-all duration-300 shadow-[0_0_40px_rgba(255,69,0,0.3)] disabled:opacity-30"
            >
              {castMutation.isPending ? 'Verifying...' : 'Finalize Seal'}
            </button>
          </motion.div>
        )}

        {stage === 'shrouded_proof' && (
          <motion.div
            key="shrouded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative">
              <div className="w-24 h-24 border-2 border-gold/40 rounded-full animate-ping absolute inset-0" />
              <div className="w-24 h-24 border border-gold rounded-full flex items-center justify-center bg-void/50 backdrop-blur-md">
                <div className="text-gold animate-pulse text-2xl font-cinzel">Ψ</div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-cinzel text-white tracking-[0.3em] uppercase">Shrouding Ritual</h3>
              <p className="font-cinzel text-[9px] text-ash uppercase tracking-widest opacity-60">Zero-Knowledge Eligibility Proof In Progress...</p>
            </div>
            {zkpProof && <div className="font-mono text-[9px] text-gold/40 uppercase tracking-tighter">Proof Manifest: {zkpProof}</div>}
          </motion.div>
        )}

        {stage === 'computing' && (
          <motion.div
            key="computing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            {voterHash && <VoterSigil hash={voterHash} size={56} className="opacity-70 animate-pulse" />}
            <p className="text-ash text-[10px] tracking-widest uppercase font-sans">Computing voter hash</p>
            <HashReveal label="SHA-256(identity || salt || epoch)" value={voterHash ?? undefined} animating />
          </motion.div>
        )}

        {stage === 'chaining' && (
          <motion.div
            key="chaining"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            <p className="text-ash text-[10px] tracking-widest uppercase font-sans">Forging chain link</p>
            <HashReveal
              label="SHA-256(voterHash || candidateId || timestamp || prevHash)"
              animating
              durationMs={900}
            />
            <div className="flex items-center gap-2 text-gold text-[10px] font-cinzel tracking-widest uppercase">
              <div className="w-24 h-[1px] bg-gold/20" />
              <span>Linking to Pool</span>
              <div className="w-24 h-[1px] bg-gold/20" />
            </div>
          </motion.div>
        )}

        {stage === 'sealing' && (
          <motion.div
            key="sealing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8 w-full"
          >
            {/* 3D Merkle Sealing Visualization */}
            <div className="relative w-full max-w-sm h-48 flex items-center justify-center">
              {/* Root Node */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10">
                <div className="w-12 h-12 rounded-full border-2 border-gold shadow-[0_0_20px_rgba(212,175,55,0.5)] bg-gold/20 flex items-center justify-center">
                  <span className="font-mono text-[8px] text-gold">ROOT</span>
                </div>
              </div>

              {/* Branch Lines L1 */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 192">
                <line x1="200" y1="40" x2="120" y2="100" stroke="rgba(212,175,55,0.3)" strokeWidth="1" strokeDasharray="4 4">
                  <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.5s" repeatCount="indefinite" />
                </line>
                <line x1="200" y1="40" x2="280" y2="100" stroke="rgba(212,175,55,0.3)" strokeWidth="1" strokeDasharray="4 4">
                  <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.5s" repeatCount="indefinite" />
                </line>
                {/* Leaf lines */}
                <line x1="120" y1="100" x2="80" y2="155" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <line x1="120" y1="100" x2="160" y2="155" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <line x1="280" y1="100" x2="240" y2="155" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                {/* Animated YOUR NODE */}
                <line x1="280" y1="100" x2="320" y2="155" stroke="rgba(255,69,0,0.6)" strokeWidth="1.5" strokeDasharray="4 2">
                  <animate attributeName="stroke-dashoffset" from="50" to="0" dur="0.8s" repeatCount="indefinite" />
                </line>
              </svg>

              {/* L1 Nodes */}
              <div className="absolute" style={{ top: '90px', left: '95px' }}>
                <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
                  <span className="font-mono text-[6px] text-ash/60">N1</span>
                </div>
              </div>
              <div className="absolute" style={{ top: '90px', right: '95px' }}>
                <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
                  <span className="font-mono text-[6px] text-ash/60">N2</span>
                </div>
              </div>

              {/* Leaf Nodes */}
              {[{l:'55px'},{l:'135px'},{l:'215px'}].map((pos, i) => (
                <div key={i} className="absolute" style={{ top: '148px', left: pos.l }}>
                  <div className="w-6 h-6 rounded-full border border-white/10 bg-void flex items-center justify-center">
                    <span className="font-mono text-[5px] text-ash/40">L{i+1}</span>
                  </div>
                </div>
              ))}

              {/* YOUR LEAF - animated */}
              <motion.div
                className="absolute"
                style={{ top: '148px', right: '55px' }}
                animate={{ boxShadow: ['0 0 8px rgba(255,69,0,0.3)', '0 0 20px rgba(255,69,0,0.8)', '0 0 8px rgba(255,69,0,0.3)'] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="w-8 h-8 rounded-full border-2 border-ember bg-ember/20 flex items-center justify-center">
                  <span className="font-mono text-[6px] text-ember">YOU</span>
                </div>
              </motion.div>
            </div>

            <div className="text-gold text-[10px] tracking-widest uppercase font-cinzel animate-pulse">
              Sealing into Merkle tree{'.'.repeat(sealingDots)}
            </div>
          </motion.div>
        )}

        {stage === 'confirmed' && result && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 w-full max-w-2xl"
          >
            <div className="text-5xl text-gold drop-shadow-[0_0_20px_rgba(255,179,0,0.4)]">✓</div>
            <h2 className="text-2xl font-cinzel text-white tracking-[0.2em] uppercase">Vote Sealed</h2>
            <div className="w-full space-y-3 px-2 sm:px-0">
              <CryptoField label="Your Transaction Hash" value={result.voteHash} />
              <CryptoField label="Previous Link" value={result.prevHash} />
              <CryptoField label="Current Merkle Root" value={result.merkleRoot} />
              <div className="text-center font-cinzel text-[10px] tracking-widest text-ash/40 mt-4 uppercase">Chain Position: #{result.position}</div>
            </div>
            
            <p className="text-[11px] text-ash/60 text-center font-sans tracking-wide leading-relaxed">
              Your hash is your receipt. It allows you to audit the integrity
              of this election at any time without compromising your anonymity.
            </p>

            <button
               onClick={() => setIsScrollOpen(true)}
               className="mt-6 px-10 py-4 bg-gold/10 border border-gold/40 text-gold font-cinzel text-xs tracking-[0.4em] uppercase rounded hover:bg-gold hover:text-void transition-all shadow-[0_0_30px_rgba(212,175,55,0.1)]"
            >
              Capture Ritual Scroll
            </button>

            <RitualScroll 
               isOpen={isScrollOpen}
               onClose={() => setIsScrollOpen(false)}
               type="CERTIFICATE"
               data={{
                 voterHash: voterHash || '???',
                 electionTitle: candidateName,
                 voteHash: result.voteHash,
                 prevHash: result.prevHash,
                 merkleRoot: result.merkleRoot,
                 position: result.position,
                 timestamp: new Date().toLocaleString()
               }}
            />
          </motion.div>
        )}
      </AnimatePresence>

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

function CryptoField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="w-full bg-white/5 border border-white/10 rounded p-3 space-y-1">
      <p className="text-ash text-xs tracking-widest uppercase font-sans">{label}</p>
      <p className={`text-chaingreen text-xs break-all leading-relaxed ${mono ? 'font-mono' : 'font-cinzel'}`}>
        {value}
      </p>
    </div>
  )
}
