import { Router } from 'express'
import { z } from 'zod'
import { requireVoter, requireAdmin } from '../middleware/auth'
import { authService } from '../services/authService'
import { voteService } from '../services/voteService'
import { rankedVoteService } from '../services/rankedVoteService'
import { auditChainService } from '../services/auditChainService'
import { io } from '../index'
import { merkleService } from '../services/merkleService'
import { prisma } from '../db/prisma'
import { passportService } from '../services/passportService'
import crypto from 'crypto'
import { tallyFheMock, generateW3cDidDocument, verifyZkSnarkMock, signDilithiumMock } from '../services/cryptoHelpers'

const router = Router()

const CastVoteSchema = z.object({
  electionId: z.string().uuid(),
  candidateId: z.string().uuid(),
  otp: z.string().length(6),
})

const RankedCastSchema = z.object({
  electionId: z.string().uuid(),
  otp: z.string().length(6),
  rankings: z.array(z.object({ candidateId: z.string().uuid(), rank: z.number().int().min(1) })),
})

// ─── Helper ───────────────────────────────────────────────────────────────────
const checkTimeLock = async (electionId: string) => {
  const election = await prisma.election.findUnique({ where: { id: electionId } })
  if (!election) throw new Error('ELECTION_NOT_FOUND')
  if (election.status === 'RECALLED') throw new Error('ELECTION_RECALLED')
  if (election.endTime > new Date()) throw new Error('RESULTS_TIME_LOCKED')
}

// ─── Normal Vote Cast ─────────────────────────────────────────────────────────
router.post('/cast', requireVoter, async (req, res) => {
  try {
    const { electionId, candidateId, otp } = CastVoteSchema.parse(req.body)
    const userId = req.user!.id
    const userEmail = req.user!.email
    const voterHash = req.user!.voterHash

    if (!voterHash) return res.status(403).json({ error: 'NOT_A_VOTER' })

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: { whitelistedVoters: true },
    })
    if (!election) return res.status(404).json({ error: 'Election not found.' })
    if (election.status === 'RECALLED') return res.status(403).json({ error: 'This election has been recalled by the Commissioner.' })
    if (election.votingMode === 'RANKED') return res.status(400).json({ error: 'This election uses ranked-choice voting. Use /cast-ranked.' })

    // Whitelist
    if (election.isWhitelistedOnly) {
      const emailHash = crypto.createHash('sha256').update(userEmail.toLowerCase()).digest('hex')
      const isAuthorized = election.whitelistedVoters.some((wv: any) => wv.emailHash === emailHash)
      if (!isAuthorized) {
        return res.status(403).json({ error: 'Your soul is not on the authorized manifest for this ritual.' })
      }
    }

    // Check delegation — delegate may carry extra weight
    const delegations = await prisma.delegation.count({
      where: { electionId, delegateHash: voterHash, isRevoked: false },
    })

    const otpValid = await authService.verifyActionOTP(userId, otp)
    if (!otpValid) return res.status(401).json({
      error: 'Ballot Sealing Failed',
      message: 'The sealing sequence was rejected by the chain. Ritual aborted.',
    })

    const result = await voteService.castVote({ voterHash, electionId, candidateId })

    io.to(`election:${electionId}`).emit('vote:cast', {
      voteHash: result.voteHash,
      prevHash: result.prevHash,
      merkleRoot: result.merkleRoot,
      timestamp: result.timestamp,
      position: result.position,
    })
    io.to(`election:${electionId}`).emit('velocity:update', { vpm: 0 }) // will be polled

    res.json({
      success: true,
      voteHash: result.voteHash,
      prevHash: result.prevHash,
      merkleRoot: result.merkleRoot,
      position: result.position,
      delegationsCarried: delegations,
    })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'You have already cast a vote in this election.' })
    }
    const isZod = err instanceof z.ZodError
    const message = isZod ? err.errors[0].message : (err.message || 'Cast failed')
    return res.status(isZod ? 400 : 500).json({ error: message })
  }
})

