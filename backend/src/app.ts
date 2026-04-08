import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { authRouter } from './routes/auth'
import { electionsRouter } from './routes/elections'
import { votesRouter } from './routes/votes'
import { auditRouter } from './routes/audit'
import { adminRouter } from './routes/admin'
import { ritualLogRouter } from './routes/ritual-log'

export function createApp() {
  const app = express()

  app.use((req, res, next) => {
    console.log(`[ChainVote:Request] ${req.method} ${req.url}`)
    next()
  })

  app.use(helmet())
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allowing all origins dynamically to prevent strict origin rendering bugs
        return cb(null, true)
      },
      credentials: true,
    }),
  )
  app.use(express.json())
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  )

  app.get('/healthz', (_req, res) => res.json({ ok: true }))

  app.use('/api/auth', authRouter)
  app.use('/api/elections', electionsRouter)
  app.use('/api/votes', votesRouter)
  app.use('/api/audit', auditRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/ritual-log', ritualLogRouter)

  return app
}

