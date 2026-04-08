-- CreateTable
CREATE TABLE "RankedVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voterHash" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "rankings" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voteHash" TEXT NOT NULL,
    "prevHash" TEXT,
    "isEarlyVote" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "RankedVote_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Delegation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "electionId" TEXT NOT NULL,
    "delegatorHash" TEXT NOT NULL,
    "delegateHash" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Delegation_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MerkleSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "electionId" TEXT NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL,
    "snapshotAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MerkleSnapshot_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ElectionRecall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "electionId" TEXT NOT NULL,
    "reason" TEXT,
    "recalledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ElectionRecall_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoterPassport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voterHash" TEXT NOT NULL,
    "electionCount" INTEGER NOT NULL DEFAULT 0,
    "firstVoteAt" DATETIME,
    "lastVoteAt" DATETIME,
    "sigilLevel" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "VoteVelocity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "electionId" TEXT NOT NULL,
    "vpm" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoteVelocity_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChainForkLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "electionId" TEXT NOT NULL,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedPrev" TEXT NOT NULL,
    "receivedPrev" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AuditChainLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operation" TEXT NOT NULL,
    "actorId" TEXT,
    "payload" TEXT,
    "hash" TEXT NOT NULL,
    "prevHash" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Election" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'LIVE',
    "votingMode" TEXT NOT NULL DEFAULT 'NORMAL',
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "merkleRoot" TEXT,
    "isWhitelistedOnly" BOOLEAN NOT NULL DEFAULT false,
    "quorumPercent" INTEGER,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "ringWindowMinutes" INTEGER NOT NULL DEFAULT 5,
    "atmosphereTheme" TEXT NOT NULL DEFAULT 'void',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Election" ("createdAt", "description", "endTime", "id", "isWhitelistedOnly", "merkleRoot", "startTime", "status", "title") SELECT "createdAt", "description", "endTime", "id", "isWhitelistedOnly", "merkleRoot", "startTime", "status", "title" FROM "Election";
DROP TABLE "Election";
ALTER TABLE "new_Election" RENAME TO "Election";
CREATE TABLE "new_Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voterHash" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voteHash" TEXT NOT NULL,
    "prevHash" TEXT,
    "merkleRoot" TEXT,
    "ringId" TEXT,
    "commitment" TEXT,
    "revealNonce" TEXT,
    "isEarlyVote" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Vote_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Vote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vote" ("candidateId", "electionId", "id", "merkleRoot", "prevHash", "timestamp", "voteHash", "voterHash") SELECT "candidateId", "electionId", "id", "merkleRoot", "prevHash", "timestamp", "voteHash", "voterHash" FROM "Vote";
DROP TABLE "Vote";
ALTER TABLE "new_Vote" RENAME TO "Vote";
CREATE UNIQUE INDEX "Vote_voterHash_electionId_key" ON "Vote"("voterHash", "electionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "RankedVote_voterHash_electionId_key" ON "RankedVote"("voterHash", "electionId");

-- CreateIndex
CREATE UNIQUE INDEX "Delegation_electionId_delegatorHash_key" ON "Delegation"("electionId", "delegatorHash");

-- CreateIndex
CREATE UNIQUE INDEX "ElectionRecall_electionId_key" ON "ElectionRecall"("electionId");

-- CreateIndex
CREATE UNIQUE INDEX "VoterPassport_voterHash_key" ON "VoterPassport"("voterHash");

-- CreateIndex
CREATE UNIQUE INDEX "VoteVelocity_electionId_key" ON "VoteVelocity"("electionId");
