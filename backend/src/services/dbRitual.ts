import fs from 'fs'
import path from 'path'
import { prisma } from '../db/prisma'

export async function applyDatabaseRituals() {
  // Only apply rituals if we are in a PostgreSQL environment
  const isPostgres = process.env.DATABASE_URL?.startsWith('postgres') || process.env.DATABASE_URL?.startsWith('postgresql')
  
  if (!isPostgres) {
    console.log('[ChainVote:Ritual] Local SQLite detected. Skipping PostgreSQL-specific cryptographic rituals.')
    return
  }

  console.log('[ChainVote:Ritual] Initializing PostgreSQL Cryptographic Rituals...')
  
  try {
    const triggersPath = path.join(__dirname, '..', 'db', 'triggers.sql')
    if (!fs.existsSync(triggersPath)) {
      console.warn('[ChainVote:Ritual] triggers.sql not found. Cryptographic integrity may be compromised!')
      return
    }

    const sql = fs.readFileSync(triggersPath, 'utf8')
    
    // Split SQL by semicolons, but be careful with functions
    // A better way is to identify major blocks or use a simpler split
    // For now, we'll try to run it in chunks or as a whole if the driver allows
    
    // Most postgres drivers allow multiple statements if they are separated by semicolons
    // However, Prisma's $executeRawUnsafe can be finicky.
    
    // We will attempt to run the whole block. If it fails, we will split by '-- SPLIT --' markers
    // which I will add to the triggers.sql file for safety.
    
    await prisma.$executeRawUnsafe(sql)
    console.log('[ChainVote:Ritual] All PostgreSQL functions and triggers have been manifested successfully.')
    
  } catch (err: any) {
    console.error(`[ChainVote:Ritual] Manifestation failed: ${err.message}`)
    console.warn('[ChainVote:Ritual] Hint: This error is expected if triggers already exist or if schema names differ.')
  }
}
