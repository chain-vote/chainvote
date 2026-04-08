import { prisma } from '../db/prisma'

const POSTGRES_RITUAL_SQL = `
-- ChainVote PostgreSQL-only cryptographic integrity.
-- SPLIT --
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- SPLIT --
CREATE OR REPLACE FUNCTION chain_vote()
RETURNS TRIGGER AS $$
DECLARE
  prev VARCHAR(64);
BEGIN
  SELECT "voteHash"
    INTO prev
    FROM "Vote"
   WHERE "electionId" = NEW."electionId"
   ORDER BY timestamp DESC
   LIMIT 1;

  NEW."prevHash" := COALESCE(
    prev,
    encode(sha256('GENESIS'::bytea), 'hex')
  );

  NEW."voteHash" := encode(
    sha256((
      NEW."voterHash"      ||
      NEW."candidateId"    ||
      NEW.timestamp::text ||
      NEW."prevHash"
    )::bytea),
    'hex'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- SPLIT --
DROP TRIGGER IF EXISTS before_vote_insert ON "Vote";

-- SPLIT --
CREATE TRIGGER before_vote_insert
  BEFORE INSERT ON "Vote"
  FOR EACH ROW
  EXECUTE FUNCTION chain_vote();

-- SPLIT --
CREATE OR REPLACE FUNCTION audit_vote()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "AuditLog" (
    id, operation, "table", "recordId",
    "dbRole", timestamp
  ) VALUES (
    gen_random_uuid(),
    'INSERT_VOTE',
    'Vote',
    NEW.id,
    current_user,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- SPLIT --
DROP TRIGGER IF EXISTS after_vote_insert ON "Vote";

-- SPLIT --
CREATE TRIGGER after_vote_insert
  AFTER INSERT ON "Vote"
  FOR EACH ROW
  EXECUTE FUNCTION audit_vote();

-- SPLIT --
CREATE OR REPLACE FUNCTION compute_merkle_root(p_election_id UUID)
RETURNS VARCHAR(64) AS $$
DECLARE
  result VARCHAR(64);
BEGIN
  WITH RECURSIVE
  leaves AS (
    SELECT
      "voteHash" as node_hash,
      ROW_NUMBER() OVER (ORDER BY timestamp) - 1 AS pos
    FROM "Vote"
    WHERE "electionId" = p_election_id::text
  ),
  tree AS (
    SELECT node_hash, pos, 0 AS lvl
    FROM leaves
    UNION ALL
    SELECT
      encode(sha256((l.node_hash || r.node_hash)::bytea), 'hex'),
      l.pos / 2,
      l.lvl + 1
    FROM tree l
    JOIN tree r
      ON l.lvl = r.lvl
     AND l.pos % 2 = 0
     AND r.pos = l.pos + 1
  ),
  root AS (
    SELECT node_hash
    FROM tree
    ORDER BY lvl DESC, pos
    LIMIT 1
  )
  SELECT node_hash INTO result FROM root;

  UPDATE "Election"
     SET "merkleRoot" = result
   WHERE id = p_election_id::text;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- SPLIT --
DROP VIEW IF EXISTS chain_integrity;

-- SPLIT --
CREATE OR REPLACE VIEW chain_integrity AS
SELECT
  id,
  "voterHash",
  "candidateId",
  "electionId",
  timestamp,
  "voteHash",
  "prevHash",
  LAG("voteHash") OVER (
    PARTITION BY "electionId" ORDER BY timestamp
  ) AS actual_prev,
  "prevHash" = COALESCE(
    LAG("voteHash") OVER (
      PARTITION BY "electionId" ORDER BY timestamp
    ),
    encode(sha256('GENESIS'::bytea), 'hex')
  ) AS chain_intact
FROM "Vote";
`

export async function applyDatabaseRituals() {
  const dbUrl = process.env.DATABASE_URL || ''
  const isPostgres = dbUrl.startsWith('postgres') || dbUrl.startsWith('postgresql')
  
  if (!isPostgres) {
    console.log('[ChainVote:Ritual] Local SQLite detected. Skipping PostgreSQL rituals.')
    return
  }

  console.log('[ChainVote:Ritual] Initializing PostgreSQL Bulletproof Rituals...')
  
  try {
    const statements = POSTGRES_RITUAL_SQL
      .split('-- SPLIT --')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement)
      } catch (stmtErr: any) {
        if (statement.toLowerCase().includes('drop')) {
          console.log(`[ChainVote:Ritual] Cleanup skipped: ${stmtErr.message.split('\n')[0]}`)
        } else {
          console.error(`[ChainVote:Ritual] Block Execution Error: ${stmtErr.message}`)
          throw stmtErr
        }
      }
    }
    
    console.log('[ChainVote:Ritual] All PostgreSQL functions and triggers manifested successfully.')
    
  } catch (err: any) {
    console.error(`[ChainVote:Ritual] Manifestation failed: ${err.message}`)
  }
}
