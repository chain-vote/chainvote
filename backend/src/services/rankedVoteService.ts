import { createHash, randomBytes } from 'crypto'
import { prisma } from '../db/prisma'
import { merkleService } from './merkleService'

/**
 * Instant-Runoff Voting (IRV) algorithm for Ranked-Choice elections.
 * Each voter submits an ordered ranking of all candidates.
 * The algorithm eliminates the candidate with fewest first-preference votes
 * each round until one has majority.
 */

export type RankEntry = { candidateId: string; rank: number }

export const rankedVoteService = {
  async castRankedVote({
    voterHash,
    electionId,
    rankings,
  }: {
    voterHash: string
    electionId: string
    rankings: RankEntry[]
  }) {
    // Sort by rank ascending to ensure consistency
    const sorted = [...rankings].sort((a, b) => a.rank - b.rank)
    const rankingsJson = JSON.stringify(sorted)

    let rankedVote
    let retries = 3
    while (retries > 0) {
      try {
        const prevVote = await prisma.rankedVote.findFirst({
          where: { electionId },
          orderBy: { timestamp: 'desc' },
          select: { voteHash: true },
        })

        const election = await prisma.election.findUnique({
          where: { id: electionId },
          select: { startTime: true, endTime: true },
        })

        const prevHash = prevVote?.voteHash ?? createHash('sha256').update('GENESIS_RANKED').digest('hex')
        const timestamp = new Date()
        const voteHash = createHash('sha256')
          .update(voterHash + rankingsJson + timestamp.toISOString() + prevHash)
          .digest('hex')

        const electionDuration = (election!.endTime.getTime() - election!.startTime.getTime())
        const firstQuarter = election!.startTime.getTime() + electionDuration * 0.25
        const isEarlyVote = timestamp.getTime() < firstQuarter

        rankedVote = await prisma.rankedVote.create({
          data: { voterHash, electionId, rankings: rankingsJson, timestamp, voteHash, prevHash, isEarlyVote },
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

    if (!rankedVote) throw new Error('Failed to save ranked vote after retries')
    return rankedVote
  },

  async tallyIRV(electionId: string): Promise<{ winner: string | null; rounds: any[] }> {
    const votes = await prisma.rankedVote.findMany({
      where: { electionId },
      select: { rankings: true },
    })

    if (votes.length === 0) return { winner: null, rounds: [] }

    const candidates = await prisma.candidate.findMany({
      where: { electionId },
      select: { id: true, name: true },
    })

    let active = new Set(candidates.map(c => c.id))
    const rounds: any[] = []

    while (active.size > 1) {
      // Count first-preference votes for active candidates
      const counts: Record<string, number> = {}
      for (const c of active) counts[c] = 0

      for (const vote of votes) {
        const rankings: RankEntry[] = JSON.parse(vote.rankings)
        const topChoice = rankings
          .filter(r => active.has(r.candidateId))
          .sort((a, b) => a.rank - b.rank)[0]
        if (topChoice) counts[topChoice.candidateId] = (counts[topChoice.candidateId] || 0) + 1
      }

      const total = Object.values(counts).reduce((a, b) => a + b, 0)
      rounds.push({ round: rounds.length + 1, counts: { ...counts }, total })

      // Check for majority
      const winner = Object.entries(counts).find(([, c]) => c > total / 2)
      if (winner) return { winner: winner[0], rounds }

      // Eliminate lowest
      const min = Math.min(...Object.values(counts))
      const toEliminate = Object.entries(counts).find(([, c]) => c === min)![0]
      active.delete(toEliminate)
    }

    return { winner: active.size === 1 ? [...active][0] : null, rounds }
  },

  async getRankedChain(electionId: string) {
    return prisma.rankedVote.findMany({
      where: { electionId },
      orderBy: { timestamp: 'asc' },
      select: { id: true, voterHash: true, timestamp: true, voteHash: true, prevHash: true, isEarlyVote: true },
    })
  },
}
