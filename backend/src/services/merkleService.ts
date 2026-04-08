import { createHash } from 'crypto'
import { prisma } from '../db/prisma'

export const merkleService = {
  async computeRoot(electionId: string): Promise<string> {
    const votes = await prisma.vote.findMany({
      where: { electionId },
      orderBy: { timestamp: 'asc' },
      select: { voteHash: true },
    })

    if (votes.length === 0) return ''

    let layer = votes.map((v) => v.voteHash)
    while (layer.length > 1) {
      const next: string[] = []
      for (let i = 0; i < layer.length; i += 2) {
        const left = layer[i]
        const right = layer[i + 1] ?? layer[i]
        next.push(createHash('sha256').update(left + right).digest('hex'))
      }
      layer = next
    }

    const root = layer[0]
    await prisma.election.update({ where: { id: electionId }, data: { merkleRoot: root } })
    return root
  },

  async getTreeStructure(electionId: string) {
    const votes = await prisma.vote.findMany({
      where: { electionId },
      orderBy: { timestamp: 'asc' },
      select: { voteHash: true, id: true },
    })

    const levels: { hash: string; id?: string }[][] = []
    let layer = votes.map((v) => ({ hash: v.voteHash, id: v.id }))
    levels.push(layer)

    while (layer.length > 1) {
      const next: { hash: string }[] = []
      for (let i = 0; i < layer.length; i += 2) {
        const left = layer[i].hash
        const right = layer[i + 1]?.hash ?? layer[i].hash
        next.push({ hash: createHash('sha256').update(left + right).digest('hex') })
      }
      layer = next as any
      levels.push(layer)
    }

    return levels
  },
}

