import { Router } from 'express'
import { z } from 'zod'
import { authService } from '../services/authService'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(['VOTER', 'ADMIN']),
      })
      .parse(req.body)

    const user = await authService.register({ email, password, role })
    res.json({ success: true, user })
  } catch (err: any) {
    const isZod = err instanceof z.ZodError
    let message = isZod ? err.errors[0].message : (err.message || 'Registration failed')
    
    if (err.code === 'P2002') {
      message = 'This email is already registered.'
    }

    console.error(`[Auth:Register] ${isZod ? 'Validation' : 'System'} Error:`, message)
    res.status(400).json({ error: message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = z
      .object({
        email: z.string().email(),
        password: z.string(),
        role: z.enum(['VOTER', 'ADMIN']),
      })
      .parse(req.body)

    const result = await authService.login({ email, password, requestedRole: role })
    if (!result.success) {
      if (result.error === 'ROLE_MISMATCH') {
        return res.status(403).json({ 
          error: `You are registered as ${result.actualRole === 'VOTER' ? 'voter' : 'commissioner'}. Go back and change identity.` 
        })
      }
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    res.json({ token: result.token, user: result.user })
  } catch (err: any) {
    const isZod = err instanceof z.ZodError
    const message = isZod ? err.errors[0].message : (err.message || 'Login failed')
    console.error(`[Auth:Login] ${isZod ? 'Validation' : 'System'} Error:`, message)
    res.status(401).json({ error: message })
  }
})

router.post('/request-action-otp', requireAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHENTICATED' })
    
    const result = await authService.requestActionOTP(req.user.id)
    res.json({ success: true, message: 'OTP sent', previewUrl: result.previewUrl })
  } catch (err: any) {
    console.error('[Auth:OTP] Error:', err.message || err)
    res.status(500).json({ error: 'Ritual failed: Unable to manifest OTP via email portal. Check console logs.' })
  }
})

router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body)
    const result = await authService.requestPasswordReset(email)
    res.json({ success: true, message: 'System spell sent via email', previewUrl: result.previewUrl })
  } catch (err: any) {
    console.error('[Auth:PasswordResetOTP] Error:', err.message || err)
    res.status(400).json({ error: 'Failed to request reset.' })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = z
      .object({ email: z.string().email(), otp: z.string(), newPassword: z.string().min(8) })
      .parse(req.body)

    const success = await authService.resetPassword(email, otp, newPassword)
    if (!success) {
      return res.status(400).json({ error: 'Invalid or expired system spell.' })
    }
    res.json({ success: true, message: 'Password has been successfully reforged.' })
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to reset password.' })
  }
})

router.post('/oauth', async (req, res) => {
  try {
    const { idToken, role } = z
      .object({ idToken: z.string(), role: z.enum(['VOTER', 'ADMIN']) })
      .parse(req.body)

    const result = await authService.oauthLogin({ idToken, requestedRole: role })
    if (!result.success) {
       if (result.error === 'ROLE_MISMATCH') {
          return res.status(403).json({ 
            error: `You are registered as ${result.actualRole === 'VOTER' ? 'voter' : 'commissioner'}. Go back and change identity.` 
          })
       }
       return res.status(401).json({ error: result.error || 'OAuth login failed' })
    }

    res.json({ token: result.token, user: result.user })
  } catch (err: any) {
    const isZod = err instanceof z.ZodError
    const message = isZod ? err.errors[0].message : (err.message || 'OAuth login failed')
    res.status(401).json({ error: message })
  }
})

export { router as authRouter }

