import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db/prisma'
import { requireAdmin } from '../middleware/auth'
import { authService } from '../services/authService'
import { auditChainService } from '../services/auditChainService'
import { dynamicCodeService } from '../services/dynamicCodeService'
import crypto from 'crypto'

const router = Router()

const HMAC_SECRET = process.env.HMAC_SECRET || 'chainvote-federation-secret'

// ─── Create Election (Feature 3: DRAFT mode + Feature 12: theme + Feature 16: votingMode + Feature 17: quorum) ───
router.post('/elections/create', requireAdmin, async (req, res) => {
  console.log(`[Admin:Create] Ritual Attempt by ${req.user!.email}`)
  try {
    const body = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      candidates: z.array(z.object({ name: z.string().min(1), manifesto: z.string().optional() })).min(2),
      otp: z.string().length(6),
      masterCode: z.string().length(3),
      isWhitelistedOnly: z.boolean().optional().default(false),
      whitelistedEmails: z.array(z.string().email()).optional().default([]),
      votingMode: z.enum(['NORMAL', 'RANKED']).optional().default('NORMAL'),
      atmosphereTheme: z.enum(['void', 'crimson', 'arctic', 'jade', 'ember']).optional().default('void'),
      quorumPercent: z.number().int().min(1).max(100).optional(),
      publishAsDraft: z.boolean().optional().default(false),
      durationDays: z.number().int().min(1).optional().default(30),
      endTime: z.string().optional(), // Loosened for better compatibility
      auditVisibility: z.enum(['OPEN', 'SEALED']).optional().default('OPEN'),
    }).parse(req.body)

    const isOtpValid = await authService.verifyActionOTP(req.user!.id, body.otp)
    if (!isOtpValid) {
      console.warn(`[Admin:Create] OTP Validation Failed for user ${req.user!.id}`)
      return res.status(401).json({ error: 'Email OTP is invalid or has expired. Please verify the code from your manifest.' })
    }

    const isMasterValid = await dynamicCodeService.verifyAndConsume(req.user!.id, body.masterCode)
    if (!isMasterValid) {
      console.warn(`[Admin:Create] Master Code Validation Failed for user ${req.user!.id}`)
      return res.status(401).json({ error: 'Master Code is invalid, already used, or has expired. Please use the current ephemeral key.' })
    }

    const calculatedEndTime = body.endTime 
      ? new Date(body.endTime) 
      : new Date(Date.now() + body.durationDays * 24 * 60 * 60 * 1000)

    const election = await prisma.election.create({
      data: {
        title: body.title,
        description: body.description,
        status: body.publishAsDraft ? 'DRAFT' : 'LIVE',
        votingMode: body.votingMode,
        atmosphereTheme: body.atmosphereTheme,
        quorumPercent: body.quorumPercent,
        auditVisibility: body.auditVisibility,
        startTime: new Date(),
        endTime: calculatedEndTime,
        isWhitelistedOnly: body.isWhitelistedOnly,
        creatorId: req.user!.id,
        candidates: { create: body.candidates },
        whitelistedVoters: {
          create: body.whitelistedEmails.map(email => ({
            emailHash: crypto.createHash('sha256').update(email.toLowerCase()).digest('hex'),
          })),
        },
      },
      include: { candidates: true, whitelistedVoters: true },
    })

    await auditChainService.append('ELECTION_CREATED', req.user!.id, { electionId: election.id, title: election.title, status: election.status })
    res.json({ success: true, election })
  } catch (err: any) {
    const isZod = err instanceof z.ZodError
    const message = isZod ? err.errors[0].message : (err.message || 'Creation failed')
    console.error(`[Admin:Create] Error:`, message)
    res.status(400).json({ error: message })
  }
})

