import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db/prisma'

const router = Router()

router.get('/logs', async (_req, res) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 200 })
  res.json(logs)
})

router.get('/election/:electionId', async (req, res) => {
  const electionId = z.string().uuid().parse(req.params.electionId)
  const logs = await prisma.auditLog.findMany({
    where: { recordId: electionId },
    orderBy: { timestamp: 'desc' },
    take: 200,
  })
  res.json(logs)
})

export { router as auditRouter }

