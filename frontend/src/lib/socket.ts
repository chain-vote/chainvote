import { io } from 'socket.io-client'

export let WS_URL = import.meta.env.VITE_WS_URL as string

export const socket = io(WS_URL, {
  transports: ['websocket'],
  autoConnect: true,
})

export function updateSocketUrl(newUrl: string) {
  if (WS_URL !== newUrl) {
    WS_URL = newUrl
    // @ts-ignore - Socket.IO v4 TS definitions mark uri as readonly, but it is mutable
    socket.io.uri = newUrl
    if (socket.connected) {
      socket.disconnect()
    }
    socket.connect()
    console.log(`[ChainVote] WebSocket synchronized to ${newUrl}`)
  }
}

