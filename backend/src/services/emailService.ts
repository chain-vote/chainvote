import { OAuth2Client } from 'google-auth-library'
import nodemailer from 'nodemailer'
import * as SibApiV3Sdk from 'sib-api-v3-sdk'

export const emailService = {
  async sendWelcomeEmail(to: string, role: string): Promise<string | undefined> {
    console.log(`[ChainVote:Welcome] Initiating Welcome Ritual for ${to} (${role})...`)
    const subject = "Welcome to the ChainVote Ritual"
    const content = `
      <div style="font-family: serif; color: #1a1a1a; padding: 20px; border: 1px solid #d4af37; background: #fffcf0;">
        <h2 style="color: #d4af37;">Welcome, ${role}</h2>
        <p>Your identity has been forged in the crucible of the blockchain.</p>
        <p>You are now part of the decentralized governance ritual. May your choices be wise and your hashes be immutable.</p>
        <p style="font-size: 10px; color: #ash; margin-top: 20px;">Relay: ChainVote Global</p>
      </div>`
    
    return this.sendEmail(to, subject, content, "Welcome Ritual")
  },

  async sendOTPEmail(to: string, otp: string): Promise<string | undefined> {
    console.log(`[ChainVote:OTP] Initiating OTP Ritual for ${to}. Context: Security Verification...`)
    const subject = "Your ChainVote Security Ritual OTP"
    const content = `
      <div style="font-family: serif; color: #1a1a1a; padding: 20px; border: 1px solid #d4af37; background: #fffcf0;">
        <h2 style="color: #d4af37;">ChainVote Ritual OTP</h2>
        <p>Your cryptographic essence is required. Use the following code to seal your action:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ff4500; margin: 20px 0;">${otp}</div>
        <p style="font-size: 10px; color: #ash; margin-top: 20px;">This code will expire in 10 minutes.</p>
      </div>`

    return this.sendEmail(to, subject, content, "OTP Ritual")
  },

  async sendPasswordResetEmail(to: string, otp: string): Promise<string | undefined> {
    console.log(`[ChainVote:PasswordReset] Initiating Password Reset for ${to}...`)
    const subject = "ChainVote: Forget Password System Spell"
    const content = `
      <div style="font-family: serif; color: #1a1a1a; padding: 20px; border: 1px solid #d4af37; background: #fffcf0;">
        <h2 style="color: #d4af37;">ChainVote System Spell</h2>
        <p>A request to reforge your secret key was initiated. Enter this system spell to prove your identity:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ff4500; margin: 20px 0;">${otp}</div>
        <p style="font-size: 10px; color: #ash; margin-top: 20px;">This spell will expire in 10 minutes.</p>
      </div>`
    return this.sendEmail(to, subject, content, "Password Reset Ritual")
  },

  async sendEmail(to: string, subject: string, htmlContent: string, context: string): Promise<string | undefined> {
    const smtpHost = process.env.BREVO_SMTP_HOST
    const smtpPort = parseInt(process.env.BREVO_SMTP_PORT || '587', 10)
    const smtpUser = process.env.BREVO_SMTP_USER
    const smtpPass = process.env.BREVO_SMTP_PASS
    const senderEmail = process.env.SMTP_USER || "ritual@chainvote.local"

    // 1. Primary Attempt: Brevo SMTP Relay
    if (smtpHost && smtpUser && smtpPass) {
      try {
        console.log(`[ChainVote:Email] Attempting Brevo SMTP delivery for ${context}...`)
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465, // Use secure for 465, otherwise false for 587
          auth: { user: smtpUser, pass: smtpPass },
        })

        const info = await transporter.sendMail({
          from: `"ChainVote Ritual" <${senderEmail}>`,
          to,
          subject,
          html: htmlContent,
        })

        console.log(`[ChainVote:Email] Brevo SMTP SUCCESS (${context}). messageId: ${info.messageId}`)
        return undefined
      } catch (err: any) {
        console.error(`[ChainVote:Email] Brevo SMTP FAILED (${context}):`, err?.message || err)
        // Fall through to Ethereal
      }
    } else {
      console.log(`[ChainVote:Email] Brevo SMTP credentials missing. Skipping Brevo.`)
    }

    // 2. Production Fallback: Ethereal Mail
    console.log(`[ChainVote:Email] Attempting Ethereal fallback for ${context}...`)
    try {
      const testAccount = await nodemailer.createTestAccount()
      const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      })

      const info = await transporter.sendMail({
        from: `"ChainVote Ethereal" <${senderEmail}>`,
        to,
        subject: `${subject} (Fallback)`,
        html: htmlContent,
      })

      const previewUrl = nodemailer.getTestMessageUrl(info) as string
      console.log(`[ChainVote:Email] Ethereal SUCCESS (${context}). link: ${previewUrl}`)
      return previewUrl
    } catch (err: any) {
      console.error(`[ChainVote:Email] Ethereal FAILED (${context}):`, err?.message || err)
      return undefined
    }
  }
}
