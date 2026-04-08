import { PrismaClient } from '../generated/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding initial data...')

  // Clean existing defaults if they exist
  await prisma.user.deleteMany({ where: { email: { contains: 'seed' } } })
  await prisma.candidate.deleteMany({ where: { name: { contains: 'Seed' } } })
  
  // Create 1 Admin
  const adminPass = await bcrypt.hash('adminseed', 10)
  await prisma.user.create({
    data: {
      email: 'admin_seed@chainvote.local',
      passwordHash: adminPass,
      role: 'ADMIN',
    }
  })

  // Create 5 Voters
  const voterPass = await bcrypt.hash('voterseed', 10)
  for(let i=1; i<=5; i++) {
    await prisma.user.create({
      data: {
        email: `voter_seed${i}@chainvote.local`,
        passwordHash: voterPass,
        role: 'VOTER',
        voterHash: `seed_hash_${i}`
      }
    })
  }

  // Create 1 Election
  const election = await prisma.election.create({
    data: {
      title: 'Global Commission Election 2026',
      description: 'The primary election for the interplanetary council.',
      status: 'LIVE',
      votingMode: 'NORMAL',
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      quorumPercent: 50,
      atmosphereTheme: 'void'
    }
  })

  // Create Candidates
  const c1 = await prisma.candidate.create({
    data: { electionId: election.id, name: 'Seed Candidate Alpha', manifesto: 'Vote Alpha for stability.' }
  })
  const c2 = await prisma.candidate.create({
    data: { electionId: election.id, name: 'Seed Candidate Beta', manifesto: 'Vote Beta for progress.' }
  })

  // Create a few Votes
  await prisma.vote.create({
    data: {
      voterHash: 'seed_hash_1',
      electionId: election.id,
      candidateId: c1.id,
      voteHash: 'dummy_hash_1',
      prevHash: 'GENESIS',
      isEarlyVote: true
    }
  })
  
  await prisma.vote.create({
    data: {
      voterHash: 'seed_hash_2',
      electionId: election.id,
      candidateId: c2.id,
      voteHash: 'dummy_hash_2',
      prevHash: 'dummy_hash_1',
      isEarlyVote: true
    }
  })

  console.log('Seeding completed! You can now query dummy data in your Database Engine.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
