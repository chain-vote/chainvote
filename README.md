<div align="center">
  <img src="./frontend/public/favicon.ico" alt="ChainVote Sigil" width="80" height="80" />
  <h1>ChainVote 🌌</h1>
  <p><strong>The World's Most Secure Electronic Voting System</strong></p>
</div>

ChainVote is a completely reimagined electronic voting architecture. It explicitly rejects standard SaaS aesthetics in favor of a "Kamar-Taj x Cyberpunk" visualization protocol—combining **3D Yggdrasil Merkle Trees**, **Choral Polyphonic Synths**, **Standalone SVG Certificates**, and **Holographic Passports** with rigorous O(log n) cryptographic verification.

> *"The ledger is perfect. The chain is immutable. The ritual is complete."*

---

## 📜 The Master Ledger

ChainVote boasts 30 massive architectural and cinematic features spanning:
- **Core Ledger Mechanics:** Hash chaining, ZKP abstraction, and Time-Locked APIs.
- **Identity & Privacy:** 10-Min OTPs, Anonymous Ring-IDs, and Generative Voter Sigils.
- **Visual Theatricality:** Edge-to-edge Void themes, Runic Typewriters, and WebAudio data sonification.

**👉 [Read the comprehensive breakdown in the Master Ledger (chainvote.md)](./chainvote.md)**

---

## 🛠️ Local Development (SQLite)

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

*Backend defaults to `http://localhost:4000`, frontend to `http://localhost:5173`.*
