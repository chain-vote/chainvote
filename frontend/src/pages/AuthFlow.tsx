import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Overlay } from '../components/ui/Overlay'
import { BackButton } from '../components/ui/BackButton'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebaseConfig'

export function AuthFlow() {
  const { mode } = useParams<{ mode: string }>()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [age, setAge] = useState<string>('')
  const [location, setLocation] = useState('')
  const [occupation, setOccupation] = useState('')
  const [error, setError] = useState('')
  
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [resetStep, setResetStep] = useState<'EMAIL' | 'OTP' | 'PASSWORD'>('EMAIL')
  const [resetRole, setResetRole] = useState('')
  const [resetOtp, setResetOtp] = useState('')
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetPasswordRetype, setResetPasswordRetype] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const [overlay, setOverlay] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm?: () => void
  }>({
    isOpen: false,
    title: '',
    message: ''
  })

  const isVoter = mode === 'voter'
  const isAdmin = mode === 'admin'
  const title = isAdmin ? 'High Architect' : (isVoter ? 'Citizen Voter' : 'Election Commissioner')

  const authMutation = useMutation({
    mutationFn: (data: any) => data.isOAuth ? api.oauthLogin(data) : (isLogin ? api.login(data) : api.register({ ...data, role: mode?.toUpperCase() })),
    onSuccess: (data: any) => {
      const sp = new URLSearchParams(window.location.search)
      const redirect = sp.get('redirect')

      if (data.isOAuth || isLogin) {
        setAuth(data.token, data.user)
        if (redirect) {
          navigate(decodeURIComponent(redirect), { replace: true })
        } else {
          const fallback = data.user.role === 'ADMIN' || data.user.role === 'COMMISSIONER' ? '/admin/dashboard' : '/voter/dashboard'
          navigate(fallback, { replace: true })
        }
      } else {
        if (mode === 'commissioner') {
          setOverlay({
             isOpen: true,
             title: 'Ritual Pending',
             message: 'Registration successful. Your identity must now be manifested in the physical realm by the High Architect. Please wait for verification before logging in.',
             onConfirm: () => {
                setOverlay(prev => ({ ...prev, isOpen: false }))
                setIsLogin(true)
             }
          })
        } else {
          setIsLogin(true)
          setError('Registration successful. Please login.')
        }
      }
    },
    onError: (err: any) => {
      setOverlay({
        isOpen: true,
        title: 'Authentication Rejected',
        message: err?.message || 'The chain could not verify your identity. Check your credentials and try again.'
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    authMutation.mutate({ 
      email, 
      password, 
      role: mode?.toUpperCase() as 'VOTER' | 'COMMISSIONER' | 'ADMIN',
      age: age ? parseInt(age) : undefined,
      location,
      occupation
    })
  }

  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      authMutation.mutate({ idToken, role: mode?.toUpperCase() as 'VOTER' | 'COMMISSIONER' | 'ADMIN', isOAuth: true })
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google Auth interrupted.')
      }
    }
  }

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) {
      setError('Enter your email first.')
      return
    }
    try {
      const data = await api.requestPasswordReset(email)
      if (data.success) {
        const roleName = data.role === 'ADMIN' ? 'Election Commissioner' : 'Citizen Voter'
        setResetRole(roleName)
        setPreviewUrl(data.previewUrl ?? null)
        setOverlay({
          isOpen: true,
          title: 'Identity Found',
          message: `You are registered as ${roleName}. Check your inbox for the system spell.`,
          onConfirm: () => {
             setOverlay(s => ({ ...s, isOpen: false }))
             setResetStep('OTP')
          }
        })
      } else {
        setOverlay({
          isOpen: true,
          title: 'Unknown Entity',
          message: "You weren't found in our scroll - please register as a role."
        })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request reset.')
    }
  }

  const handleVerifyOtp = async (otpValue: string) => {
    if (otpValue.length !== 6) return
    try {
      const data = await api.verifyResetOtp({ email, otp: otpValue })
      if (data.success) {
        setOverlay({
          isOpen: true,
          title: 'Spell Matched',
          message: 'The system spell has matched your essence. You may now reforge your key.',
          onConfirm: () => {
             setOverlay(s => ({ ...s, isOpen: false }))
             setResetStep('PASSWORD')
          }
        })
      } else {
        setError('The spell does not match the scroll records.')
      }
    } catch (err: any) {
      setError(err.message || 'Verification ritual failed.')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (resetNewPassword !== resetPasswordRetype) {
      setError('Passwords do not match.')
      return
    }
    try {
      await api.resetPassword({ email, otp: resetOtp, newPassword: resetNewPassword })
      setOverlay({ 
        isOpen: true, 
        title: 'Key Reforged', 
        message: 'Identity reset successfully. Login again to manifest your will.',
        onConfirm: () => {
          setOverlay(s => ({ ...s, isOpen: false }))
          setIsForgotMode(false)
          setResetStep('EMAIL')
          setResetOtp('')
          setResetNewPassword('')
          setResetPasswordRetype('')
          setPassword('')
        }
      })
    } catch (err: any) {
      setOverlay({ isOpen: true, title: 'Ritual Failed', message: err.message || 'Invalid or expired system spell.' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20">
      <BackButton fallback="/identity" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-void/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        
        <h2 className="font-cinzel text-xl tracking-widest text-center text-white mb-2 uppercase">
          {title}
        </h2>
        <p className="font-cinzel text-[10px] tracking-[0.3em] text-center text-ash uppercase mb-10">
          {isForgotMode ? 'Reforge Identity' : (isLogin ? 'Enter the Vault' : 'Create New Identity')}
        </p>

        {!isForgotMode ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="font-cinzel text-[10px] tracking-widest text-ash uppercase ml-1">Email Address</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-void/50 border border-white/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold/30 transition-colors placeholder:text-ash/20"
                placeholder="voter@chain.local"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="font-cinzel text-[10px] tracking-widest text-ash uppercase">Secret Key</label>
                {isLogin && (
                  <button type="button" onClick={() => { setIsForgotMode(true); setResetStep('EMAIL'); setError(''); }} className="text-[9px] text-gold hover:text-white uppercase tracking-widest transition-colors">Forgot Password?</button>
                )}
              </div>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-void/50 border border-white/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold/30 transition-colors placeholder:text-ash/20"
                placeholder="••••••••"
                required
              />
            </div>

            {!isLogin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-cinzel text-[10px] tracking-widest text-ash uppercase ml-1">Age</label>
                  <input 
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-void/50 border border-white/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold/30 transition-colors placeholder:text-ash/20"
                    placeholder="25"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-cinzel text-[10px] tracking-widest text-ash uppercase ml-1">Location</label>
                  <input 
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-void/50 border border-white/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold/30 transition-colors placeholder:text-ash/20"
                    placeholder="London"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="font-cinzel text-[10px] tracking-widest text-ash uppercase ml-1">Occupation</label>
                  <input 
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full bg-void/50 border border-white/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold/30 transition-colors placeholder:text-ash/20"
                    placeholder="Mage / Architect"
                    required
                  />
                </div>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-ember text-[11px] font-mono text-center tracking-tight"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={authMutation.isPending}
              className="w-full bg-white/5 border border-white/20 py-4 rounded-lg font-cinzel text-xs tracking-[0.4em] uppercase hover:bg-white/10 hover:border-gold/40 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {authMutation.isPending ? 'Verifying...' : (isLogin ? 'Login' : 'Register')}
            </button>

            <div className="relative my-6 pointer-events-none">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center"><span className="bg-void/80 px-2 font-cinzel text-[10px] tracking-widest text-ash uppercase">Or</span></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={authMutation.isPending}
              className="w-full bg-white/5 border border-white/10 py-4 rounded-lg font-cinzel text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-3 hover:bg-white/10 hover:border-white/30 transition-all active:scale-[0.98] disabled:opacity-50 text-ash hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
              Continue with Google
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {resetStep === 'EMAIL' && (
               <form onSubmit={handleRequestReset} className="space-y-6">
                 <div className="space-y-2">
                    <label className="font-cinzel text-[10px] tracking-widest text-ash uppercase ml-1">Email for Recovery</label>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-void/50 border border-white/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold/30 transition-colors"
                      placeholder="account@chain.local"
                      required
                    />
                 </div>
                 {error && <div className="text-ember text-[11px] font-mono text-center tracking-tight">{error}</div>}
                 <button
                    type="submit"
                    className="w-full bg-white/5 border border-gold/40 py-4 rounded-lg font-cinzel text-xs tracking-[0.4em] uppercase hover:bg-gold/10 transition-all text-gold"
                  >
                    Send Help
                  </button>
               </form>
            )}

            {resetStep === 'OTP' && (
               <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <p className="font-cinzel text-[9px] text-ash tracking-widest uppercase mb-4">Identity: {resetRole}</p>
                    <label className="font-cinzel text-[10px] tracking-widest text-gold uppercase">Enter System Spell</label>
                    <input 
                      value={resetOtp}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setResetOtp(val);
                        if (val.length === 6) handleVerifyOtp(val);
                      }}
                      maxLength={6}
                      className="w-full bg-void/50 border border-gold/30 rounded px-4 py-3 text-center font-mono tracking-[0.5em] focus:border-gold outline-none text-xl"
                      placeholder="******"
                      required
                    />
                    <p className="text-[9px] text-ash/40 uppercase tracking-widest pt-2">Code sent to your inbox</p>
                 </div>
                 {previewUrl && (
                    <a href={previewUrl} target="_blank" rel="noreferrer" className="block text-center text-[10px] text-gold/60 hover:text-gold uppercase tracking-widest underline decoration-gold/20">
                       Check System Terminal
                    </a>
                 )}
                 {error && <div className="text-ember text-[11px] font-mono text-center tracking-tight">{error}</div>}
                 <button
                    onClick={() => handleVerifyOtp(resetOtp)}
                    className="w-full bg-white/5 border border-white/10 py-3 rounded-lg font-cinzel text-[10px] tracking-widest uppercase hover:bg-white/10"
                  >
                    Verify Spell
                  </button>
               </div>
            )}

            {resetStep === 'PASSWORD' && (
               <form onSubmit={handleResetPassword} className="space-y-6">
                 <div className="space-y-2">
                    <label className="font-cinzel text-[10px] tracking-widest text-ash uppercase ml-1">New Identity Key</label>
                    <input 
                      type="password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="w-full bg-void/50 border border-white/5 rounded px-4 py-3 text-sm focus:border-gold/30 outline-none"
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="font-cinzel text-[10px] tracking-widest text-ash uppercase ml-1">Rewrite New Key</label>
                    <input 
                      type="password"
                      value={resetPasswordRetype}
                      onChange={(e) => setResetPasswordRetype(e.target.value)}
                      className="w-full bg-void/50 border border-white/5 rounded px-4 py-3 text-sm focus:border-gold/30 outline-none"
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                 </div>
                 {error && <div className="text-ember text-[11px] font-mono text-center tracking-tight pb-2">{error}</div>}
                 <button
                    type="submit"
                    className="w-full bg-gold text-void py-4 rounded-lg font-cinzel text-xs tracking-[0.3em] uppercase hover:brightness-110 shadow-[0_0_15px_rgba(255,179,0,0.2)] transition-all"
                  >
                    Reset Identity
                  </button>
               </form>
            )}

            <button 
              onClick={() => { setIsForgotMode(false); setResetStep('EMAIL'); setError(''); }}
              className="w-full font-cinzel text-[10px] tracking-widest text-ash hover:text-white transition-colors uppercase pt-4"
            >
              Back to Login
            </button>
          </div>
        )}

        {!isForgotMode && (
          <div className="mt-8 text-center flex flex-col items-center gap-6">
            {(!isForgotMode && mode !== 'admin') && (
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="font-cinzel text-[10px] tracking-widest text-ash hover:text-white transition-colors uppercase"
              >
                {isLogin ? "Don't have an identity? Register" : "Already registered? Login"}
              </button>
            )}

            <Link
              to="/identity"
              className="font-cinzel text-[9px] tracking-[0.4em] text-ash/40 hover:text-ash transition-colors uppercase"
            >
              ← Change Identity
            </Link>
          </div>
        )}
      </motion.div>

      <Overlay 
        isOpen={overlay.isOpen}
        onClose={() => {
           if (overlay.onConfirm) overlay.onConfirm();
           else setOverlay(prev => ({ ...prev, isOpen: false }));
        }}
        title={overlay.title}
        message={overlay.message}
        confirmText="Acknowledged"
      />
    </div>
  )
}
