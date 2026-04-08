import { create } from 'zustand'

type VoteState = {
  selectedCandidateId: string | null
  setSelectedCandidateId: (id: string | null) => void
}

export const useVoteStore = create<VoteState>((set) => ({
  selectedCandidateId: null,
  setSelectedCandidateId: (id) => set({ selectedCandidateId: id }),
}))

