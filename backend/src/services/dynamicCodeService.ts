import { prisma } from '../db/prisma'
import crypto from 'crypto'

export const dynamicCodeService = {
  /**
   * Generates a 3-character random alphanumeric code.
   * Stores it in the database with a 5-minute expiry.
   */
  async generateCode(userId: string) {
    // Generate a 3-char code: A-Z, 0-9
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing O, 0, I, 1
    let code = ''
    for (let i = 0; i < 3; i++) {
       code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    const entry = await prisma.dynamicCode.create({
      data: {
        code,
        userId,
        expiresAt,
        isUsed: false
      }
    })

    return { id: entry.id, code }
  },

  /**
   * Verifies if a code is valid for a specific user and not expired.
   * "Self-destructs" the code by marking it as used.
   */
  async verifyAndConsume(userId: string, code: string) {
    const entry = await prisma.dynamicCode.findFirst({
      where: {
        userId,
        code: code.toUpperCase(),
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!entry) return false

    // Consume the code
    await prisma.dynamicCode.update({
      where: { id: entry.id },
      data: { isUsed: true }
    })

    return true
  }
}
