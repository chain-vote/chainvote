# 🏛️ ChainVote: The Cryptographic Foundation

ChainVote is a sovereign electronic voting system designed to merge the immutability of shared ledgers with the privacy of the individual. This document explains the technical architecture, cryptographic rituals, and data structures that power the "Ancient High-Tech" node.

## 🛠️ Tech Stack: The Alchemical Ingredients

*   **Runtime**: Node.js (High-performance asynchronous gateway).
*   **Language**: TypeScript (Type-safe legislative contracts).
*   **Database**: SQLite via Prisma (Local dev) / PostgreSQL (Production ready).
*   **Security**: 
    - `bcryptjs`: Password hashing (Sealing user identities).
    - `jsonwebtoken`: Stateless authentication (The session key).
    - `zod`: Request validation (Protecting the ritual from malformed intents).

---

## 🔐 Cryptographic Rituals

### 1. Identify Hashing (The Voter Hash)
Each voter is identified by a unique `voterHash`. This is generated to ensure anonymity while maintaining a non-duplicable link to the election.
*   **Formula**: `SHA-256(userId || serverSalt || epoch)`
*   **Purpose**: Allows the system to verify a vote was cast without storing the email in the `Vote` table.

### 2. Ballot Sealing (The Vote Hash)
When a ballot is cast, it is cryptographically chained to the previous vote. This creates a "Legislative Chain" where tampering with one link invalidates the entire sequence.
*   **Formula**: `SHA-256(voterHash || candidateId || timestamp || prevHash)`
*   **Result**: If someone manually changes a `candidateId` in the database, the `voteHash` will no longer match the recalculated hash, and the chain will "break."

### 3. The Merkle Tree (The Sacred Hierarchy)
The Merkle Tree is a binary tree of hashes that summarizes all votes in an election into a single "Root."
*   **Structure**: 
    - **Leaves**: Hashes of individual votes.
    - **Nodes**: Hashes of the child nodes combined (`SHA-256(nodeL || nodeR)`).
    - **Root**: The final hash representing the state of the entire election.
*   **Utility**: Allows anyone to verify their vote is part of the count efficiently (`O(log N)` complexity) without downloading the entire database.

### 4. Zero-Knowledge Proofs (ZKP) - The Shrouding Ritual
The system manifests a "Simplified ZKP" during the vote casting process. This allows a voter to prove they possess a valid authorized identity without exposing their mortal email or direct user ID during the sequence.
*   **Proof Formula**: `HMAC-SHA256(electionId, HMAC-SHA256(serverSalt, userId))`
*   **Purpose**: Validates eligibility while ensuring pseudonymous participation in whitelisted ballots.

### 5. Sovereign Whitelisting
Elections can be restricted to "Authorized Souls." In this mode, the system stores only hashed versions of permitted emails.
*   **Storage**: `SHA-256(email.toLowerCase())`
*   **Verification**: During OTP summoning and ballot sealing, the system validates the requester's hashed email against the election's whitelist manifest.

### 6. High-Tech Time-Locks
To ensure maximum legislative integrity, election results and Merkle hierarchies are "Sealed in the Void" until the election's official `endTime`. 
*   **Enforcement**: Backend API routes for chain audit, Merkle structure, and results tabulation reject all queries if the current ritual has not yet concluded.

---

## 🌌 Glossary of the Void: The Cryptographic Grimoire

### Hashing (The Unalterable Signature)
A **Hash** is a digital fingerprint. We use the **SHA-256** ritual. No matter how large the scroll (data), the resulting signature is always 64 characters long.
- **Immutability**: Even a single character change in the input (e.g., changing a vote from "Candidate A" to "Candidate B") creates a completely different, unrecognizable hash.
- **One-Way**: You can create a hash from data, but you cannot "decrypt" a hash to find the original data.

### Merkle Roots (The Consolidator)
The **Merkle Root** is the single hash at the top of the tree. It represents the *entire* state of the election. If a single vote is tampered with, the Merkle Root changes, signalling a breach in the node's integrity.

### Nodes (The Crystallized Truth)
In our 3D visualization, each **Node** represents a point of data. **Leaf Nodes** are individual votes, while **Branch Nodes** are cryptographic combinations of their children. The **Root Node** is the pinnacle of the ritual.

---

## 📜 Database Schema: The Physical Nodes

| Entity | Description |
| :--- | :--- |
| **User** | Stores identity, hashed password, and current `actionOtp`. |
| **Election** | The parent node. Stores title, lifecycle, `isWhitelistedOnly` toggle, and `merkleRoot`. |
| **WhitelistedVoter** | Stores hashed emails associated with specific restricted elections. |
| **Candidate** | Options within a ballot. |
| **Vote** | The link in the chain. Stores the encrypted reference to the voter and the cryptographic seal. |
| **AuditLog** | Records all administrative "Purge" or "Architect" rituals for accountability. |

---

*ChainVote: Forging Truth in the Void.*
