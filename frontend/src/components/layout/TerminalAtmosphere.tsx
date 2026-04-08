import { useEffect, useRef, useState } from 'react'

/**
 * TerminalAtmosphere: The sensory soul of the Ancient High-Tech Node.
 * Manages Web Audio soundscapes and global visual terminal effects.
 */
export function TerminalAtmosphere() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const humNodeRef = useRef<GainNode | null>(null)
  const [isMuted, setIsMuted] = useState(true)

  // 1. Web Audio Ritual: The Void Hum
  useEffect(() => {
    let osc: OscillatorNode
    let lfo: OscillatorNode
    let lfoGain: GainNode
    
    const initAudio = () => {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new Ctx()
      audioCtxRef.current = ctx

      // 1. Master Output Gain
      const masterGain = ctx.createGain()
      masterGain.gain.value = isMuted ? 0 : 0.04
      masterGain.connect(ctx.destination)
      humNodeRef.current = masterGain

      // 2. Choral String Synth (Am9 Chord Drone)
      const frequencies = [110.00, 164.81, 261.63, 329.63, 493.88] // A2, E3, C4, E4, B4
      
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 400
      filter.Q.value = 1
      filter.connect(masterGain)

      // Slow moving LFO for the filter cutoff
      lfo = ctx.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 0.05 // Very slow breathing
      lfoGain = ctx.createGain()
      lfoGain.gain.value = 300 // Cutoff sweep range
      lfo.connect(lfoGain)
      lfoGain.connect(filter.frequency)
      lfo.start()

      frequencies.forEach(freq => {
        // Sawtooth for rich string harmonics
        const osc1 = ctx.createOscillator()
        osc1.type = 'sawtooth'
        osc1.frequency.value = freq
        
        // Sine for pure fundamental
        const osc2 = ctx.createOscillator()
        osc2.type = 'sine'
        osc2.frequency.value = freq + (freq * 0.005 * (Math.random() - 0.5)) // Slight detune

        const voiceGain = ctx.createGain()
        voiceGain.gain.value = 0.1 / frequencies.length

        osc1.connect(voiceGain)
        osc2.connect(voiceGain)
        voiceGain.connect(filter)

        osc1.start()
        osc2.start()
      })
    }

    const handleFirstClick = () => {
      if (!audioCtxRef.current) initAudio()
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume()
      }
      setIsMuted(false)
      window.removeEventListener('click', handleFirstClick)
    }

    window.addEventListener('click', handleFirstClick)
    return () => {
      window.removeEventListener('click', handleFirstClick)
      audioCtxRef.current?.close()
    }
  }, [])

  // Sync mute state
  useEffect(() => {
    if (humNodeRef.current) {
      humNodeRef.current.gain.setTargetAtTime(isMuted ? 0 : 0.04, audioCtxRef.current!.currentTime, 0.5)
    }
  }, [isMuted])

  return (
    <>
      {/* 2. Visual Ritual: Scanline & Distortion Overlay */}
      <div className="fixed inset-0 z-[999] pointer-events-none overflow-hidden opacity-20 mix-blend-screen">
        {/* Scanlines */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
            backgroundSize: '100% 4px, 3px 100%'
          }}
        />
        
        {/* Subtle Flicker / Glow */}
        <div className="absolute inset-0 w-full h-full animate-pulse opacity-10 bg-gold/5" />
      </div>

      {/* 3. Terminal Control: Audio Toggle (Hidden in UI corners) */}
      <button 
        onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted) }}
        className="fixed bottom-4 right-4 z-[1000] p-2 rounded-full border border-gold/20 bg-void/80 text-gold text-[8px] uppercase tracking-widest font-cinzel hover:bg-gold/10 transition-all opacity-40 hover:opacity-100"
      >
        {isMuted ? 'Manifest Hum' : 'Silence Void'}
      </button>

      {/* Global CSS Filters for Chromatic Aberration */}
      <style>{`
        body::after {
          content: "";
          position: fixed;
          top: 0; left: 0; bottom: 0; right: 0;
          background: rgba(18, 16, 16, 0.1);
          opacity: 0;
          z-index: 10000;
          pointer-events: none;
          animation: atmosphericFlicker 0.15s infinite;
        }

        @keyframes atmosphericFlicker {
          0% { opacity: 0.1; }
          50% { opacity: 0.2; }
          100% { opacity: 0.1; }
        }

        .hologram-glitch {
          text-shadow: 0.05em 0 0 rgba(255, 0, 0, 0.75),
                      -0.025em -0.05em 0 rgba(0, 255, 0, 0.75),
                      0.025em 0.05em 0 rgba(0, 0, 255, 0.75);
          animation: staticGlitch 500ms infinite;
        }

        @keyframes staticGlitch {
          0% { text-shadow: 0.05em 0 0 rgba(255, 0, 0, 0.75), -0.05em -0.025em 0 rgba(0, 255, 0, 0.75), 0.025em 0.05em 0 rgba(0, 0, 255, 0.75); }
          14% { text-shadow: 0.05em 0 0 rgba(255, 0, 0, 0.75), -0.05em -0.025em 0 rgba(0, 255, 0, 0.75), 0.025em 0.05em 0 rgba(0, 0, 255, 0.75); }
          15% { text-shadow: -0.05em -0.025em 0 rgba(255, 0, 0, 0.75), 0.025em 0.025em 0 rgba(0, 255, 0, 0.75), -0.05em -0.05em 0 rgba(0, 0, 255, 0.75); }
          49% { text-shadow: -0.05em -0.025em 0 rgba(255, 0, 0, 0.75), 0.025em 0.025em 0 rgba(0, 255, 0, 0.75), -0.05em -0.05em 0 rgba(0, 0, 255, 0.75); }
          50% { text-shadow: 0.025em 0.05em 0 rgba(255, 0, 0, 0.75), 0.05em 0 0 rgba(0, 255, 0, 0.75), 0 -0.05em 0 rgba(0, 0, 255, 0.75); }
          99% { text-shadow: 0.025em 0.05em 0 rgba(255, 0, 0, 0.75), 0.05em 0 0 rgba(0, 255, 0, 0.75), 0 -0.05em 0 rgba(0, 0, 255, 0.75); }
          100% { text-shadow: -0.025em 0 0 rgba(255, 0, 0, 0.75), -0.025em -0.025em 0 rgba(0, 255, 0, 0.75), -0.025em -0.05em 0 rgba(0, 0, 255, 0.75); }
        }
      `}</style>
    </>
  )
}

/**
 * Global sound trigger helper.
 * Call this for one-off interaction chimes.
 */
export const ritualChime = (type: 'success' | 'fail' | 'click' | 'crystal') => {
  const Ctx = window.AudioContext || (window as any).webkitAudioContext
  const ctx = new Ctx()
  
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  
  if (type === 'success') {
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1)
  } else if (type === 'fail') {
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(110, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(55, ctx.currentTime + 0.3)
  } else if (type === 'crystal') {
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 1)
  } else {
    osc.type = 'sine'
    osc.frequency.value = 800
  }

  gain.gain.setValueAtTime(0.05, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

  osc.connect(gain)
  gain.connect(ctx.destination)
  
  osc.start()
  osc.stop(ctx.currentTime + 0.5)
}
