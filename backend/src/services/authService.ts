import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import admin from 'firebase-admin'
import { prisma } from '../db/prisma'
import { sha256Hex } from '../lib/crypto'
import { emailService } from './emailService'

try {
  const accountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  if (accountPath && !admin.apps.length) {
    const serviceAccount = require(require('path').resolve(process.cwd(), accountPath))
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  }
} catch (e) {
  console.log('[FirebaseAdmin] Initialization skipped/failed:', e)
}

function randomOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const authService = {
  async register({ email, password, role }: { email: string; password: string; role: 'VOTER' | 'ADMIN' }) {
    const passwordHash = await bcrypt.hash(password, 10)
    const salt = process.env.SERVER_SALT || ''
    
    // voterHash is used for cryptographic anonymity/identity tie in the Merkle Tree
    const voterHash = role === 'VOTER' ? sha256Hex(`${email}||${salt}||${Date.now()}`) : null

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        voterHash,
      },
    })

    // Trigger Welcome Ritual Email
    const previewUrl = await emailService.sendWelcomeEmail(user.email, user.role)
    if (previewUrl) {
      console.log(`[ChainVote:Register] Welcome email preview link: ${previewUrl}`)
    }

    return { id: user.id, email: user.email, role: user.role, voterHash: user.voterHash, previewUrl }
  },

  async login({ email, password, requestedRole }: { email: string; password: string; requestedRole: 'VOTER' | 'ADMIN' }) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return { success: false as const }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return { success: false as const }

    if (user.role !== requestedRole) {
      return { success: false as const, error: 'ROLE_MISMATCH', actualRole: user.role }
    }

    const secret = process.env.JWT_SECRET || ''
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      secret,
      { expiresIn: '7d' },
    )

    return {
      success: true as const,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        voterHash: user.voterHash,
      },
    }
  },

  async requestActionOTP(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const otp = randomOtp()
    const salt = process.env.SERVER_SALT || ''
    const actionOtpHash = sha256Hex(`${otp}||${salt}`)
    const actionOtpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.user.update({
      where: { id: userId },
      data: { actionOtpHash, actionOtpExpiry },
    })

    const previewUrl = await emailService.sendOTPEmail(user.email, otp)
    return { previewUrl }
  },

  async verifyActionOTP(userId: string, otp: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.actionOtpHash || !user.actionOtpExpiry) return false

    if (user.actionOtpExpiry.getTime() < Date.now()) return false

    const salt = process.env.SERVER_SALT || ''
    const otpHash = sha256Hex(`${otp}||${salt}`)

    if (user.actionOtpHash !== otpHash) return false

    // Clear OTP after use
    await prisma.user.update({
      where: { id: userId },
      data: { actionOtpHash: null, actionOtpExpiry: null },
    })

    return true
  },

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new Error('User not found')

    const otp = randomOtp()
    const salt = process.env.SERVER_SALT || ''
    const passwordOtpHash = sha256Hex(`${otp}||${salt}`)
    const passwordOtpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordOtpHash, passwordOtpExpiry },
    })

    const previewUrl = await emailService.sendPasswordResetEmail(user.email, otp)
    return { previewUrl }
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordOtpHash || !user.passwordOtpExpiry) return false

    if (user.passwordOtpExpiry.getTime() < Date.now()) return false

    const salt = process.env.SERVER_SALT || ''
    const otpHash = sha256Hex(`${otp}||${salt}`)

    if (user.passwordOtpHash !== otpHash) return false

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordOtpHash: null, passwordOtpExpiry: null },
    })

    return true
  },

  async oauthLogin({ idToken, requestedRole }: { idToken: string; requestedRole: 'VOTER' | 'ADMIN' }) {
    try {
      if (!admin.apps.length) throw new Error('Firebase Admin not initialized. Ensure FIREBASE_SERVICE_ACCOUNT_PATH is set.')
      
      const decoded = await admin.auth().verifyIdToken(idToken)
      const email = decoded.email
      if (!email) throw new Error('Google account lacks email')
      
      let user = await prisma.user.findUnique({ where: { email } })
      
      if (!user) {
         const salt = process.env.SERVER_SALT || ''
         const voterHash = requestedRole === 'VOTER' ? sha256Hex(`${email}||${salt}||${Date.now()}`) : null
         user = await prisma.user.create({
           data: {
             email,
             passwordHash: 'OAUTH_PROVIDER',
             role: requestedRole,
             voterHash
           }
         })
         await emailService.sendWelcomeEmail(user.email, user.role)
      } else {
         if (user.role !== requestedRole) {
           return { success: false as const, error: 'ROLE_MISMATCH', actualRole: user.role }
         }
      }

      const secret = process.env.JWT_SECRET || ''
      const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '7d' })

      return {
        success: true as const,
        token,
        user: { id: user.id, email: user.email, role: user.role, voterHash: user.voterHash }
      }
    } catch (e: any) {
      return { success: false as const, error: e.message || 'Token verification failed' }
    }
  },
}

