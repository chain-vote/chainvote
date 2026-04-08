import type { Server } from 'socket.io'

export function initSocket(io: Server) {
  io.on('connection', (socket) => {
    socket.on('join:election', (electionId: string) => {
      socket.join(`election:${electionId}`)
    })

    socket.on('leave:election', (electionId: string) => {
      socket.leave(`election:${electionId}`)
    })
  })
}