// ─── Ranked Vote Cast ─────────────────────────────────────────────────────────
router.post('/cast-ranked', requireVoter, async (req, res) => {
  try {
    const { electionId, otp, rankings } = RankedCastSchema.parse(req.body)
    const userId = req.user!.id
    const voterHash = req.user!.voterHash
    const userEmail = req.user!.email

    if (!voterHash) return res.status(403).json({ error: 'NOT_A_VOTER' })

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: { whitelistedVoters: true },
    })
    if (!election) return res.status(404).json({ error: 'Election not found.' })
    if (election.status === 'RECALLED') return res.status(403).json({ error: 'This election has been recalled.' })
    if (election.votingMode !== 'RANKED') return res.status(400).json({ error: 'This election uses normal voting. Use /cast.' })

    if (election.isWhitelistedOnly) {
      const emailHash = crypto.createHash('sha256').update(userEmail.toLowerCase()).digest('hex')
      if (!election.whitelistedVoters.some((wv: any) => wv.emailHash === emailHash)) {
        return res.status(403).json({ error: 'Your soul is not on the authorized manifest.' })
      }
    }

    const otpValid = await authService.verifyActionOTP(userId, otp)
    if (!otpValid) return res.status(401).json({ error: 'Ballot Sealing Failed', message: 'Ritual aborted.' })

    const result = await rankedVoteService.castRankedVote({ voterHash, electionId, rankings })

    await passportService.recordVote(voterHash)
    await auditChainService.append('RANKED_VOTE_CAST', voterHash, { electionId, voteHash: result.voteHash })

    io.to(`election:${electionId}`).emit('vote:cast', { voteHash: result.voteHash, timestamp: result.timestamp })

    res.json({ success: true, voteHash: result.voteHash, prevHash: result.prevHash })
  } catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ error: 'You have already voted in this election.' })
    const isZod = err instanceof z.ZodError
    return res.status(isZod ? 400 : 500).json({ error: err.message || 'Cast failed' })
  }
})

// ─── IRV Tally ───────────────────────────────────────────────────────────────
router.get('/ranked-tally/:electionId', async (req, res) => {
  try {
    const electionId = z.string().uuid().parse(req.params.electionId)
    await checkTimeLock(electionId)
    const settings = await prisma.systemSettings.findUnique({ where: { id: 'global' } })
    const tally = await rankedVoteService.tallyIRV(electionId)
    
    // Feature 7: Advanced Crypto Mode - FHE Simulation
    if (settings && settings.tallyingMode === 'FHE') {
      const finalRound = tally.rounds[tally.rounds.length - 1];
      const allCounts = finalRound ? Object.values(finalRound.tallies as Record<string, number>) : [];
      const fheSimulation = tallyFheMock(allCounts as number[]);
      return res.json({
         ...tally,
         fheTallyActive: true,
         fheToken: fheSimulation.fheToken,
         winnerName: 'Encrypted_Tally_Process' // hide name conceptually or map it
      });
    }

    const candidates = await prisma.candidate.findMany({ where: { id: tally.winner ?? '' } })
    res.json({ ...tally, winnerName: candidates[0]?.name ?? null })
  } catch (err: any) {
    if (err.message === 'RESULTS_TIME_LOCKED') return res.status(403).json({ error: 'Results Time-Locked', message: 'The ledger is currently sealed.' })
    res.status(400).json({ error: err.message })
  }
})

// ─── Delegation ───────────────────────────────────────────────────────────────
router.post('/delegate', requireVoter, async (req, res) => {
  try {
    const { electionId, delegateEmail, otp } = req.body
    const voterHash = req.user!.voterHash
    const userId = req.user!.id
    if (!voterHash) return res.status(403).json({ error: 'NOT_A_VOTER' })

    const otpValid = await authService.verifyActionOTP(userId, otp)
    if (!otpValid) return res.status(401).json({ error: 'OTP invalid. Delegation ritual aborted.' })

    // Resolve delegate's voterHash from their email
    const delegateUser = await prisma.user.findUnique({ where: { email: delegateEmail } })
    if (!delegateUser?.voterHash) return res.status(404).json({ error: 'Delegate identity not found in the chain.' })

    const delegation = await prisma.delegation.upsert({
      where: { electionId_delegatorHash: { electionId, delegatorHash: voterHash } },
      create: { electionId, delegatorHash: voterHash, delegateHash: delegateUser.voterHash },
      update: { delegateHash: delegateUser.voterHash, isRevoked: false, signedAt: new Date() },
    })

    await auditChainService.append('DELEGATION_CREATED', voterHash, { electionId, delegateHash: delegateUser.voterHash })
    res.json({ success: true, delegation })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Delegation failed' })
  }
})

