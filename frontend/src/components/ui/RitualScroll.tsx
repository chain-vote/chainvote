import { motion, AnimatePresence } from 'framer-motion'
import { ritualChime } from '../layout/TerminalAtmosphere'
import { VoterSigil } from './VoterSigil'

export type ScrollType = 'PASSPORT' | 'CERTIFICATE'

interface ScrollData {
  voterHash: string
  electionTitle?: string
  voteHash?: string
  prevHash?: string
  merkleRoot?: string
  position?: number
  timestamp?: string
  electionCount?: number
  sigilLevel?: number
}

export function RitualScroll({
  isOpen,
  onClose,
  type,
  data
}: {
  isOpen: boolean
  onClose: () => void
  type: ScrollType
  data: ScrollData
}) {
  const handleCapture = () => {
    ritualChime('success')
    const fileName = type === 'PASSPORT' ? 'voter_passport_scroll.txt' : `ritual_certificate_${data.voteHash?.slice(0, 8)}.txt`
    
    let content = ''
    if (type === 'PASSPORT') {
      content = `
📜 CHAINVOTE: VOTER PASSPORT SCROLL
===================================
IDENTITY HASH: ${data.voterHash}
RITUALS COMPLETED: ${data.electionCount || 0}
SIGIL RANK: ${data.sigilLevel || 1}
STATUS: VERIFIED ON-CHAIN
TIMESTAMP: ${new Date().toLocaleString()}

This scroll is a cryptographically signed proof of your participation in the ChainVote network.
Keep your identity hash safe; it is your unique tether to the chain.
`
    } else {
      content = `
🕯️ CHAINVOTE: RITUAL CERTIFICATE
================================
ELECTION: ${data.electionTitle || 'Unknown Ritual'}
VOTER HASH: ${data.voterHash}
TRANS. HASH: ${data.voteHash}
PREV. HASH: ${data.prevHash}
MERKLE ROOT: ${data.merkleRoot}
POSITION: #${data.position}
TIME: ${data.timestamp || new Date().toLocaleString()}

VERDICT: BALLOT SEALED & INTEGRITY VERIFIED
===========================================
This certificate provides immutable proof that your vote was successfully chained into the Merkle tree.
You may use the transaction hash above to audit your vote in the Audit Explorer.
`
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-void/90 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-void border border-gold/30 rounded-lg p-10 overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.1)]"
          >
            {/* Background Texture/Ancient Effect */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

            {/* Content */}
            <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-6">
                   <VoterSigil hash={data.voterHash} size={100} />
                   <div className="space-y-2">
                     <h2 className="font-cinzel text-3xl text-gold tracking-widest uppercase">
                        {type === 'PASSPORT' ? 'Voter Passport' : 'Ritual Certificate'}
                     </h2>
                     <p className="font-cinzel text-[10px] tracking-[0.4em] text-ash uppercase">
                        Cryptographic Evidence Artifact
                     </p>
                   </div>
                </div>
                <button 
                  onClick={onClose}
                  className="text-ash hover:text-white transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="border-t border-b border-white/5 py-8 space-y-6">
                <ScrollField label="Identity Tether (Voter Hash)" value={data.voterHash} />
                
                {type === 'PASSPORT' ? (
                  <div className="grid grid-cols-2 gap-8">
                    <ScrollField label="Rituals Completed" value={String(data.electionCount || 0)} />
                    <ScrollField label="Sigil Rank" value={String(data.sigilLevel || 1)} />
                  </div>
                ) : (
                  <>
                    <ScrollField label="Ritual Name (Election)" value={data.electionTitle || 'Unknown'} isCinzel />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <ScrollField label="Transaction Hash" value={data.voteHash || 'PENDING...'} />
                       <ScrollField label="Merkle Root Snapshot" value={data.merkleRoot || 'PENDING...'} />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <ScrollField label="Position in Chain" value={`#${data.position || '?'}`} />
                       <ScrollField label="Manifested At" value={data.timestamp || new Date().toLocaleString()} />
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                 <button
                    onClick={handleCapture}
                    className="flex-1 bg-gold/10 border border-gold/40 text-gold font-cinzel text-xs tracking-[0.4em] uppercase py-4 rounded hover:bg-gold hover:text-void transition-all shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                 >
                    Capture Scroll (.txt)
                 </button>
                 <button
                    onClick={() => { ritualChime('click'); window.print(); }}
                    className="flex-1 bg-white/5 border border-white/10 text-white/60 font-cinzel text-xs tracking-[0.4em] uppercase py-4 rounded hover:bg-white/10 hover:text-white transition-all"
                 >
                    Print Manifest
                 </button>
              </div>
              
              <p className="text-center font-cinzel text-[9px] text-ash/30 tracking-[0.2em] uppercase pt-4">
                Verify this artifact at chainvote.io/audit
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function ScrollField({ label, value, isCinzel = false }: { label: string; value: string; isCinzel?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="font-cinzel text-[9px] text-gold/60 tracking-widest uppercase">{label}</p>
      <p className={`text-sm break-all ${isCinzel ? 'font-cinzel text-white text-lg tracking-wide' : 'font-mono text-chaingreen'}`}>
        {value}
      </p>
    </div>
  )
}
