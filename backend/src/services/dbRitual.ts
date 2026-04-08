import fs from 'fs'
import path from 'path'
import { prisma } from '../db/prisma'

export async function applyDatabaseRituals() {
  // Only apply rituals if we are in a PostgreSQL environment
  const dbUrl = process.env.DATABASE_URL || ''
  const isPostgres = dbUrl.startsWith('postgres') || dbUrl.startsWith('postgresql')
  
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
    
    // Split SQL by '-- SPLIT --' markers for safe individual execution
    const statements = sql
      .split('-- SPLIT --')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement)
      } catch (stmtErr: any) {
        // We log warnings but continue, as some DROP statements might fail if things don't exist yet
        if (statement.toLowerCase().includes('drop')) {
          console.log(`[ChainVote:Ritual] Notice: Cleanup skipped for some elements: ${stmtErr.message.split('\n')[0]}`)
        } else {
          console.error(`[ChainVote:Ritual] Block Execution Error: ${stmtErr.message}`)
          throw stmtErr // Re-throw critical errors for main handler
        }
      }
    }
    
    console.log('[ChainVote:Ritual] All PostgreSQL functions and triggers have been manifested successfully.')
    
  } catch (err: any) {
    console.error(`[ChainVote:Ritual] Manifestation failed: ${err.message}`)
    console.warn('[ChainVote:Ritual] Hint: Verify if DATABASE_URL has correct permissions and if Render is connected.')
  }
}
