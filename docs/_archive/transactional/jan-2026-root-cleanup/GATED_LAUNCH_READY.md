# 🚀 Gated Launch - Ready to Deploy

Your 72-hour test is ready. Here's what was done and how to launch.

## What Changed

### 1. Landing Page (/)
- **Before**: "Enter with .edu" button
- **After**: 6-digit code entry (like auth codes)
- Users must enter valid access code to proceed

### 2. About Page
- Removed "thousands" language about Mirka
- Removed "it's just me now" phrasing
- Kept contributors visible without implying they left

### 3. Access System
- Landing page requires 6-digit code
- Codes stored in Firestore `access_codes` collection
- Session-based access (stays valid in browser session)
- /enter page checks for valid session

## Quick Start

### Step 1: Enable Access Gate

Add to Vercel environment variables:

```bash
NEXT_PUBLIC_ACCESS_GATE_ENABLED=true
```

**Important**: Redeploy after adding this variable.

### Step 2: Generate Access Codes

```bash
# Generate 5 random codes for your test users
pnpm tsx scripts/access-codes-add.ts --count 5
```

When prompted:
- **Created by**: Your name/email
- **Notes**: "LinkedIn 72hr test - Jan 2026"

The script will output the codes. **Copy these** - you'll DM them to your 5 test users.

Example output:
```
✓ Added code: 847291
✓ Added code: 523816
✓ Added code: 691047
✓ Added code: 384529
✓ Added code: 175623
```

### Step 3: Deploy

```bash
# Build and typecheck
cd apps/web
pnpm build && pnpm typecheck

# Deploy
git add .
git commit -m "feat: Enable gated launch with access codes"
git push

# Or via Vercel CLI
vercel --prod
```

### Step 4: Test

**Test with valid code:**
1. Go to hive.college
2. Enter one of your generated codes
3. Should proceed to /enter ✓

**Test without code:**
1. Open incognito window
2. Go to hive.college
3. Try entering random 6 digits → "Invalid code"
4. Try going directly to hive.college/enter → Redirected back to /

## Managing Codes

### View all codes and usage stats
```bash
pnpm tsx scripts/access-codes-manage.ts list
```

Shows:
- Which codes are active
- How many times each was used
- When last used

### Generate more codes during test
```bash
pnpm tsx scripts/access-codes-manage.ts --count 3
```

### Disable a code (keep record)
```bash
pnpm tsx scripts/access-codes-manage.ts disable 123456
```

### Permanently remove a code
```bash
pnpm tsx scripts/access-codes-manage.ts remove 123456
```

## LinkedIn Post - Suggested Copy

```
Looking for 5 student leaders at UB to test HIVE over the next 72 hours.

We built permanent infrastructure for student organizations — spaces that persist across semesters, knowledge that doesn't disappear when e-boards graduate.

Need honest feedback from people who actually run orgs.

DM me for access code.
```

## Your Test Flow

1. Post on LinkedIn
2. As people DM you, send them one of your 5 codes
3. They go to hive.college, enter the code
4. They complete onboarding and use HIVE
5. You gather feedback

## Monitoring Usage

Check code usage:
```bash
pnpm tsx scripts/access-codes-manage.ts list
```

This shows:
- Which codes have been used (meaning someone entered the site)
- How many times (if they cleared their session and re-entered)
- When they last accessed

Check Vercel logs:
```bash
vercel logs --follow
```

Look for:
- `"Access code verified"` - someone entered with valid code
- `"Access code not found"` - someone tried invalid code

## After 72 Hours

### Option A: Generate More Codes, Keep Testing

```bash
pnpm tsx scripts/access-codes-add.ts --count 10
```

### Option B: Open to Everyone (Remove Gate)

When ready for full UB launch:

1. In Vercel, set:
   ```bash
   NEXT_PUBLIC_ACCESS_GATE_ENABLED=false
   ```

2. Redeploy

3. Landing page returns to normal "Enter with .edu" button

4. (Optional) Archive codes for records:
   ```bash
   pnpm tsx scripts/access-codes-manage.ts list > launch-cohort-1.txt
   ```

## Troubleshooting

### "I have a code but it says invalid"

1. Check exact code in Firestore (case sensitive, must be exact)
2. Verify `active: true` in Firestore document
3. Try listing codes: `pnpm tsx scripts/access-codes-manage.ts list`

### "Gate isn't working - anyone can get in"

1. Check environment variable: Must be exactly `NEXT_PUBLIC_ACCESS_GATE_ENABLED=true`
2. Verify you redeployed after adding the env var
3. Check in Vercel dashboard → Settings → Environment Variables

### "No one can get in (including with codes)"

1. Check Firestore rules allow server to read `access_codes` collection
2. Verify codes exist: `pnpm tsx scripts/access-codes-manage.ts list`
3. Check Firebase Admin SDK is configured correctly

### "Script errors"

Make sure you have `.env.local` with all Firebase config:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## Development Mode

When developing locally (`npm run dev`):
- Access gate is **disabled** automatically
- You can access site without codes
- Landing page redirects straight to /enter

To test the gate locally:
1. Build production: `pnpm build`
2. Start production: `pnpm start`
3. Access gate will be active

## Architecture Notes

**Session-based access:**
- Valid code → `sessionStorage.setItem('hive_access_granted', 'true')`
- Access persists in that browser session
- Clearing browser data resets access
- Each user needs to enter code once per session

**Firestore structure:**
```
access_codes/
  {code}/
    active: true
    createdAt: timestamp
    createdBy: "jacob@buffalo.edu"
    notes: "LinkedIn test"
    useCount: 3
    lastUsed: timestamp
```

**Rate limiting:**
- Code verification is rate-limited per IP
- Prevents brute-force guessing
- Uses existing rate limiter (`enforceRateLimit('accessCode', ...)`)

## Support

Questions? Check:
1. Vercel logs: `vercel logs`
2. Code list: `pnpm tsx scripts/access-codes-manage.ts list`
3. Firestore console: firebase.google.com/console

---

**You're ready to launch. Generate your codes and post on LinkedIn.**
