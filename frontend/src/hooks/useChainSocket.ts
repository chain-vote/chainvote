import { useEffect } from 'react'
import { socket } from '../lib/socket'
import { useChainStore } from '../store/chainStore'

export function useChainSocket(electionId: string | null) {
  const addVoteEvent = useChainStore((s) => s.addVoteEvent)
  const updateMerkleRoot = useChainStore((s) => s.updateMerkleRoot)
  const setTamperedVoteId = useChainStore((s) => s.setTamperedVoteId)

  useEffect(() => {
    if (!electionId) return

    socket.emit('join:election', electionId)

    socket.on('vote:cast', (data) => {
      addVoteEvent(data)
      if (data?.merkleRoot) updateMerkleRoot(data.merkleRoot)
    })

    socket.on('chain:tampered', (data) => {
      setTamperedVoteId(data.tamperedVoteId)
    })

    return () => {
      socket.emit('leave:election', electionId)
      socket.off('vote:cast')
      socket.off('chain:tampered')
    }
  }, [electionId, addVoteEvent, updateMerkleRoot, setTamperedVoteId])
}

