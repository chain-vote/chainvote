import { createHash, randomBytes } from 'crypto'
import { prisma } from '../db/prisma'
import { merkleService } from './merkleService'
import { passportService } from './passportService'
import { auditChainService } from './auditChainService'

export const voteService = {
  async castVote({
    voterHash,
    electionId,
    candidateId,
  }: {
    voterHash: string
    electionId: string
    candidateId: string
  }) {
    // Shared check to prevent double-voting across all providers
    const existingVote = await prisma.vote.findUnique({
      where: { voterHash_electionId: { voterHash, electionId } }
    })
    if (existingVote) {
      throw new Error('RITUAL_ALREADY_MANIFESTED')
    }

    if (process.env.DB_PROVIDER === 'postgresql') {
      const vote = await prisma.vote.create({
        data: {
          voterHash,
          electionId,
          candidateId,
          voteHash: 'PENDING',
          prevHash: 'PENDING',
        },
      })
      const computed = await prisma.vote.findUnique({ where: { id: vote.id } })
      await prisma.$executeRaw`SELECT compute_merkle_root(${electionId}::uuid)`
      
      // Feature 20: Ensure passport is recorded in PG ritual too
      await passportService.recordVote(voterHash)

      const election = await prisma.election.findUnique({
        where: { id: electionId },
        select: { merkleRoot: true },
      })
      return {
        ...computed!,
        merkleRoot: election?.merkleRoot ?? '',
        position: await this.getChainLength(electionId),
      }
    }

    // Basic retry loop for SQLite DB Locking
    let vote
    let retries = 3
    while (retries > 0) {
      try {
        const election = await prisma.election.findUnique({
          where: { id: electionId },
          select: { startTime: true, endTime: true, ringWindowMinutes: true },
        })

        const prevVote = await prisma.vote.findFirst({
          where: { electionId },
          orderBy: { timestamp: 'desc' },
          select: { voteHash: true },
        })

        const prevHash = prevVote?.voteHash ?? createHash('sha256').update('GENESIS').digest('hex')
        const timestamp = new Date()

        // Feature 18: Early vote flag
        const electionDuration = (election!.endTime.getTime() - election!.startTime.getTime())
        const firstQuarter = election!.startTime.getTime() + electionDuration * 0.25
        const isEarlyVote = timestamp.getTime() < firstQuarter

        // Feature 8: Ring ID (time-bucket for anonymity grouping)
        const windowMs = (election!.ringWindowMinutes ?? 5) * 60 * 1000
        const bucket = Math.floor(timestamp.getTime() / windowMs)
        const ringId = createHash('sha256').update(`${electionId}::ring::${bucket}`).digest('hex').slice(0, 16)

        // Feature 9: Vote commitment
        const nonce = randomBytes(16).toString('hex')
        const commitment = createHash('sha256').update(candidateId + nonce).digest('hex')

        const voteHash = createHash('sha256')
          .update(voterHash + candidateId + timestamp.toISOString() + prevHash)
          .digest('hex')

        // Feature 23: Chain fork detection
        const expectedTip = prevVote?.voteHash
        const actualTip = await prisma.vote.findFirst({
          where: { electionId },
          orderBy: { timestamp: 'desc' },
          select: { voteHash: true },
        })

        if (expectedTip && actualTip && actualTip.voteHash !== expectedTip) {
          await prisma.chainForkLog.create({
            data: { electionId, expectedPrev: expectedTip, receivedPrev: actualTip.voteHash },
          })
        }

        vote = await prisma.vote.create({
          data: {
            voterHash, electionId, candidateId, timestamp, voteHash, prevHash,
            ringId, commitment, revealNonce: nonce, isEarlyVote,
          },
        })
        break
      } catch (err: any) {
        if (err.code === 'P2034' || err.message?.includes('database is locked')) {
          retries--
          if (retries === 0) throw err
          await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
        } else {
          throw err
        }
      }
    }

    if (!vote) throw new Error('Failed to save vote after retries')

    const merkleRoot = await merkleService.computeRoot(electionId)
    const position = await this.getChainLength(electionId)

    // Feature 7: Merkle snapshot every 10 votes
    if (position % 10 === 0) {
      await prisma.merkleSnapshot.create({
        data: { electionId, merkleRoot, voteCount: position },
      })
    }

    // Feature 22 & 25: Update vote velocity (votes per minute)
    await this.updateVelocity(electionId)

    // Feature 20: Update voter passport
    await passportService.recordVote(voterHash)

    // Feature 6 & 27: Append to audit chain
    await auditChainService.append('VOTE_CAST', voterHash, {
      electionId, voteHash: vote.voteHash, position,
    })

    return { ...vote, merkleRoot, position }
  },

  async updateVelocity(electionId: string) {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
    const recentCount = await prisma.vote.count({
      where: { electionId, timestamp: { gte: oneMinuteAgo } },
    })
    await prisma.voteVelocity.upsert({
      where: { electionId },
      create: { electionId, vpm: recentCount, updatedAt: new Date() },
      update: { vpm: recentCount, updatedAt: new Date() },
    })
  },

  async getChain(electionId: string) {
    return prisma.vote.findMany({
      where: { electionId },
      orderBy: { timestamp: 'asc' },
      select: {
        id: true,
        voterHash: true,
        candidateId: true,
        timestamp: true,
        voteHash: true,
        prevHash: true,
        isEarlyVote: true,
        ringId: true,
      },
    })
  },

  async verifyChain(electionId: string) {
    if (process.env.DB_PROVIDER === 'postgresql') {
      return prisma.$queryRaw`
        SELECT * FROM chain_integrity
        WHERE election_id = ${electionId}::uuid
        ORDER BY timestamp
      `
    }

    const votes = await this.getChain(electionId)
    return votes.map((vote, i) => {
      const expectedPrev =
        i === 0 ? createHash('sha256').update('GENESIS').digest('hex') : votes[i - 1].voteHash

      const actualHash = createHash('sha256')
        .update(vote.voterHash + vote.candidateId + vote.timestamp.toISOString() + vote.prevHash)
        .digest('hex')

      return {
        ...vote,
        actual_prev: expectedPrev,
        chain_intact: vote.prevHash === expectedPrev && vote.voteHash === actualHash,
      }
    })
  },

  async verifyReceipt(voteHash: string) {
    const vote = await prisma.vote.findFirst({
      where: { voteHash },
      include: { election: { select: { id: true, title: true, merkleRoot: true } } },
    })
    if (!vote) return null

    const chain = await this.getChain(vote.electionId)
    const idx = chain.findIndex(v => v.voteHash === voteHash)
    const verified = await this.verifyChain(vote.electionId)
    const voteIntact = (verified as any[])[idx]?.chain_intact ?? false

    return {
      found: true,
      voteHash,
      position: idx + 1,
      electionTitle: vote.election.title,
      merkleRoot: vote.election.merkleRoot,
      chainIntact: voteIntact,
      isEarlyVote: vote.isEarlyVote,
    }
  },

  async getSnapshots(electionId: string) {
    return prisma.merkleSnapshot.findMany({
      where: { electionId },
      orderBy: { snapshotAt: 'asc' },
    })
  },

  async getChainLength(electionId: string) {
    return prisma.vote.count({ where: { electionId } })
  },
}
