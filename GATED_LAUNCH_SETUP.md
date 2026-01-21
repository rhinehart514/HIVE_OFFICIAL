# Gated Launch Setup - 72 Hour Test

Quick setup guide for your limited access launch.

## What Was Changed

### 1. About Page Updates
- Removed "day-to-day CEO" language
- Clarified team contributions without implying they left
- Removed "it's just me now" phrasing
- Made it clear contributors are still around but not actively working on the project

### 2. Access Gate System
- Added email whitelist check to entry flow
- Gated at email verification step (send-code API)
- Only whitelisted emails can receive verification codes
- Configurable via environment variable

## Setup Steps

### Step 1: Enable Access Gate

Add to your environment variables (Vercel dashboard or `.env.production`):

```bash
NEXT_PUBLIC_ACCESS_GATE_ENABLED=true
```

### Step 2: Add Your 5 Test Users

Using the Firebase Console (easiest):

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open your project → Firestore Database
3. Create a new collection: `access_whitelist`
4. Add 5 documents (one per student):
   - Document ID: `studentemail@buffalo.edu` (their exact email)
   - Fields:
     ```
     active: true (boolean)
     addedAt: (use Timestamp - now)
     addedBy: "jacob@buffalo.edu" (string)
     notes: "LinkedIn 72hr test - Jan 2026" (string)
     ```

**Or using the script:**

```bash
# Add emails interactively
pnpm tsx scripts/whitelist-add.ts student1@buffalo.edu student2@buffalo.edu

# Or from a file
echo "student1@buffalo.edu
student2@buffalo.edu
student3@buffalo.edu
student4@buffalo.edu
student5@buffalo.edu" > test-users.txt

pnpm tsx scripts/whitelist-add.ts --batch test-users.txt
```

### Step 3: Test It

**Test whitelisted email:**
1. Go to hive.college/enter
2. Enter a whitelisted email
3. Should receive verification code ✓

**Test non-whitelisted email:**
1. Go to hive.college/enter
2. Enter any other @buffalo.edu email
3. Should see: "HIVE is currently in limited access mode. We're opening to select student leaders first. Check back soon!"

### Step 4: Deploy

```bash
# From apps/web
pnpm build && pnpm typecheck

# Deploy to Vercel
git add .
git commit -m "feat: Enable gated launch for 72hr test"
git push

# Or via Vercel CLI
vercel --prod
```

## Managing Whitelist

### View all whitelisted emails
```bash
pnpm tsx scripts/whitelist-manage.ts list
```

### Add more emails during test
```bash
pnpm tsx scripts/whitelist-add.ts newemail@buffalo.edu
```

### Remove someone
```bash
pnpm tsx scripts/whitelist-manage.ts remove email@buffalo.edu
```

### Temporarily disable (keeps record)
```bash
pnpm tsx scripts/whitelist-manage.ts disable email@buffalo.edu
```

## LinkedIn Post Copy Suggestion

```
Looking for 5 student leaders at UB to test HIVE over the next 72 hours.

We built permanent infrastructure for student organizations — spaces that persist across semesters, knowledge that doesn't disappear when e-boards graduate.

Need honest feedback from people who actually run orgs.

DM me if interested.
```

## After 72 Hours

### Option A: Open to More Users

Add more emails to whitelist as you get feedback and iterate.

### Option B: Full Launch (Remove Gate)

When ready to open to all UB students:

1. Set environment variable:
   ```bash
   NEXT_PUBLIC_ACCESS_GATE_ENABLED=false
   ```

2. Redeploy

3. (Optional) Archive whitelist for records:
   ```bash
   # Export to CSV for records
   pnpm tsx scripts/whitelist-manage.ts list > launch-cohort-1.txt
   ```

## Monitoring

Check logs for whitelist activity:

```bash
# Vercel CLI
vercel logs

# Look for:
"Access whitelist: Email allowed" - someone whitelisted tried to sign up
"Access whitelist: Email not whitelisted" - someone blocked
```

## Troubleshooting

### "I'm whitelisted but can't get in"

1. Check exact email spelling in Firestore (case doesn't matter, but typos do)
2. Verify `active: true` is set
3. Check environment variable is set: `NEXT_PUBLIC_ACCESS_GATE_ENABLED=true`
4. Check Vercel deployment has the env var

### "Everyone is getting in (gate not working)"

1. Check environment variable is exactly: `NEXT_PUBLIC_ACCESS_GATE_ENABLED=true` (not "True" or "1")
2. Verify you deployed after adding the env var
3. Check Vercel environment variables dashboard

### "No one can get in (including whitelisted)"

1. Check Firestore rules allow server to read `access_whitelist` collection
2. Check Firebase Admin SDK is configured correctly
3. Check logs for errors: `pnpm tsx scripts/whitelist-manage.ts list` should work

## Support

Full documentation: `/docs/ACCESS_GATE.md`

Questions? Check the logs first, then Firebase Console to verify whitelist entries.