// ─── Feature 3: Publish DRAFT → LIVE ──────────────────────────────────────────
router.post('/elections/:id/publish', requireAdmin, async (req, res) => {
  console.log(`[Admin:Publish] Reification Attempt for election ${req.params.id}`)
  try {
    const id = z.string().uuid().parse(req.params.id)
    const { otp, masterCode } = z.object({ otp: z.string().length(6), masterCode: z.string() }).parse(req.body)

    const isOtpValid = await authService.verifyActionOTP(req.user!.id, otp)
    if (!isOtpValid) return res.status(401).json({ error: 'Email OTP Verification Failed.' })

    const isMasterValid = await dynamicCodeService.verifyAndConsume(req.user!.id, masterCode)
    if (!isMasterValid) return res.status(401).json({ error: 'Master Code Verification Failed.' })

    const election = await prisma.election.findUnique({ where: { id } })
    if (!election) return res.status(404).json({ error: 'Election not found.' })
    if (election.status !== 'DRAFT') return res.status(400).json({ error: 'Only DRAFT elections can be published.' })

    const updated = await prisma.election.update({ where: { id }, data: { status: 'LIVE' } })
    await auditChainService.append('ELECTION_PUBLISHED', req.user!.id, { electionId: id })

    res.json({ success: true, election: updated })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Feature 19: Election Recall ──────────────────────────────────────────────
router.post('/elections/:id/recall', requireAdmin, async (req, res) => {
  try {
    const id = z.string().uuid().parse(req.params.id)
    const { otp, masterCode, reason } = z.object({
      otp: z.string().length(6),
      masterCode: z.string(),
      reason: z.string().optional(),
    }).parse(req.body)

    const isOtpValid = await authService.verifyActionOTP(req.user!.id, otp)
    if (!isOtpValid) return res.status(401).json({ error: 'Email OTP Verification Failed.' })

    const isMasterValid = await dynamicCodeService.verifyAndConsume(req.user!.id, masterCode)
    if (!isMasterValid) return res.status(401).json({ error: 'Master Code Verification Failed.' })

    await prisma.election.update({ where: { id }, data: { status: 'RECALLED' } })
    await prisma.electionRecall.create({ data: { electionId: id, reason } })
    await auditChainService.append('ELECTION_RECALLED', req.user!.id, { electionId: id, reason })

    const { io } = await import('../index')
    io.emit('election:recalled', { electionId: id })

    res.json({ success: true, message: 'The election has been cryptographically recalled. All future vote attempts will be rejected.' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Feature 21: Federation Manifest ─────────────────────────────────────────
router.get('/elections/:id/federation-manifest', requireAdmin, async (req, res) => {
  try {
    const id = z.string().uuid().parse(req.params.id)
    const election = await prisma.election.findUnique({
      where: { id },
      select: { id: true, title: true, merkleRoot: true, votingMode: true, endTime: true, status: true },
    })
    if (!election) return res.status(404).json({ error: 'Election not found.' })

    const payload = JSON.stringify({ ...election, generatedAt: new Date().toISOString() })
    const signature = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex')

    res.json({ manifest: JSON.parse(payload), signature, verifyWith: 'HMAC-SHA256' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Feature 17: Check Quorum (triggered after endTime) ──────────────────────
router.post('/elections/:id/check-quorum', requireAdmin, async (req, res) => {
  try {
    const id = z.string().uuid().parse(req.params.id)
    const election = await prisma.election.findUnique({
      where: { id },
      include: { whitelistedVoters: true },
    })
    if (!election) return res.status(404).json({ error: 'Election not found.' })
    if (!election.quorumPercent) return res.json({ quorumRequired: false })

    const voteCount = await prisma.vote.count({ where: { electionId: id } })
    const eligible = election.whitelistedVoters.length || 1
    const actualPercent = Math.round((voteCount / eligible) * 100)
    const quorumMet = actualPercent >= election.quorumPercent

    if (!quorumMet && election.endTime < new Date()) {
      await prisma.election.update({ where: { id }, data: { status: 'VOID_QUORUM' } })
    }

    res.json({ quorumMet, actualPercent, required: election.quorumPercent, voteCount, eligible })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Existing: Candidates, Tamper Demo, Delete, Export ───────────────────────
router.post('/candidates', requireAdmin, async (req, res) => {
  try {
    const { electionId, name, manifesto } = z.object({
      electionId: z.string().uuid(),
      name: z.string().min(1),
      manifesto: z.string().optional(),
    }).parse(req.body)

    const candidate = await prisma.candidate.create({ data: { electionId, name, manifesto } })
    res.json({ success: true, candidate })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/tamper-demo', requireAdmin, async (req, res) => {
  try {
    const { voteId, electionId, newCandidateId } = z.object({
      voteId: z.string().uuid(),
      electionId: z.string().uuid(),
      newCandidateId: z.string().uuid().optional(),
    }).parse(req.body)

    const fallbackCandidate = await prisma.candidate.findFirst({
      where: { electionId },
      orderBy: { createdAt: 'asc' },
    })

    await prisma.vote.update({
      where: { id: voteId },
      data: { candidateId: newCandidateId ?? fallbackCandidate?.id ?? undefined },
    })

    const { io } = await import('../index')
    io.to(`election:${electionId}`).emit('chain:tampered', { tamperedVoteId: voteId, electionId })

    res.json({ success: true, message: 'Tamper injected for demonstration' })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/elections/:id', requireAdmin, async (req, res) => {
  try {
    const id = z.string().uuid().parse(req.params.id)
    const { otp, masterCode } = z.object({
      otp: z.string().length(6),
      masterCode: z.string(),
    }).parse(req.body)

    const isMasterValid = await dynamicCodeService.verifyAndConsume(req.user!.id, masterCode)
    const isOtpValid = await authService.verifyActionOTP(req.user!.id, otp)
    if (!isMasterValid || !isOtpValid) {
      return res.status(401).json({ error: 'Ritual Verification Failed. Missing or invalid dual-lock codes.' })
    }

    await prisma.rankedVote.deleteMany({ where: { electionId: id } })
    await prisma.delegation.deleteMany({ where: { electionId: id } })
    await prisma.merkleSnapshot.deleteMany({ where: { electionId: id } })
    await prisma.voteVelocity.deleteMany({ where: { electionId: id } })
    await prisma.vote.deleteMany({ where: { electionId: id } })
    await prisma.candidate.deleteMany({ where: { electionId: id } })
    await prisma.whitelistedVoter.deleteMany({ where: { electionId: id } })
    await prisma.electionRecall.deleteMany({ where: { electionId: id } })
    await prisma.election.delete({ where: { id } })
    await auditChainService.append('ELECTION_DELETED', req.user!.id, { electionId: id })
    res.json({ success: true, message: 'Election successfully purged from the chain.' })
  } catch (err: any) {
    console.error(`[Admin:DeleteRitual] Purge failed:`, err)
    res.status(500).json({ error: 'Purge failed: The node is resistant to deletion. Ritual incomplete.' })
  }
})

// ─── Election Analytics (Feature Upgrade) ──────────────────────────────────
router.get('/elections/:id/analytics', requireAdmin, async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
    
    // Fetch all votes for this election including candidate name
    const votes = await prisma.vote.findMany({
      where: { electionId: id },
      select: { voterHash: true, candidate: { select: { id: true, name: true } } }
    })

    // Fetch demographics for these voters
    const voterHashes = [...new Set(votes.map(v => v.voterHash))]
    const users = await prisma.user.findMany({
      where: { voterHash: { in: voterHashes } },
      select: { voterHash: true, age: true, location: true, occupation: true }
    })

    const userMap = new Map(users.map(u => [u.voterHash, u]))

    const stats: any = {
      candidates: {} // candidateId -> { name, demographics }
    }

    votes.forEach(vote => {
      const user = userMap.get(vote.voterHash)
      if (!stats.candidates[vote.candidate.id]) {
        stats.candidates[vote.candidate.id] = {
          name: vote.candidate.name,
          ageBuckets: {},
          locations: {},
          occupations: {}
        }
      }

      const cStats = stats.candidates[vote.candidate.id]

      // Age Bucket (e.g., 18-25, 26-35, etc.)
      if (user?.age) {
        const bucket = `${Math.floor(user.age / 10) * 10}-${Math.floor(user.age / 10) * 10 + 9}`
        cStats.ageBuckets[bucket] = (cStats.ageBuckets[bucket] || 0) + 1
      }

      if (user?.location) {
        cStats.locations[user.location] = (cStats.locations[user.location] || 0) + 1
      }

      if (user?.occupation) {
        cStats.occupations[user.occupation] = (cStats.occupations[user.occupation] || 0) + 1
      }
    })

    res.json({ success: true, analytics: stats })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/elections/:id/export', requireAdmin, async (req, res) => {
  try {
    const election = await prisma.election.findUnique({
      where: { id: req.params.id },
      include: { candidates: true, votes: { orderBy: { timestamp: 'asc' } }, snapshots: true },
    })
    if (!election) return res.status(404).json({ error: 'Election node not found.' })

    const ledger = {
      election: {
        id: election.id, title: election.title, merkleRoot: election.merkleRoot,
        totalVotes: election.votes.length, status: election.status, votingMode: election.votingMode,
        startTime: election.startTime, endTime: election.endTime,
      },
      snapshots: election.snapshots,
      ledger: election.votes.map(v => ({
        voterHash: v.voterHash, candidateId: v.candidateId, timestamp: v.timestamp,
        voteHash: v.voteHash, prevHash: v.prevHash, ringId: v.ringId, isEarlyVote: v.isEarlyVote,
      })),
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename=ledger_${req.params.id}.json`)
    res.json(ledger)
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to manifest ledger export.' })
  }
})

// ─── Dual-Mode Advanced Settings ───────────────────────────────────────────────
router.get('/system-settings', requireAdmin, async (req, res) => {
  try {
    let settings = await prisma.systemSettings.findUnique({ where: { id: 'global' } })
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: { id: 'global' } })
    }
    res.json(settings)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/system-settings', requireAdmin, async (req, res) => {
  try {
    const { tallyingMode, validationMode, cryptoMode, identityMode } = z.object({
      tallyingMode: z.string(),
      validationMode: z.string(),
      cryptoMode: z.string(),
      identityMode: z.string(),
    }).parse(req.body)

    const updated = await prisma.systemSettings.upsert({
      where: { id: 'global' },
      update: { tallyingMode, validationMode, cryptoMode, identityMode },
      create: { id: 'global', tallyingMode, validationMode, cryptoMode, identityMode },
    })

    res.json({ success: true, settings: updated })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// ─── Email Diagnostics (Phase 2 Debugging) ───────────────────────────────────
router.post('/debug/test-email', requireAdmin, async (req, res) => {
  try {
    const { to } = z.object({ to: z.string().email() }).parse(req.body)
    const { emailService } = await import('../services/emailService')
    
    console.log(`[Admin:Debug] Triggering test email to ${to}...`)
    const result = await emailService.sendEmail(
      to, 
      "ChainVote: Diagnostic Ritual", 
      "<p>If you see this, the SMTP portal is open and the ritual is complete.</p>",
      "DEBUG_TEST"
    )
    
    res.json({ 
      success: true, 
      message: 'Diagnostic spell cast. Check backend logs and target inbox.',
      previewUrl: result 
    })
  } catch (err: any) {
    console.error(`[Admin:Debug] Spell failed:`, err.message || err)
    res.status(500).json({ error: `Diagnostic failed: ${err.message || err}` })
  }
})

// ─── SQL Workbench / Database Engine ─────────────────────────────────────────
router.get('/db-engine/tables', requireAdmin, async (req, res) => {
  try {
    const isPostgres = process.env.DATABASE_URL?.startsWith('postgres');
    const query = isPostgres 
      ? "SELECT table_name as name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
      : "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;";
    
    const tables: any[] = await prisma.$queryRawUnsafe(query);
    res.json({ success: true, tables: tables.map(t => t.name) });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to fetch tables: ${err.message}` });
  }
});

router.post('/db-engine/execute', requireAdmin, async (req, res) => {
  try {
    const { query } = req.body
    if (!query) return res.status(400).json({ error: 'Query is missing' })
    if (typeof query !== 'string') return res.status(400).json({ error: 'Query must be a string' })

    const lowerQuery = query.toLowerCase().trim()
    const isDQL = /^\s*(select|show|pragma|explain|desc|describe|with|values|call|list)\b/i.test(lowerQuery) || lowerQuery.includes('returning');
    
    let result;
    if (isDQL) {
      result = await prisma.$queryRawUnsafe(query)
    } else {
      result = await prisma.$executeRawUnsafe(query)
      result = { rowsAffected: result, status: 'Success', timestamp: new Date().toISOString() }
    }
    
    // SQLite BigInt conversion helper
    const convertBigInt = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'bigint') return Number(obj);
      if (Array.isArray(obj)) return obj.map(convertBigInt);
      if (typeof obj === 'object') {
        const o: any = {}
        for (const [k, v] of Object.entries(obj)) {
          o[k] = convertBigInt(v)
        }
        return o;
      }
      return obj;
    };
    
    res.json({ success: true, data: convertBigInt(result) })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

// ─── Dynamic Code Management ───────────────────────────────────────────────
router.get('/dynamic-code', requireAdmin, async (req, res) => {
  try {
    const { code } = await dynamicCodeService.generateCode(req.user!.id)
    res.json({ code })
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to manifest dynamic code.' })
  }
})

// ─── Commissioner Management (Super Admin Only) ─────────────────────────────
const requireSuperAdmin = async (req: any, res: any, next: any) => {
  if (req.user?.email === 'tanaytrivedi24@gmail.com') return next()
  res.status(403).json({ error: 'Access restricted to the High Architect.' })
}

router.get('/commissioners/pending', requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const pending = await prisma.user.findMany({
      where: { role: 'COMMISSIONER', isVerified: false },
      select: { id: true, email: true, createdAt: true, location: true, occupation: true }
    })
    res.json(pending)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/commissioners/verify/:id', requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    await prisma.user.update({ where: { id }, data: { isVerified: true } })
    res.json({ success: true, message: 'Identity verified and added to the high scroll.' })
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to verify identity.' })
  }
})

router.post('/commissioners/add', requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string().min(8) }).parse(req.body)
    await authService.register({ email, password, role: 'COMMISSIONER', age: 0, location: 'System Generated', occupation: 'Election Commissioner' })
    // Note: register sets isVerified: false for ECs, so we must approve it immediately or modify register
    const user = await prisma.user.update({ where: { email }, data: { isVerified: true } })
    res.json({ success: true, user: { email: user.email, role: user.role } })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export { router as adminRouter }
