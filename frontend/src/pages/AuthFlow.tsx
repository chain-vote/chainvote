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
  const [error, setError] = useState('')
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [resetOtp, setResetOtp] = useState('')
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetPasswordRetype, setResetPasswordRetype] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [overlay, setOverlay] = useState<{
    isOpen: boolean
    title: string
    message: string
  }>({
    isOpen: false,
    title: '',
    message: ''
  })

  const isVoter = mode === 'voter'
  const title = isVoter ? 'Citizen Voter' : 'Election Commissioner'

  const authMutation = useMutation({
    mutationFn: (data: any) => data.isOAuth ? api.oauthLogin(data) : (isLogin ? api.login(data) : api.register({ ...data, role: mode?.toUpperCase() })),
    onSuccess: (data: any) => {
      if (data.isOAuth || isLogin) {
        setAuth(data.token, data.user)
        navigate(isVoter ? '/voter/dashboard' : '/admin/dashboard')
      } else {
        setIsLogin(true)
        setError('Registration successful. Please login.')
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
      role: mode?.toUpperCase() as 'VOTER' | 'ADMIN' 
    })
  }

  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      authMutation.mutate({ idToken, role: mode?.toUpperCase() as 'VOTER' | 'ADMIN', isOAuth: true })
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
      setResetEmailSent(true)
      setPreviewUrl(data.previewUrl ?? null)
    } catch (err: any) {
      setError(err.message || 'Failed to request reset.')
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
      setOverlay({ isOpen: true, title: 'Key Reforged', message: 'Your password has been successfully reset. You may now login.' })
      setIsForgotMode(false)
      setResetEmailSent(false)
      setPassword('')
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
          {isLogin ? 'Enter the Vault' : 'Create New Identity'}
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
                  <button type="button" onClick={() => { setIsForgotMode(true); setError(''); }} className="text-[9px] text-gold hover:text-white uppercase tracking-widest transition-colors">Forgot Password?</button>
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
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
              Continue with Google
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {!resetEmailSent ? (
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
            ) : (
               <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-cinzel text-[10px] tracking-widest text-gold uppercase ml-1">System Spell (OTP)</label>
                    <input 
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      maxLength={6}
                      className="w-full bg-void/50 border border-gold/30 rounded px-4 py-3 text-center font-mono tracking-[0.5em] focus:border-gold outline-none"
                      placeholder="******"
                      required
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="font-cinzel text-[10px] tracking-widest text-ash uppercase ml-1">New Key</label>
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
                    <label className="font-cinzel text-[10px] tracking-widest text-ash uppercase ml-1">Retype New Key</label>
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
                 {previewUrl && (
                    <a href={previewUrl} target="_blank" rel="noreferrer" className="block text-center text-[10px] text-ash/40 hover:text-white pb-2 uppercase tracking-widest">
                       Check Test Email
                    </a>
                 )}
                 {error && <div className="text-ember text-[11px] font-mono text-center tracking-tight pb-2">{error}</div>}
                 <button
                    type="submit"
                    className="w-full bg-gold text-void py-4 rounded-lg font-cinzel text-xs tracking-[0.3em] uppercase hover:brightness-110 shadow-[0_0_15px_rgba(255,179,0,0.2)] transition-all"
                  >
                    Forge New Key
                  </button>
               </form>
            )}

            <button 
              onClick={() => { setIsForgotMode(false); setResetEmailSent(false); setError(''); }}
              className="w-full font-cinzel text-[10px] tracking-widest text-ash hover:text-white transition-colors uppercase pt-4"
            >
              Back to Login
            </button>
          </div>
        )}

        {!isForgotMode && (
          <div className="mt-8 text-center flex flex-col items-center gap-6">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="font-cinzel text-[10px] tracking-widest text-ash hover:text-white transition-colors uppercase"
            >
              {isLogin ? "Don't have an identity? Register" : "Already registered? Login"}
            </button>

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
        onClose={() => setOverlay(prev => ({ ...prev, isOpen: false }))}
        title={overlay.title}
        message={overlay.message}
        confirmText="Acknowledge"
      />
    </div>
  )
}
