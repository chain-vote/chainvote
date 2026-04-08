# Brevo (Sendinblue) Configuration Guide for ChainVote

This guide explains how to set up Brevo to ensure reliable email delivery for your ChainVote deployment.

## 1. Create a Brevo Account
If you haven't already, sign up at [brevo.com](https://www.brevo.com/).

## 2. Get Your API Key
1. Click on your profile name at the top-right and select **SMTP & API**.
2. Go to the **API Keys** tab.
3. Click **Generate a new API key**.
4. Give it a name (e.g., "ChainVote Prod") and copy the key.
5. Add it to your backend `.env` file:
   ```env
   BREVO_API_KEY="your_api_key_here"
   ```

## 3. Verify Your Sender (CRITICAL)
Brevo will only send emails from addresses that you have verified.
1. Go to **Senders & IPs** in the left sidebar (or under your profile menu).
2. Click on the **Senders** tab.
3. Click **Add a sender**.
4. Enter the email address you want to use (this MUST match the `SMTP_USER` in your `.env`).
   - For your project, this appears to be: `tanaytrivedi24@gmail.com`
5. Check your inbox for a verification email from Brevo and click the link to confirm.

## 4. Transactional Quota & Activation
- If your account is new, Brevo might have a daily limit (usually 300 emails/day) for the free tier.
- **IMPORTANT**: You must request "Transactional" activation. If you see an error like `Your SMTP account is not yet activated`, you need to contact Brevo support or follow their dashboard prompts to activate transactional sending. This is a common security step for new accounts.
- Ensure your account is not "suspended" or "under review".

## 5. Summary of .env Requirements
Ensure these variables are correctly set in `c:\Users\admin\chainvote\backend\.env`:

```env
SMTP_USER="tanaytrivedi24@gmail.com"  # Must be a Verified Sender in Brevo
BREVO_API_KEY="xkeysib-..."           # Your V3 API Key
```

## How to Test
1. Start your backend: `npm run dev`
2. Perform a registration or request an OTP in the app.
3. Check the backend console. You should see:
   - `[ChainVote:Email] Attempting Brevo delivery...`
   - `[ChainVote:Email] Brevo SUCCESS ...`
4. If it says `Brevo FAILED`, check the error message in the console. It often tells you exactly what is wrong (e.g., "Invalid API key" or "Sender not verified").