router.delete('/delegate/:electionId', requireVoter, async (req, res) => {
  try {
    const electionId = z.string().uuid().parse(req.params.electionId)
    const voterHash = req.user!.voterHash
    if (!voterHash) return res.status(403).json({ error: 'NOT_A_VOTER' })

    await prisma.delegation.updateMany({
      where: { electionId, delegatorHash: voterHash },
      data: { isRevoked: true },
    })
    await auditChainService.append('DELEGATION_REVOKED', voterHash, { electionId })
    res.json({ success: true, message: 'Delegation revoked. Your ballot is your own again.' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Vote Receipt Verification (Feature 2) ────────────────────────────────────
router.get('/verify-receipt/:voteHash', async (req, res) => {
  try {
    const voteHash = req.params.voteHash
    const result = await voteService.verifyReceipt(voteHash)
    if (!result) return res.status(404).json({ found: false, message: 'No record of this vote hash exists in the chain.' })
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Voter Passport (Feature 20) ──────────────────────────────────────────────
router.get('/passport', requireVoter, async (req, res) => {
  try {
    const voterHash = req.user!.voterHash
    if (!voterHash) return res.status(403).json({ error: 'NOT_A_VOTER' })
    const passport = await passportService.getPassport(voterHash)

    const settings = await prisma.systemSettings.findUnique({ where: { id: 'global' } })
    if (settings && settings.identityMode === 'W3C_DID') {
      const didPassport = generateW3cDidDocument(voterHash)
      return res.json({
        isW3cDID: true,
        document: didPassport,
        traditionalPassport: passport ?? { voterHash, electionCount: 0, sigilLevel: 1 }
      })
    }

    res.json(passport ?? { voterHash, electionCount: 0, sigilLevel: 1 })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Chain + Merkle (Time-Locked) ────────────────────────────────────────────
router.get('/chain/:electionId', async (req, res) => {
  try {
    const electionId = z.string().uuid().parse(req.params.electionId)
    await checkTimeLock(electionId)
    const chain = await voteService.getChain(electionId)
    res.json(chain)
  } catch (err: any) {
    if (err.message === 'RESULTS_TIME_LOCKED') return res.status(403).json({ error: 'Results Time-Locked', message: 'The ledger is currently sealed.' })
    if (err.message === 'ELECTION_RECALLED') return res.status(403).json({ error: 'Election Recalled', message: 'This election was recalled by the Commissioner.' })
    res.status(400).json({ error: 'Invalid election ID' })
  }
})

router.get('/verify/:electionId', async (req, res) => {
  try {
    const electionId = z.string().uuid().parse(req.params.electionId)
    await checkTimeLock(electionId)
    const integrity = await voteService.verifyChain(electionId)
    res.json(integrity)
  } catch (err: any) {
    if (err.message === 'RESULTS_TIME_LOCKED') return res.status(403).json({ error: 'Results Time-Locked', message: 'The ledger is currently sealed.' })
    res.status(400).json({ error: 'Invalid election ID' })
  }
})

router.get('/merkle/:electionId', async (req, res) => {
  try {
    const electionId = z.string().uuid().parse(req.params.electionId)
    await checkTimeLock(electionId)
    const tree = await merkleService.getTreeStructure(electionId)
    res.json(tree)
  } catch (err: any) {
    if (err.message === 'RESULTS_TIME_LOCKED') return res.status(403).json({ error: 'Results Time-Locked', message: 'The Merkle hierarchy is currently shrouded.' })
    res.status(400).json({ error: 'Invalid election ID' })
  }
})

// ─── Snapshots (Feature 7) ────────────────────────────────────────────────────
router.get('/snapshots/:electionId', async (req, res) => {
  try {
    const electionId = z.string().uuid().parse(req.params.electionId)
    const snapshots = await voteService.getSnapshots(electionId)
    res.json(snapshots)
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid election ID' })
  }
})

// ─── Velocity (Feature 25) ────────────────────────────────────────────────────
router.get('/velocity/:electionId', async (req, res) => {
  try {
    const electionId = z.string().uuid().parse(req.params.electionId)
    const vel = await prisma.voteVelocity.findUnique({ where: { electionId } })
    res.json({ vpm: vel?.vpm ?? 0, updatedAt: vel?.updatedAt })
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid election ID' })
  }
})

// ─── Audit Chain (Feature 27) ────────────────────────────────────────────────
router.get('/audit-chain', requireAdmin, async (req, res) => {
  try {
    const chain = await auditChainService.getChain(200)
    const integrity = await auditChainService.verifyIntegrity()
    res.json({ chain, integrity })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export { router as votesRouter }
