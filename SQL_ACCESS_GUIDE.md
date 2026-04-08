# Direct SQL Access Guide (Cryptographic Verification)

This guide provides step-by-step instructions for connecting directly to the ChainVote database engine to perform manual cryptographic audits.

## 1. Local Development (SQLite)

Since local development uses SQLite, the database is stored in a single file: `backend/prisma/dev.db`.

### Option A: Using a GUI (Recommended)
1.  **Download a client**: Install [DBeaver](https://dbeaver.io/) (free) or [TablePlus](https://tableplus.com/).
2.  **Create a New Connection**: Choose **SQLite**.
3.  **Path to Database**: Browse to `c:\Users\admin\chainvote\backend\prisma\dev.db`.
4.  **Connect**: You can now run the queries listed in `DATABASE.md`.

### Option B: VS Code Extension
1.  Search the VS Code Marketplace for **"SQLite Viewer"** or **"SQLTools"**.
2.  Open the `dev.db` file directly in VS Code to browse tables and run queries.

---

## 2. Production (PostgreSQL on Railway)

Production uses a high-integrity PostgreSQL instance with `pgcrypto` triggers.

### Step 1: Get your Connection String
1.  Log in to your [Railway Dashboard](https://railway.app/).
2.  Select your `chainvote` project.
3.  Click on the **PostgreSQL** service.
4.  Go to the **Variables** or **Connect** tab.
5.  Copy the `DATABASE_URL` (starts with `postgresql://`).

### Step 2: Connect via CLI (`psql`)
If you have `psql` installed, run:
```bash
psql "YOUR_DATABASE_URL_HERE"
```

### Step 3: Connect via GUI
1.  In DBeaver/TablePlus, create a new **PostgreSQL** connection.
2.  Choose **URL** as the connection type and paste your `DATABASE_URL`.
3.  Test connection and connect.

---

## 3. Running Verification Queries

Once connected, you can verify the "immutability" of the chain.

### Check for Tampering (PostgreSQL Production)
The production database has a pre-built view that detects if any row has been modified outside the application logic.
```sql
SELECT * FROM chain_integrity;
```
*If `chain_intact` is `FALSE`, the election has been compromised.*

### Manual Hash Verification (Local & Production)
To see how votes are linked:
```sql
SELECT timestamp, voterHash, prevHash, voteHash 
FROM "Vote" 
ORDER BY timestamp ASC;
```

---

> [!TIP]
> **Why use Direct SQL?**
> While Prisma Studio is great for editing data, a Direct SQL connection allows you to use the full power of the database engine (like `pgcrypto` functions or complex joins) to verify that the cryptographic chain remains unbroken.
