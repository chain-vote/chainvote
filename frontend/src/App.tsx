import { Outlet } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { VoidBackground } from './components/layout/VoidBackground'
import { TerminalAtmosphere } from './components/layout/TerminalAtmosphere'

import { MusicToggle } from './components/ui/MusicToggle'

export function App() {
  return (
    <div className="relative min-h-screen text-white font-sans overflow-x-hidden selection:bg-ember/30">
      <VoidBackground />
      <TerminalAtmosphere />
      
      {/* Global Grain/Noise Overlay */}
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      
      <Navigation />
      
      <main className="relative z-10 w-full min-h-screen pt-20 pb-20">
        <Outlet />
      </main>

      <MusicToggle />
    </div>
  )
}
