import { prisma } from '../db/prisma'

/**
 * PassportService: Manages VoterPassport records that track participation
 * history and drive Sigil evolution in the frontend.
 */
export const passportService = {
  async recordVote(voterHash: string) {
    const now = new Date()
    const existing = await prisma.voterPassport.findUnique({ where: { voterHash } })

    if (existing) {
      const newCount = existing.electionCount + 1
      return prisma.voterPassport.update({
        where: { voterHash },
        data: {
          electionCount: newCount,
          lastVoteAt: now,
          sigilLevel: Math.min(5, Math.ceil(newCount / 2)),
        },
      })
    } else {
      return prisma.voterPassport.create({
        data: {
          voterHash,
          electionCount: 1,
          firstVoteAt: now,
          lastVoteAt: now,
          sigilLevel: 1,
        },
      })
    }
  },

  async getPassport(voterHash: string) {
    return prisma.voterPassport.findUnique({ where: { voterHash } })
  },
}
