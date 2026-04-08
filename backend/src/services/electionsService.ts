import { prisma } from '../db/prisma'

export const electionsService = {
  async listActive() {
    const now = new Date()
    return prisma.election.findMany({
      where: {
        startTime: { lte: now },
        endTime: { gte: now },
      },
      orderBy: { startTime: 'desc' },
      include: { candidates: true },
    })
  },

  async getById(id: string) {
    return prisma.election.findUnique({
      where: { id },
      include: { candidates: true },
    })
  },
}

export async function ensureDemoElection() {
  const existing = await prisma.election.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { candidates: true },
  })
  if (existing && existing.candidates.length >= 2) return existing

  const now = new Date()
  const end = new Date(now.getTime() + 1000 * 60 * 60 * 24)

  return prisma.election.create({
    data: {
      title: 'ChainVote Demo Election',
      description: 'A live cryptographically chained ballot.',
      status: 'active',
      startTime: now,
      endTime: end,
      candidates: {
        create: [
          {
            name: 'Aurelia of the Ember',
            manifesto: 'Irreversible truth. Public verifiability. Zero duplicates.',
          },
          {
            name: 'Cassian of the Gold',
            manifesto: 'Audit everything. Chain everything. Let math speak.',
          },
        ],
      },
    },
    include: { candidates: true },
  })
}

