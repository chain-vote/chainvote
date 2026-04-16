import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import admin from 'firebase-admin'
import { prisma } from '../db/prisma'
import { sha256Hex } from '../lib/crypto'
import { emailService } from './emailService'

const SUPER_ADMIN_EMAIL = 'tanaytrivedi24@gmail.com'

try {
  const accountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const accountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  
  if (!admin.apps.length) {
    if (accountJson) {
      const serviceAccount = typeof accountJson === 'string' ? JSON.parse(accountJson) : accountJson
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    } else if (accountPath) {
      const serviceAccount = require(require('path').resolve(process.cwd(), accountPath))
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    }
  }
} catch (e) {
  console.log('[FirebaseAdmin] Initialization skipped/failed:', e)
}

function randomOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Global normalization helper
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export const authService = {
  async register({ 
    email, 
    password, 
    role, 
    age, 
    location, 
    occupation 
  }: { 
    email: string; 
    password: string; 
    role: 'VOTER' | 'COMMISSIONER' | 'ADMIN';
    age?: number;
    location?: string;
    occupation?: string;
  }) {
    const cleanEmail = normalizeEmail(email)
    const passwordHash = await bcrypt.hash(password, 10)
    const salt = process.env.SERVER_SALT || ''
    
    // Super admin check
    const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL
    const actualRole = isSuperAdmin ? 'ADMIN' : role
    const isVerified = isSuperAdmin || actualRole === 'VOTER' // ECs must be verified by admin

    // voterHash is used for cryptographic anonymity/identity tie in the Merkle Tree
    const voterHash = actualRole === 'VOTER' ? sha256Hex(`${cleanEmail}||${salt}||${Date.now()}`) : null

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        role: actualRole,
        isVerified,
        voterHash,
        age,
        location,
        occupation,
      },
    })

    // Trigger Welcome Ritual Email
    const previewUrl = await emailService.sendWelcomeEmail(user.email, user.role)
    if (previewUrl) {
      console.log(`[ChainVote:Register] Welcome email preview link: ${previewUrl}`)
    }

    return { id: user.id, email: user.email, role: user.role, isVerified: user.isVerified, voterHash: user.voterHash, previewUrl }
  },

  async login({ email, password, requestedRole }: { email: string; password: string; requestedRole: 'VOTER' | 'COMMISSIONER' | 'ADMIN' }) {
    const cleanEmail = normalizeEmail(email)
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (!user) return { success: false as const }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return { success: false as const }

    // If super admin logs in, allow any role requested (or force ADMIN)
    const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL
    if (!isSuperAdmin && user.role !== requestedRole) {
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
        isVerified: user.isVerified,
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
    const cleanEmail = normalizeEmail(email)
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (!user) {
      return { success: false, reason: 'NOT_FOUND' }
    }

    const otp = randomOtp()
    const salt = process.env.SERVER_SALT || ''
    const passwordOtpHash = sha256Hex(`${otp}||${salt}`)
    const passwordOtpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordOtpHash, passwordOtpExpiry },
    })

    const previewUrl = await emailService.sendPasswordResetEmail(user.email, otp)
    return { success: true, role: user.role, previewUrl }
  },

  async verifyPasswordResetOTP(email: string, otp: string) {
    const cleanEmail = normalizeEmail(email)
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (!user || !user.passwordOtpHash || !user.passwordOtpExpiry) return false

    if (user.passwordOtpExpiry.getTime() < Date.now()) return false

    const salt = process.env.SERVER_SALT || ''
    const otpHash = sha256Hex(`${otp}||${salt}`)

    return user.passwordOtpHash === otpHash
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    const cleanEmail = normalizeEmail(email)
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } })
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

  async oauthLogin({ 
    idToken, 
    requestedRole,
    age,
    location,
    occupation
  }: { 
    idToken: string; 
    requestedRole: 'VOTER' | 'COMMISSIONER' | 'ADMIN';
    age?: number;
    location?: string;
    occupation?: string;
  }) {
    try {
      if (!admin.apps.length) throw new Error('Firebase Admin not initialized. Ensure FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH is set.')
      
      const decoded = await admin.auth().verifyIdToken(idToken)
      const rawEmail = decoded.email
      if (!rawEmail) throw new Error('Google account lacks email')
      const cleanEmail = normalizeEmail(rawEmail)
      
      let user = await prisma.user.findUnique({ where: { email: cleanEmail } })
      
      if (!user) {
         const salt = process.env.SERVER_SALT || ''
         const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL
         const actualRole = isSuperAdmin ? 'ADMIN' : requestedRole
         const isVerified = isSuperAdmin || actualRole === 'VOTER'

         const voterHash = actualRole === 'VOTER' ? sha256Hex(`${cleanEmail}||${salt}||${Date.now()}`) : null
         user = await prisma.user.create({
           data: {
             email: cleanEmail,
             passwordHash: 'OAUTH_PROVIDER',
             role: actualRole,
             isVerified,
             voterHash,
             age,
             location,
             occupation,
           }
         })
         await emailService.sendWelcomeEmail(user.email, user.role)
      } else {
         const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL
         if (!isSuperAdmin && user.role !== requestedRole) {
           return { success: false as const, error: 'ROLE_MISMATCH', actualRole: user.role }
         }
      }

      const secret = process.env.JWT_SECRET || ''
      const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '7d' })

      return {
        success: true as const,
        token,
        user: { id: user.id, email: user.email, role: user.role, isVerified: user.isVerified, voterHash: user.voterHash }
      }
    } catch (e: any) {
      return { success: false as const, error: e.message || 'Token verification failed' }
    }
  },
}
