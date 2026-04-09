import { Router } from 'express'
import { z } from 'zod'
import { electionsService } from '../services/electionsService'

import { optionalAuth } from '../middleware/auth'
import crypto from 'crypto'

const router = Router()

router.get('/active', optionalAuth, async (req, res) => {
  const emailHash = req.user?.email 
    ? crypto.createHash('sha256').update(req.user.email.toLowerCase()).digest('hex')
    : undefined

  const elections = await electionsService.listActive({
    id: req.user?.id || 'GUEST',
    role: req.user?.role || 'GUEST',
    emailHash
  })
  res.json(elections)
})

router.get('/:id', async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const election = await electionsService.getById(id)
  if (!election) return res.status(404).json({ error: 'NOT_FOUND' })
  res.json(election)
})

export { router as electionsRouter }

