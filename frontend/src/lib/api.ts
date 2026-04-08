import { useAuthStore } from '../store/authStore'
import { updateSocketUrl } from './socket'

const ORIGINAL_API_URL = import.meta.env.VITE_API_URL as string
let API_URL = ORIGINAL_API_URL
let isApiUrlInitialized = false

async function resolveApiUrl() {
  if (isApiUrlInitialized) return API_URL
  if (ORIGINAL_API_URL.includes('localhost')) {
    const baseMatch = ORIGINAL_API_URL.match(/:(\d+)$/)
    const basePort = baseMatch ? parseInt(baseMatch[1], 10) : 4000

    for (let port = basePort; port < basePort + 6; port++) {
      try {
        const testUrl = ORIGINAL_API_URL.replace(/:\d+$/, `:${port}`)
        const res = await fetch(`${testUrl}/api/elections/active`)
        if (res.ok) {
          API_URL = testUrl
          isApiUrlInitialized = true
          console.log(`[ChainVote] Linked to backend on ${API_URL}`)
          
          const autoWsUrl = testUrl.replace('http', 'ws')
          updateSocketUrl(autoWsUrl)

          return API_URL
        }
      } catch (e) {
        // Port closed or blocked, try next
      }
    }
  }
  isApiUrlInitialized = true
  return API_URL
}

type JsonInit = Omit<RequestInit, 'headers'> & { headers?: Record<string, string> }

async function jsonFetch<T>(path: string, init?: JsonInit): Promise<T> {
  const resolvedUrl = await resolveApiUrl()
  const res = await fetch(`${resolvedUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    let message = `Ritual Interrupted (Status ${res.status})`
    try {
      const data = await res.json()
      message = data.error || data.message || message
    } catch (e) {
      const text = await res.text()
      message = text || message
    }
    throw new Error(message)
  }
  return (await res.json()) as T
}

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token
  if (!token) return {}
  return { authorization: `Bearer ${token}` }
}

export const api = {
  async register(params: any) {
    return jsonFetch<{ success: true; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },
  async login(params: { email: string; password: string; role: 'VOTER' | 'ADMIN' }) {
    return jsonFetch<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },
  async requestActionOtp() {
    return jsonFetch<{ success: true; message: string; previewUrl?: string }>('/api/auth/request-action-otp', {
      method: 'POST',
      headers: authHeaders(),
    })
  },
  async requestPasswordReset(email: string) {
    return jsonFetch<{ success: boolean; role?: string; reason?: string; previewUrl?: string }>('/api/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
  async verifyResetOtp(params: { email: string; otp: string }) {
    return jsonFetch<{ success: boolean }>('/api/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },
  async oauthLogin(params: { idToken: string; role: 'VOTER' | 'ADMIN' }) {
    return jsonFetch<{ token: string; user: any }>('/api/auth/oauth', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },
  async resetPassword(params: { email: string; otp: string; newPassword: string }) {
    return jsonFetch<{ success: true; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },
  async createElection(params: any) {
    return jsonFetch<{ success: true; election: any }>('/api/admin/elections/create', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params),
    })
  },
  async publishElection(id: string, params: { otp: string; masterCode: string }) {
    return jsonFetch<{ success: true }>(`/api/admin/elections/${id}/publish`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params),
    })
  },
  async recallElection(id: string, params: { otp: string; masterCode: string; reason?: string }) {
    return jsonFetch<{ success: true; message: string }>(`/api/admin/elections/${id}/recall`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params),
    })
  },
  async getFederationManifest(id: string) {
    return jsonFetch<any>(`/api/admin/elections/${id}/federation-manifest`, { headers: authHeaders() })
  },
  async checkQuorum(id: string) {
    return jsonFetch<any>(`/api/admin/elections/${id}/check-quorum`, {
      method: 'POST',
      headers: authHeaders(),
    })
  },
  async getAuditChain() {
    return jsonFetch<any>('/api/votes/audit-chain', { headers: authHeaders() })
  },
  async deleteElection(id: string, params: { otp: string; masterCode: string }) {
    return jsonFetch<{ success: true; message: string }>(`/api/admin/elections/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify(params),
    })
  },
  async getActiveElections() {
    return jsonFetch<any[]>('/api/elections/active')
  },
  async getElection(id: string) {
    return jsonFetch<any>(`/api/elections/${id}`)
  },
  async castVote(params: { electionId: string; candidateId: string; otp: string }) {
    return jsonFetch<{
      success: true
      voteHash: string
      prevHash: string
      merkleRoot: string
      position: number
      delegationsCarried?: number
    }>('/api/votes/cast', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params),
    })
  },
  async castRankedVote(params: { electionId: string; otp: string; rankings: { candidateId: string; rank: number }[] }) {
    return jsonFetch<{ success: true; voteHash: string; prevHash: string }>('/api/votes/cast-ranked', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params),
    })
  },
  async getRankedTally(electionId: string) {
    return jsonFetch<any>(`/api/votes/ranked-tally/${electionId}`)
  },
  async delegateVote(params: { electionId: string; delegateEmail: string; otp: string }) {
    return jsonFetch<{ success: true; delegation: any }>('/api/votes/delegate', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params),
    })
  },
  async revokeDelegate(electionId: string) {
    return jsonFetch<{ success: true }>(`/api/votes/delegate/${electionId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  },
  async verifyReceipt(voteHash: string) {
    return jsonFetch<any>(`/api/votes/verify-receipt/${voteHash}`)
  },
  async getPassport() {
    return jsonFetch<any>('/api/votes/passport', { headers: authHeaders() })
  },
  async getVelocity(electionId: string) {
    return jsonFetch<{ vpm: number; updatedAt: string }>(`/api/votes/velocity/${electionId}`)
  },
  async getSnapshots(electionId: string) {
    return jsonFetch<any[]>(`/api/votes/snapshots/${electionId}`)
  },
  async getChain(electionId: string) {
    return jsonFetch<
      { id: string; voterHash: string; candidateId: string; timestamp: string; voteHash: string; prevHash: string }[]
    >(`/api/votes/chain/${electionId}`)
  },
  async verifyChain(electionId: string) {
    return jsonFetch<any[]>(`/api/votes/verify/${electionId}`)
  },
  async getMerkleTree(electionId: string) {
    return jsonFetch<any[]>(`/api/votes/merkle/${electionId}`)
  },
  async tamperDemo(params: { voteId: string; electionId: string; newCandidateId?: string }) {
    return jsonFetch<{ success: true; message: string }>('/api/admin/tamper-demo', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params),
    })
  },
  async executeSQL(params: { query: string; masterCode?: string; otp?: string }) {
    return jsonFetch<{ success: true; data: any; count?: number; message?: string }>('/api/admin/db-engine/execute', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(params),
    })
  },
  async getSystemSettings() {
    return jsonFetch<any>('/api/admin/system-settings', { headers: authHeaders() })
  },
  async updateSystemSettings(settings: {
    tallyingMode: string;
    validationMode: string;
    cryptoMode: string;
    identityMode: string;
  }) {
    return jsonFetch<{ success: true; settings: any }>('/api/admin/system-settings', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(settings),
    })
  },
  async getTables() {
    return jsonFetch<{ success: true; tables: string[] }>('/api/admin/db-engine/tables', { headers: authHeaders() })
  },
}
