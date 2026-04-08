import dotenv from 'dotenv'
import path from 'path'
import { emailService } from '../src/services/emailService'

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') })

async function runTest() {
  console.log("--- Starting Email Service Test ---")
  console.log("BREVO_API_KEY:", process.env.BREVO_API_KEY ? "PRESENT" : "MISSING")
  console.log("SMTP_USER:", process.env.SMTP_USER)
  
  const testEmail = "test@example.com"
  
  console.log("\n1. Testing Welcome Email...")
  const welcomeResult = await emailService.sendWelcomeEmail(testEmail, "VOTER")
  console.log("Welcome Result:", welcomeResult || "Delivered (Brevo)")

  console.log("\n2. Testing OTP Email...")
  const otpResult = await emailService.sendOTPEmail(testEmail, "123456")
  console.log("OTP Result:", otpResult || "Delivered (Brevo)")

  console.log("\n--- Test Complete ---")
}

runTest().catch(console.error)
