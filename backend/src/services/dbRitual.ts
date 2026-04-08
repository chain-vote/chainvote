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
  v_hashes VARCHAR(64)[];
  v_next_hashes VARCHAR(64)[];
  v_count INT;
  i INT;
  v_result VARCHAR(64);
BEGIN
  -- Initial leaves: Fetch all vote hashes for the election, ordered by time
  SELECT array_agg("voteHash" ORDER BY timestamp)
    INTO v_hashes
    FROM "Vote"
   WHERE "electionId" = p_election_id::text;

  v_count := array_length(v_hashes, 1);
  
  -- Handle empty case
  IF v_count IS NULL OR v_count = 0 THEN
    RETURN NULL;
  END IF;

  -- Iteratively hash pairs until only the root remains
  WHILE v_count > 1 LOOP
    v_next_hashes := '{}';
    FOR i IN 1..v_count BY 2 LOOP
      IF i + 1 <= v_count THEN
        -- Pair up and hash
        v_next_hashes := array_append(v_next_hashes, encode(sha256((v_hashes[i] || v_hashes[i+1])::bytea), 'hex'));
      ELSE
        -- Odd leaf, carry it up to the next level
        v_next_hashes := array_append(v_next_hashes, v_hashes[i]);
      END IF;
    END LOOP;
    v_hashes := v_next_hashes;
    v_count := array_length(v_hashes, 1);
  END LOOP;

  v_result := v_hashes[1];

  -- Update the election record with the new root
  UPDATE "Election"
     SET "merkleRoot" = v_result
   WHERE id = p_election_id::text;

  RETURN v_result;
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

  console.log('[ChainVote:Ritual] Initializing PostgreSQL Bulletproof Rituals (Iterative Mode)...')
  
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
