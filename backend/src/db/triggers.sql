-- ChainVote PostgreSQL-only cryptographic integrity.
-- Applied via migration in production; ignored for SQLite local dev.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION chain_vote()
RETURNS TRIGGER AS $$
DECLARE
  prev VARCHAR(64);
BEGIN
  SELECT vote_hash
    INTO prev
    FROM votes
   WHERE election_id = NEW.election_id
   ORDER BY timestamp DESC
   LIMIT 1;

  NEW.prev_hash := COALESCE(
    prev,
    encode(sha256('GENESIS'::bytea), 'hex')
  );

  NEW.vote_hash := encode(
    sha256((
      NEW.voter_hash      ||
      NEW.candidate_id    ||
      NEW.timestamp::text ||
      NEW.prev_hash
    )::bytea),
    'hex'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_vote_insert ON votes;
CREATE TRIGGER before_vote_insert
  BEFORE INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION chain_vote();

CREATE OR REPLACE FUNCTION audit_vote()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    id, operation, "table", record_id,
    db_role, detail, timestamp
  ) VALUES (
    gen_random_uuid(),
    'INSERT_VOTE',
    'votes',
    NEW.id,
    current_user,
    (json_build_object(
      'vote_hash',  NEW.vote_hash,
      'prev_hash',  NEW.prev_hash,
      'election_id',NEW.election_id
    ))::text,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_vote_insert ON votes;
CREATE TRIGGER after_vote_insert
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION audit_vote();

CREATE OR REPLACE FUNCTION compute_merkle_root(p_election_id UUID)
RETURNS VARCHAR(64) AS $$
DECLARE
  result VARCHAR(64);
BEGIN
  WITH RECURSIVE
  leaves AS (
    SELECT
      vote_hash,
      ROW_NUMBER() OVER (ORDER BY timestamp) - 1 AS pos
    FROM votes
    WHERE election_id = p_election_id
  ),
  tree AS (
    SELECT vote_hash AS node_hash, pos, 0 AS lvl
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

  UPDATE elections
     SET merkle_root = result
   WHERE id = p_election_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW chain_integrity AS
SELECT
  id,
  voter_hash,
  candidate_id,
  election_id,
  timestamp,
  vote_hash,
  prev_hash,
  LAG(vote_hash) OVER (
    PARTITION BY election_id ORDER BY timestamp
  ) AS actual_prev,
  prev_hash = COALESCE(
    LAG(vote_hash) OVER (
      PARTITION BY election_id ORDER BY timestamp
    ),
    encode(sha256('GENESIS'::bytea), 'hex')
  ) AS chain_intact
FROM votes;

