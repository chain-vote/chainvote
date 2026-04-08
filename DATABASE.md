# ChainVote Database Administration & Access

This guide explains how to connect to the database, verify chain integrity manually, and query the cryptographic data.

## Accessing the Database

### Method 1: Prisma Studio (Recommended for Visual Editing)
Prisma Studio provides a clean UI to view your tables, records, and relationships.
1. Open a terminal in the `backend/` directory.
2. Run `npx prisma studio`.
3. Open `http://localhost:5555` in your browser.

*(If you are connected to Railway production, `npx prisma studio` will connect to your remote PostgreSQL instance as long as your `.env` contains the production `DATABASE_URL`.)*

### Method 2: Direct SQL Connection (For Cryptographic Verification)
You can connect using any PostgreSQL client like DBeaver, TablePlus, or `psql` using the `DATABASE_URL` provided by Railway (or sqlite3 for local development).

#### Connecting Locally (SQLite)
If you are developing locally, your `schema.prisma` generates a `dev.db` file located in `backend/prisma/dev.db`.
1. Ensure you have installed [DB Browser for SQLite](https://sqlitebrowser.org/) or the **SQLite Viewer** VS Code Extension.
2. Open the file `chainvote/backend/prisma/dev.db`.
3. You will immediately see the tables. Click **Execute SQL** to write standard SQL queries just like any engine.
4. We have populated the database with a pre-seeded dummy election and 5 dummy voters + 1 admin using our database seeder script.
5. All queries will yield immediate responses from this seeded data.

### Method 3: Internal Engine (Commissioner Dashboard)
For quick validation, you can use the built-in **Vault Query Engine**. 
Log into the interface using the provided seed identity `admin_seed@chainvote.local` (password: `adminseed`), and select the "Vault Query Engine" from the Admin Dashboard. The system will proxy your raw SQL directly into the backend's active DB.

## Important SQL Queries

Once connected via SQL, you can run these queries to examine the cryptographic chain.

### 1. View the Vote Chain for an Election
```sql
SELECT 
  timestamp, 
  voterHash, 
  prevHash, 
  voteHash 
FROM "Vote" 
WHERE "electionId" = 'YOUR_ELECTION_UUID'
ORDER BY timestamp ASC;
```

### 2. Verify Chain Integrity (PostgreSQL Only)
If you are running in production on PostgreSQL, there is a built-in View called `chain_integrity` that automatically detects tampered votes.
```sql
SELECT 
  id, 
  vote_hash, 
  prev_hash, 
  actual_prev, 
  chain_intact 
FROM chain_integrity 
WHERE election_id = 'YOUR_ELECTION_UUID';
```
*If a database administrator alters a vote, `chain_intact` will instantly evaluate to `FALSE` for that vote and all subsequent votes.*

### 3. Check Audit Logs
The PostgreSQL triggers automatically log all inserts and DDL changes.
```sql
SELECT 
  timestamp, 
  operation, 
  "table", 
  detail 
FROM audit_log 
ORDER BY timestamp DESC;
```

## How the Cryptography Works

**Local SQLite vs Production PostgreSQL**
- In **SQLite** (local development), hashes are computed in the Node.js service layer (`voteService.ts`).
- In **PostgreSQL** (production), votes are inserted with placeholder hashes. A `BEFORE INSERT` trigger evaluates the row data, fetches the previous hash, and computes the new `vote_hash` directly inside the database engine using `pgcrypto`. The application layer cannot forge or override this hash. Duplicate voting is prevented structurally by a `@@unique([voterHash, electionId])` constraint in the schema.
