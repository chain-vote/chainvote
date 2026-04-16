import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/prisma'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: string; isVerified: boolean; voterHash: string | null }
    }
  }
}

function getBearerToken(req: Request) {
  const header = req.headers.authorization
  if (header) {
    const [type, token] = header.split(' ')
    if (type?.toLowerCase() === 'bearer' && token) return token
  }
  // Support query token for direct browser access to debug portals
  if (req.query.token) return req.query.token as string
  return null
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req)
    if (!token) return res.status(401).json({ error: 'UNAUTHENTICATED' })

    const secret = process.env.JWT_SECRET || ''
    const decoded = jwt.verify(token, secret) as { userId: string; role: string }
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' })

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      voterHash: user.voterHash,
    }
    
    next()
  } catch {
    return res.status(401).json({ error: 'UNAUTHENTICATED' })
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req)
    if (!token) return next()

    const secret = process.env.JWT_SECRET || ''
    const decoded = jwt.verify(token, secret) as { userId: string; role: string }
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        voterHash: user.voterHash,
      }
    }
    next()
  } catch {
    next()
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    const isAuthorized = req.user?.role === 'ADMIN' || req.user?.role === 'COMMISSIONER'
    const isVerified = req.user?.isVerified === true

    if (isAuthorized && isVerified) {
      return next()
    }
    
    if (isAuthorized && !isVerified) {
      return res.status(403).json({ error: 'VERIFICATION_PENDING' })
    }

    return res.status(403).json({ error: 'FORBIDDEN' })
  })
}

export async function requireVoter(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    if (req.user?.role === 'VOTER') {
      return next()
    }
    return res.status(403).json({ error: 'FORBIDDEN' })
  })
}

