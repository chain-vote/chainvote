-- This file contains the cryptographic verification queries from DATABASE.md

-- 1. View the Vote Chain for an Election
SELECT 
  timestamp, 
  voterHash, 
  prevHash, 
  voteHash 
FROM "Vote" 
ORDER BY timestamp ASC;

-- 2. Check Candidate Totals
SELECT 
  c.name, 
  COUNT(v.id) as vote_count
FROM Candidate c
LEFT JOIN Vote v ON v.candidateId = c.id
GROUP BY c.id;

-- 3. Check Audit Logs
SELECT 
  timestamp, 
  operation, 
  "table", 
  detail 
FROM AuditLog 
ORDER BY timestamp DESC;
