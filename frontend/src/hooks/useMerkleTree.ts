import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useChainStore } from '../store/chainStore'

export function useMerkleTree(electionId: string | null) {
  const setTreeStructure = useChainStore((s) => s.setTreeStructure)
  const setIntegrity = useChainStore((s) => s.setIntegrity)
  const updateMerkleRoot = useChainStore((s) => s.updateMerkleRoot)

  const treeQuery = useQuery({
    queryKey: ['merkle', electionId],
    enabled: !!electionId,
    queryFn: () => api.getMerkleTree(electionId!),
    refetchInterval: 1200,
  })

  const integrityQuery = useQuery({
    queryKey: ['integrity', electionId],
    enabled: !!electionId,
    queryFn: () => api.verifyChain(electionId!),
    refetchInterval: 900,
  })

  useEffect(() => {
    if (!treeQuery.data) return
    setTreeStructure(treeQuery.data)
    const root = treeQuery.data?.[treeQuery.data.length - 1]?.[0]?.hash
    if (root) updateMerkleRoot(root)
  }, [treeQuery.data, setTreeStructure, updateMerkleRoot])

  useEffect(() => {
    if (!integrityQuery.data) return
    const map: Record<string, boolean> = {}
    for (const row of integrityQuery.data) {
      if (row?.vote_hash) map[row.vote_hash] = !!row.chain_intact
      if (row?.voteHash) map[row.voteHash] = !!row.chain_intact
    }
    setIntegrity(map)
  }, [integrityQuery.data, setIntegrity])
}

