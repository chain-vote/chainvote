import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api'
import { VoterSigil } from '../components/ui/VoterSigil'
import { BackButton } from '../components/ui/BackButton'

/**
 * VerifyReceipt: Public, no-auth page where anyone can paste a voteHash
 * to independently verify its existence and Merkle integrity.
 * Feature #2.
 */
export function VerifyReceipt() {
  const [hash, setHash] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleVerify = async () => {
    if (!hash.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await api.verifyReceipt(hash.trim())
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Verification ritual failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-2xl mx-auto">
      <BackButton fallback="/identity" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-12">
          <h1 className="font-cinzel text-4xl tracking-widest text-white uppercase mb-3">Vote Verifier</h1>
          <p className="font-cinzel text-[10px] tracking-[0.3em] text-ash uppercase">
            Independent Chain Integrity Check — No Account Required
          </p>
        </div>

        <div className="bg-void/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="space-y-2">
            <label className="font-cinzel text-[9px] tracking-widest text-ash uppercase">Your Vote Hash (Transaction Receipt)</label>
            <input
              value={hash}
              onChange={e => setHash(e.target.value)}
              placeholder="SHA-256 hash from your ballot receipt..."
              className="w-full bg-void/50 border border-white/5 rounded-lg px-4 py-3 text-xs font-mono focus:border-gold/30 outline-none placeholder:text-ash/20"
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || !hash.trim()}
            className="w-full py-4 border border-gold/40 text-gold font-cinzel text-xs tracking-[0.4em] uppercase hover:bg-gold/10 transition-all rounded disabled:opacity-40"
          >
            {loading ? 'Consulting the Chain...' : 'Verify Seal'}
          </button>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-ember text-[11px] font-mono text-center">
              {error}
            </motion.div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-6 space-y-4 ${
                  result.chainIntact ? 'border-chaingreen/30 bg-chaingreen/5' : 'border-ember/30 bg-ember/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`font-cinzel text-xl tracking-widest uppercase ${result.chainIntact ? 'text-chaingreen' : 'text-ember'}`}>
                    {result.chainIntact ? '✓ Chain Intact' : '✗ Integrity Breach'}
                  </div>
                  <VoterSigil hash={result.voteHash} size={48} />
                </div>

                <div className="space-y-3 text-[11px]">
                  <VerifyRow label="Election" value={result.electionTitle} />
                  <VerifyRow label="Chain Position" value={`#${result.position}`} />
                  <VerifyRow label="Merkle Root" value={result.merkleRoot?.slice(0, 32) + '...'} mono />
                  <VerifyRow label="Early Vote" value={result.isEarlyVote ? 'Yes (first 25% window)' : 'No'} />
                </div>

                <p className={`font-sans text-[10px] text-center pt-2 ${result.chainIntact ? 'text-chaingreen/60' : 'text-ember/60'}`}>
                  {result.chainIntact
                    ? 'This vote is cryptographically sealed and unaltered in the chain.'
                    : 'Warning: Chain integrity breach detected. This node may have been tampered with.'
                  }
                </p>

                {result.chainIntact && (
                  <button
                    onClick={() => handleDownloadCertificate(result)}
                    className="w-full mt-4 py-3 border border-chaingreen/30 text-chaingreen font-cinzel text-[10px] tracking-[0.3em] uppercase hover:bg-chaingreen/10 transition-all rounded"
                  >
                    Manifest Cryptographic Certificate
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

function VerifyRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-ash/60 font-cinzel uppercase tracking-widest shrink-0">{label}</span>
      <span className={`text-white break-all text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function handleDownloadCertificate(result: any) {
  const hash = result.voteHash || ''
  const seed = hash.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
  const getVal = (idx: number, mod: number) => {
    const charCode = hash.charCodeAt(idx % hash.length)
    return (seed + charCode * (idx + 1)) % mod
  }
  
  const numLines = 6 + (seed % 4)
  const center = 400
  const radius = 180
  let paths = ''
  
  for (let i = 0; i < numLines; i++) {
    const angle1 = (getVal(i, 360) * Math.PI) / 180
    const angle2 = (getVal(i + 5, 360) * Math.PI) / 180
    const x1 = center + Math.cos(angle1) * radius
    const y1 = 450 + Math.sin(angle1) * radius
    const x2 = center + Math.cos(angle2) * radius
    const y2 = 450 + Math.sin(angle2) * radius
    paths += `<path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="url(#grad)" stroke-width="2" stroke-opacity="0.4"/>\n`
    paths += `<path d="M ${center - (x1 - center)} ${y1} L ${center - (x2 - center)} ${y2}" stroke="url(#grad)" stroke-width="2" stroke-opacity="0.4"/>\n`
  }

  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="800" height="1100">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${seed % 360}, 70%, 70%)" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#d4af37" stop-opacity="0.5" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#d4af37" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#050505" stop-opacity="0" />
        </radialGradient>
        <pattern id="noise" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#050505"/>
          <circle cx="2" cy="2" r="1" fill="#111"/>
        </pattern>
        <style>
          .cinzel { font-family: 'Times New Roman', serif; text-transform: uppercase; letter-spacing: 6px; }
          .mono { font-family: 'Courier New', monospace; letter-spacing: 2px; }
        </style>
      </defs>
      
      <!-- Background Void -->
      <rect width="100%" height="100%" fill="url(#noise)" />
      <rect width="100%" height="100%" fill="#050505" opacity="0.95" />
      <circle cx="400" cy="450" r="300" fill="url(#glow)" />
      
      <!-- Border -->
      <rect x="30" y="30" width="740" height="1040" fill="none" stroke="#d4af37" stroke-width="2" stroke-opacity="0.5" />
      <rect x="40" y="40" width="720" height="1020" fill="none" stroke="#d4af37" stroke-width="0.5" stroke-opacity="0.3" />
      
      <!-- Header -->
      <text x="400" y="120" fill="#d4af37" font-size="32" text-anchor="middle" class="cinzel" font-weight="bold">Certificate of Manifestation</text>
      <text x="400" y="160" fill="#aaaaaa" font-size="14" text-anchor="middle" class="cinzel" letter-spacing="10px">The Ledger Remembers</text>
      
      <line x1="200" y1="200" x2="600" y2="200" stroke="#d4af37" stroke-width="1" stroke-opacity="0.4" />
      
      <!-- Sigil Geometry -->
      <circle cx="400" cy="450" r="${40 + (seed % 30)}" fill="none" stroke="url(#grad)" stroke-width="1" stroke-opacity="0.2" />
      <circle cx="400" cy="450" r="${150 + (seed % 20)}" fill="none" stroke="url(#grad)" stroke-width="0.5" stroke-opacity="0.15" />
      <polygon points="400,320 530,450 400,580 270,450" fill="none" stroke="url(#grad)" stroke-width="2" stroke-opacity="0.6"/>
      <circle cx="400" cy="450" r="4" fill="#d4af37" />
      ${paths}
      
      <line x1="200" y1="720" x2="600" y2="720" stroke="#d4af37" stroke-width="1" stroke-opacity="0.4" />
      
      <!-- Data Blocks -->
      <text x="80" y="780" fill="#aaaaaa" font-size="12" class="cinzel text-ash">Election Ritual</text>
      <text x="720" y="780" fill="#ffffff" font-size="20" text-anchor="end" class="cinzel">${result.electionTitle}</text>
      
      <text x="80" y="850" fill="#aaaaaa" font-size="12" class="cinzel text-ash">Chain Position</text>
      <text x="720" y="850" fill="#ffffff" font-size="22" text-anchor="end" class="cinzel text-white">#${result.position}</text>

      <text x="80" y="930" fill="#aaaaaa" font-size="12" class="cinzel text-ash">Unique Voting Seal (Hash)</text>
      <text x="80" y="960" fill="#d4af37" font-size="14" class="mono">${hash.slice(0,32)}</text>
      <text x="80" y="985" fill="#d4af37" font-size="14" class="mono">${hash.slice(32)}</text>
      
      <!-- Footer -->
      <text x="400" y="1050" fill="#444444" font-size="10" text-anchor="middle" class="mono">Generated securely by ChainVote 1.0 (O(log n) Verification)</text>
    </svg>
  `

  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `certificate_${hash.slice(0, 16)}.svg`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
