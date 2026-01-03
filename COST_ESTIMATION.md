# Calculator Game - Cost Estimation

Last updated: January 2026

---

## Firebase Realtime Database

### Pricing
- **Storage:** $5/GB/month
- **Downloads:** $1/GB
- **Free tier (Spark):** 1 GB download/month, 10 GB storage

### Usage Per Game

| Action | Reads | Writes | Data Size (approx) |
|--------|-------|--------|-------------------|
| Create game | 1 | 1 | ~500 bytes |
| Join game (per player) | 1 | 1 | ~200 bytes |
| Start game | 0 | 1 | ~50 bytes |
| **Per Round:** | | | |
| Submit question | 0 | 1 | ~300 bytes |
| Submit guess (per player) | 0 | 1 | ~100 bytes |
| Calculate results | 1 | 1 | ~500 bytes |
| Move to standings | 0 | 1 | ~50 bytes |
| Advance to next round | 2 | 1 | ~100 bytes |

### Real-time Listener (Main Cost Driver)

Every player has `listenToGame()` active. Every write triggers a download to ALL connected players.

**Example: 4-player, 10-round game:**
- ~50 state changes x 4 players = 200 downloads
- Game object size: ~2-5 KB (grows with rounds)
- Total download per game: ~500 KB - 1 MB

### Firebase Cost Estimates

| Scale | Games/Month | Downloads | Monthly Cost |
|-------|-------------|-----------|--------------|
| Just friends | 50 | ~50 MB | **Free** |
| Small launch | 500 | ~500 MB | **Free** |
| 1,000 games | 1,000 | ~1 GB | **~$1** |
| 10,000 games | 10,000 | ~10 GB | **~$10** |
| Viral (100K) | 100,000 | ~100 GB | **~$100** |

---

## Gemini API (Question Validation)

### Model
- **Model:** `gemini-flash-latest` (fast, cheap model)
- **Usage:** Called once per question to validate and get the answer

### Pricing (Gemini 1.5 Flash)
- **Input:** $0.075 per 1M tokens
- **Output:** $0.30 per 1M tokens
- **Free tier:** 15 RPM, 1M tokens/day

### Usage Per Question

| Component | Tokens (approx) |
|-----------|-----------------|
| System prompt | ~350 tokens |
| User question | ~20 tokens |
| **Total Input** | **~370 tokens** |
| JSON response | ~80 tokens |
| **Total Output** | **~80 tokens** |

### Cost Per Question
- Input: 370 tokens x $0.075/1M = $0.000028
- Output: 80 tokens x $0.30/1M = $0.000024
- **Total per question: ~$0.00005** (0.005 cents)

### Gemini Cost Estimates

| Scale | Questions/Month | Monthly Cost |
|-------|-----------------|--------------|
| Just friends (50 games x 10 rounds) | 500 | **Free** |
| Small launch | 5,000 | **~$0.25** |
| 1,000 games x 10 rounds | 10,000 | **~$0.50** |
| 10,000 games x 10 rounds | 100,000 | **~$5** |
| Viral (100K games) | 1,000,000 | **~$50** |

---

## Combined Cost Summary

| Scale | Games/Month | Firebase | Gemini | **Total** |
|-------|-------------|----------|--------|-----------|
| Just friends | 50 | Free | Free | **Free** |
| Small launch | 500 | Free | ~$0.25 | **~$0.25** |
| Moderate | 1,000 | ~$1 | ~$0.50 | **~$1.50** |
| Growing | 10,000 | ~$10 | ~$5 | **~$15** |
| Viral | 100,000 | ~$100 | ~$50 | **~$150** |

---

## Optimization Strategies (If Needed)

### Firebase
1. **Clean up old games** - Delete games after 24 hours
2. **Partial listeners** - Listen to specific paths instead of entire game object
3. **Batch updates** - Combine multiple writes into single updates
4. **Move to Firestore** - Different pricing model, may be cheaper at scale

### Gemini
1. **Cache common questions** - Store validated questions/answers
2. **Shorter prompts** - Reduce system prompt size
3. **Client-side validation** - Basic checks before API call
4. **Rate limiting** - Prevent spam/abuse

---

## Notes

- Firebase free tier covers ~1,000 games/month
- Gemini free tier covers ~2,700 questions/day (1M tokens)
- For casual use with friends, you'll stay completely free
- Costs scale linearly and remain very affordable even at scale
