import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'

export function Navigation() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  
  const user = useAuthStore((s) => s.user)
  const clear = useAuthStore((s) => s.clear)

  const handleLogout = () => {
    clear()
    setOpen(false)
    navigate('/')
  }

  const links = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
  ]

  if (user?.role === 'VOTER') {
    links.push({ name: 'Active Ballots', path: '/voter/dashboard' })
    links.push({ name: 'Audit Explorer', path: '/audit' })
  }

  if (user?.role === 'ADMIN') {
    links.push({ name: 'EC Command Center', path: '/admin/dashboard' })
    links.push({ name: 'Create Election', path: '/admin/create' })
    links.push({ name: 'Audit Explorer', path: '/audit' })
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-void/50 backdrop-blur-sm z-50 flex items-center justify-between px-6 transition-all border-b border-white/5">
        <Link to="/" className="font-cinzel text-xl tracking-widest text-white hover:text-gold transition drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
          CHAINVOTE
        </Link>
        <button 
          onClick={() => setOpen(!open)}
          className="group w-10 h-10 flex flex-col items-center justify-center gap-1.5 focus:outline-none z-[60]"
        >
          <span className={`block w-6 h-[1px] bg-white transition-all duration-500 ${open ? 'rotate-45 translate-y-[7.5px]' : 'group-hover:w-8'}`} />
          <span className={`block w-4 h-[1px] bg-white transition-all duration-500 ${open ? 'opacity-0' : 'group-hover:w-8'}`} />
          <span className={`block w-6 h-[1px] bg-white transition-all duration-500 ${open ? '-rotate-45 -translate-y-[7.5px]' : 'group-hover:w-8'}`} />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void/98 backdrop-blur-2xl z-40 flex flex-col items-center justify-center"
          >
            <div className="flex flex-col items-center gap-10">
              {links.map((link) => {
                const active = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setOpen(false)}
                    className={`font-cinzel tracking-[0.4em] text-lg uppercase transition-all duration-300 ${
                      active ? 'text-gold drop-shadow-[0_0_20px_rgba(255,179,0,0.8)] scale-110' : 'text-ash hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              })}
              
              {user ? (
                <button 
                  onClick={handleLogout}
                  className="mt-12 group flex flex-col items-center gap-2"
                >
                  <span className="font-cinzel text-[10px] tracking-[0.5em] uppercase text-ember/70 group-hover:text-ember transition-colors">
                    Logout
                  </span>
                  <span className="text-[9px] font-mono text-ash/50 group-hover:text-ash/80 transition-colors uppercase">
                    ID: {user.email}
                  </span>
                </button>
              ) : (
                <Link
                  to="/identity"
                  onClick={() => setOpen(false)}
                  className="mt-12 font-cinzel text-[10px] tracking-[0.5em] uppercase text-gold/70 hover:text-gold transition-colors"
                >
                  Select Identity
                </Link>
              )}
            </div>

            {/* Background Aesthetic Sigil in Menu */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden flex items-center justify-center">
               <svg viewBox="0 0 200 200" className="w-[120%] h-[120%] animate-spin-very-slow">
                 <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="0.2" />
                 <rect x="50" y="50" width="100" height="100" fill="none" stroke="white" strokeWidth="0.2" transform="rotate(45 100 100)" />
                 <path d="M100 0 L200 100 L100 200 L0 100 Z" fill="none" stroke="white" strokeWidth="0.2" />
               </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
