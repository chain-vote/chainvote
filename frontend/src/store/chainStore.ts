import { create } from 'zustand'

export type MerkleLevel = { hash: string; id?: string }[]

type ChainState = {
  electionId: string | null
  merkleRoot: string
  treeStructure: MerkleLevel[]
  integrityMap: Record<string, boolean>
  newVoteHash: string | null
  tamperedVoteId: string | null
  setElectionId: (electionId: string | null) => void
  setTreeStructure: (levels: MerkleLevel[]) => void
  setIntegrity: (m: Record<string, boolean>) => void
  updateMerkleRoot: (root: string) => void
  addVoteEvent: (v: { voteHash: string; merkleRoot: string; voteId?: string }) => void
  setTamperedVoteId: (id: string) => void
}

export const useChainStore = create<ChainState>((set) => ({
  electionId: null,
  merkleRoot: '',
  treeStructure: [],
  integrityMap: {},
  newVoteHash: null,
  tamperedVoteId: null,
  setElectionId: (electionId) => set({ electionId }),
  setTreeStructure: (levels) => set({ treeStructure: levels }),
  setIntegrity: (m) => set({ integrityMap: m }),
  updateMerkleRoot: (root) => set({ merkleRoot: root }),
  addVoteEvent: (v) =>
    set({
      newVoteHash: v.voteHash,
      merkleRoot: v.merkleRoot,
    }),
  setTamperedVoteId: (id) => set({ tamperedVoteId: id }),
}))

