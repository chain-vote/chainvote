import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

export function CandidateCard({
  name,
  manifesto,
  selected,
  onSelect,
}: {
  name: string
  manifesto?: string | null
  selected: boolean
  onSelect: () => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-xl border p-6 transition-all',
        'bg-white/5 border-white/10 hover:border-white/25',
        selected && 'border-ember/70 bg-ember/10 shadow-ember',
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-cinzel text-xl text-gold">{name}</h3>
        <span className={cn('text-[10px] tracking-widest uppercase', selected ? 'text-ember' : 'text-ash')}>
          {selected ? 'Selected' : 'Candidate'}
        </span>
      </div>
      {manifesto ? (
        <p className="mt-3 text-sm text-ash leading-relaxed font-sans">{manifesto}</p>
      ) : (
        <p className="mt-3 text-sm text-ash leading-relaxed font-sans">No manifesto recorded.</p>
      )}
    </motion.button>
  )
}

