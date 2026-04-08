import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { createApp } from './app'
import { initSocket } from './socket'
import { ensureDemoElection } from './services/electionsService'

const app = createApp()
const httpServer = createServer(app)

export const io = new Server(httpServer, {
  cors: {
    origin: (origin, cb) => {
      const allowed = process.env.FRONTEND_URL
      if (!origin) return cb(null, true)
      if (allowed && origin === allowed) return cb(null, true)
      if (/^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true)
      return cb(new Error('CORS blocked'), false)
    },
    methods: ['GET', 'POST'],
  },
})

initSocket(io)

async function main() {
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

