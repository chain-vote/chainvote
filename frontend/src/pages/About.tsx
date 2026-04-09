import { motion } from 'framer-motion'
import { BackButton } from '../components/ui/BackButton'

export function About() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex justify-center">
      <BackButton fallback="/" />
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full"
      >
        <h2 className="font-cinzel text-5xl tracking-widest text-gold mb-12 uppercase drop-shadow-sm">The Ritual of Truth</h2>
        
        <div className="space-y-12 text-ash/80 font-sans tracking-wide leading-relaxed">
          <section className="space-y-4">
            <h3 className="font-cinzel text-white text-lg tracking-widest uppercase">Overview</h3>
            <p>
              ChainVote is a next-generation electoral system built on the bedrock of cryptographic transparency. 
              Inspired by the sacred permanence of the block-chain, every vote cast in our system is not merely a number, 
              but a unique, hash-chained transaction that binds the past and future of the ballot into an immutable structure.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="font-cinzel text-white text-lg tracking-widest uppercase">The Merkle Root</h3>
            <p>
              We utilize Merkle Trees (specifically the 3D Yggdrasil visualization) to prove the integrity of the voting pool. 
              By hashing all votes together into a single "Root," we can verify a pool of thousands of votes in milliseconds. 
              Any attempt to tamper with a single ballot—even a single character—will propagate a cascade of broken hashes, 
              severing the tree and alerting the network of a breach.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="font-cinzel text-white text-lg tracking-widest uppercase">Dual-Layer Sovereignty</h3>
            <p>
              Security is handled through a dual-challenge architecture. While your identity is secured by persistent 
              encryption (Email/Password), every critical action—be it casting a vote or publishing an election—is 
              challenged by a volatile Oxygen OTP. For administrators, an additional Master Code ritual ensures 
              that the power to create reality is never left to chance.
            </p>
          </section>

          <footer className="pt-12 border-t border-white/5 flex flex-col items-center gap-4 opacity-50">
             <div className="font-cinzel text-[10px] tracking-[0.5em] uppercase">Built for the masters of the mystic arts</div>
             <div className="font-mono text-[9px] uppercase tracking-tighter">Verified by Hash: 0xf3a...92b</div>
          </footer>
        </div>
      </motion.div>
    </div>
  )
}
