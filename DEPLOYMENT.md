# ChainVote Deployment Guide

This guide covers deploying the full ChainVote full-stack application natively on Render.com with a managed PostgreSQL database.

## 1. Backend & Database Deployment (Render.com)

1. **Create a Managed PostgreSQL Database**
   - Go to [Render.com Dashboard](https://dashboard.render.com/) and click **New** -> **PostgreSQL**.
   - Input a name (e.g., `chainvote-db`), select your region, and choose the Free instance type.
   - Click **Create Database**.
   - Once provisioned, copy the **Internal Database URL** (if backend is on Render) or **External Database URL**.

2. **Deploy the Backend Server**
   - Click **New** -> **Web Service** on Render.
   - Connect your GitHub repository containing `chainvote`.
   - Configure the following fields:
     - **Name**: `chainvote-backend`
     - **Root Directory**: `backend`
     - **Environment**: Node
     - **Build Command**: `npm install && npx prisma generate && npx prisma db push`
     - **Start Command**: `npm run build && npm start`
   - Go to **Advanced** -> **Add Environment Variables** and add:
     ```env
     DATABASE_URL=postgresql://user:pass@host:5432/chainvote-db
     DB_PROVIDER=postgresql
     JWT_SECRET=your_super_secret_jwt_key
     SERVER_SALT=your_random_cryptographic_salt
     SMTP_HOST=smtp.gmail.com
     SMTP_USER=your_email@gmail.com
     SMTP_PASS=your_gmail_app_password
     FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
     ```
   - Click **Create Web Service**. Render will build and deploy the backend. Copy its public URL (e.g., `https://chainvote-backend.onrender.com`).

3. **Run Database Migrations & Seeds**
   - In the Render Web Service dashboard, go to the **Shell** tab.
   - Execute the migration: `npx prisma db push`
   - Execute the initial seeder: `npx tsx prisma/seed.ts`
   *(This ensures your PostgreSQL has the correct schemas, triggers, and starter data to verify the engine.)*

## 2. Frontend Deployment (Render.com)

1. **Deploying the React/Vite Frontend**
   - Go back to Render Dashboard, click **New** -> **Static Site** (or Web Service if you prefer Node served frontend).
   - Connect the same repository.
   - Configure the following fields:
     - **Name**: `chainvote-frontend`
     - **Root Directory**: `frontend`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `dist`
   - Under **Environment Variables**, add:
     ```env
     VITE_API_URL=https://your-backend-render-url.onrender.com
     VITE_WS_URL=wss://your-backend-render-url.onrender.com
     ```
   - Click **Create Static Site**.
   - Go back to your Backend Web Service and set the `FRONTEND_URL` variable to this newly generated Render frontend URL, and redeploy the backend once so CORS policies take effect.

## 3. Verify the Deployment

1. Visit your Render Static Site URL. The 3D Merkle tree and Void aesthetics should load flawlessly.
2. Select Election Commissioner. Login using your seeded credentials (`admin_seed@chainvote.local` / `adminseed`).
3. Click on **Vault Query Engine (SQL)** to test querying your live PostgreSQL instance.
4. Try to reset your password or vote to test Brevo SMTP functionalities.
