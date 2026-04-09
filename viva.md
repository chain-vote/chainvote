# 📜 The Oracle's Guide: Viva Preparation

This scroll contains potential inquiries from the Sages (Professors) regarding the ChainVote manifestation.

---

### Q1: Explain like I'm a child: How is your solution different from others?
**The Simpler Story**: Imagine a normal voting box where people put paper. You have to trust the person counting them. In my system, the box is made of "magic glass" (Cryptography). 
- Every time someone votes, the magic box makes a new link in a glowing chain (**Blockchain/Merkle Tree**). 
- Everyone can see the chain, so if someone tried to steal a vote or change one, the whole chain would turn red and stop glowing (**Fork Detection/Integrity**). 
- Plus, no one knows *who* put which paper in, because everyone wears a mask and a matching sigil (**Voter Anonymity/Hashes**). It’s a box that proves the truth without needing a leader.

---

### Q2: What is the "Merkle Tree" and why did you use it instead of a simple List?
**The Technical Essence**: A simple List is easy to tamper with (you can swap item #5 without changing item #10). A **Merkle Tree** is a mathematical hierarchy of hashes.
- The "Root Hash" at the top depends on *every single leaf* below it.
- If even one bit of one vote changes, the entire path to the root breaks instantly. This allows us to prove the integrity of millions of votes by checking just a single string (the Root). It’s efficient, light, and immutable.

---

### Q3: How do you ensure Voter Privacy if everything is on a public ledger?
**The Shrouding Ritual**: We use **One-Way Cryptographic Hashes (SHA-256)**.
- We don't store "John Smith voted for Candidate A."
- We store "Hash_XYZ voted for Candidate A."
- Hash_XYZ is generated from the user's private credentials and a server-side "Salt." 
- This means even if you see the hash, you can't work backward to find the human identity. However, the voter can generate their own hash to verify their "Soul Ledger" (Receipt) is correctly counted.

---

### Q4: What happens if a Commissioner tries to cheat?
**The Sovereign Guard**: Even the Commissioner (Admin) cannot alter the chain once it's Manifested. 
- The **DB Engine/Workbench** is built to only allow valid SQL rituals.
- Any attempt to delete or modify a `Vote` row would break the **Merkle Root** and the **Sequence Hash** of the next block. The "Audit Explorer" would immediately signal a "Broken Link" to the entire public.

---

### Q5: Explain "Ranked-Choice Voting" (IRV).
**The Selection Hierarchy**: Instead of just picking one winner, voters rank candidates (1st choice, 2nd, etc.).
- If no one gets >50% of 1st-place votes, the candidate with the least votes is "eliminated."
- Their votes are then given to the 2nd-choice candidates on those ballots.
- This continues until someone has a majority. It ensures the winner is the one most people are "okay" with, even if they weren't everyone's #1.

---

### Q6: What is the purpose of the "Harry Potter" synthesis engine?
**The Ritual Atmosphere**: Beyond aesthetic, it provides **Audio-Feedback for Critical Operations**.
- Successful votes chime in a specific frequency; errors sound "discordant." 
- It transforms a dry "Database" into a "Ritual Space," increasing user focus and emphasizing the gravity of casting a sovereign vote.

---

### Q7: How does "Flexible Candidate Architect" work?
**Dynamic Scaling**: We use a **One-to-Many Relational Schema**. 
- An `Election` model has a relation to N `Candidate` models. 
- When the Commissioner sets the "Path Count," the UI dynamically manifests the fields, and the backend creates exactly those unique records in the `Candidate` table. This allows the system to scale from a simple "Yes/No" to a multi-candidate guild election without changing the code.
