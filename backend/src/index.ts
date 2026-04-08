import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { createApp } from './app'
import { initSocket } from './socket'
import { ensureDemoElection } from './services/electionsService'
import { applyDatabaseRituals } from './services/dbRitual'

const app = createApp()
const httpServer = createServer(app)

export const io = new Server(httpServer, {
  cors: {
    origin: (origin, cb) => {
      // Allowing all origins dynamically
      return cb(null, true)
    },
    methods: ['GET', 'POST'],
  },
})

initSocket(io)

function checkCriticalEnv() {
  const critical = [
    'DATABASE_URL',
    'JWT_SECRET',
    'FRONTEND_URL'
  ]
  const smtp = ['BREVO_SMTP_HOST', 'SMTP_HOST']
  
  console.log('[ChainVote:Diagnostics] Running Manifest Verification...')
  
  critical.forEach(ext => {
    if (!process.env[ext]) {
      console.warn(`[ChainVote:Ritual-Warning] Missing critical component: ${ext}. Some features may remain dormant.`)
    }
  })

  const hasSmtp = smtp.some(s => !!process.env[s])
  if (!hasSmtp) {
    console.warn('[ChainVote:Ritual-Warning] SMTP Relay not found. OTPs will be spectral (Ethereal only).')
  }

  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.includes('localhost')) {
    console.error('[ChainVote:Fatal] PRODUCTION RITUAL ATTEMPTED WITH LOCAL DATABASE. Ritual aborted.')
    process.exit(1)
  }
}

async function main() {
  checkCriticalEnv()
  await applyDatabaseRituals()
  await ensureDemoElection()

  const startServer = (port: number) => {
    httpServer.listen(port, '0.0.0.0', () => {
      // eslint-disable-next-line no-console
      console.log(`[ChainVote:Core] Backend Manifested on Port ${port}`)
    }).on('error', (err: any) => {
      console.error(`[ChainVote:Fatal] Port ${port} is occupied by a ghost process. Terminate it first!`)
      process.exit(1)
    })
  }

  const initialPort = parseInt(process.env.PORT || '4000', 10)
  startServer(initialPort)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

