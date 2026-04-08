import { createHash } from 'crypto'
import { prisma } from '../db/prisma'

/**
 * AuditChainService: Maintains an append-only Merkle sub-chain of all
 * administrative and vote operations. Each log entry hashes the previous
 * entry, creating a tamper-evident audit trail independent of the vote chain.
 */
export const auditChainService = {
  async append(operation: string, actorId?: string, payload?: object) {
    const payloadStr = payload ? JSON.stringify(payload) : ''

    // Get the last entry to form the chain
    const last = await prisma.auditChainLog.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { hash: true },
    })

    const prevHash = last?.hash ?? createHash('sha256').update('AUDIT_GENESIS').digest('hex')
    const hash = createHash('sha256')
      .update(prevHash + operation + payloadStr)
      .digest('hex')

    return prisma.auditChainLog.create({
      data: { operation, actorId, payload: payloadStr || null, hash, prevHash },
    })
  },

  async getChain(limit = 100) {
    return prisma.auditChainLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
  },

  async verifyIntegrity() {
    const logs = await prisma.auditChainLog.findMany({ orderBy: { timestamp: 'asc' } })
    let intact = true
    for (let i = 1; i < logs.length; i++) {
      const expected = createHash('sha256')
        .update((logs[i - 1].hash) + logs[i].operation + (logs[i].payload ?? ''))
        .digest('hex')
      if (expected !== logs[i].hash) {
        intact = false
        break
      }
    }
    return { intact, count: logs.length }
  },
}
