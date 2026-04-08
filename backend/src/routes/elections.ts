import { Router } from 'express'
import { z } from 'zod'
import { electionsService } from '../services/electionsService'

const router = Router()

router.get('/active', async (_req, res) => {
  const elections = await electionsService.listActive()
  res.json(elections)
})

router.get('/:id', async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const election = await electionsService.getById(id)
  if (!election) return res.status(404).json({ error: 'NOT_FOUND' })
  res.json(election)
})

export { router as electionsRouter }

