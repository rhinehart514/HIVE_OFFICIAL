# Deploy Checklist - Gated Launch

Follow these steps to go live with gated access.

## Before You Deploy

- [ ] Code is committed
- [ ] Typecheck passes (`pnpm --filter=@hive/web typecheck` ✓)
- [ ] You're ready to generate and share access codes

## Step 1: Set Environment Variable in Vercel

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Add:
```
Name: NEXT_PUBLIC_ACCESS_GATE_ENABLED
Value: true
```

**Important:**
- Select all environments (Production, Preview, Development)
- Click "Save"

## Step 2: Generate Access Codes

Run locally (before deploying):

```bash
pnpm tsx scripts/access-codes-add.ts --count 5
```

Follow the prompts:
- Created by: `your name`
- Notes: `LinkedIn 72hr test - Jan 2026`

**Copy the 5 codes** that are generated. You'll DM these to your test users.

Example output:
```
✓ Added code: 847291
✓ Added code: 523816
✓ Added code: 691047
✓ Added code: 384529
✓ Added code: 175623
```

Save these codes somewhere safe.

## Step 3: Commit and Push

```bash
git add .
git commit -m "feat: Enable gated launch with 6-digit access codes"
git push
```

This automatically triggers Vercel deployment.

## Step 4: Verify Deployment

1. Wait for Vercel deployment to complete (~2-3 minutes)
2. Check build logs for errors
3. Once deployed, visit your site: https://hive.college

### Test It

**Without code (should block):**
1. Go to hive.college
2. Should see "Enter your code" with 6 boxes
3. Try random digits → Should say "Invalid code"
4. Try going directly to hive.college/enter → Should redirect to /

**With valid code (should work):**
1. Go to hive.college
2. Enter one of your 5 codes
3. Should redirect to /enter and allow onboarding ✓

## Step 5: Post on LinkedIn

```
Looking for 5 student leaders at UB to test HIVE over the next 72 hours.

We built permanent infrastructure for student organizations — spaces that persist across semesters, knowledge that doesn't disappear when e-boards graduate.

Need honest feedback from people who actually run orgs.

DM me for access code.
```

## As DMs Come In

Reply with:
```
Here's your access code: 847291

Go to hive.college and enter the code to get started.

Looking forward to your feedback!
```

Give each person a different code from your list.

## Monitoring

### See who's using codes
```bash
pnpm tsx scripts/access-codes-manage.ts list
```

Shows:
- Which codes have been used
- How many times
- When last used

### Check Vercel logs
```bash
vercel logs --follow
```

Look for:
- `"Access code verified"` - someone entered successfully
- `"Access code not found"` - someone tried wrong code

## After 72 Hours

See `GATED_LAUNCH_READY.md` for next steps.

Quick options:
- Generate more codes → Keep testing
- Disable gate → Open to all UB students

## Troubleshooting

### Environment variable not working
- Did you redeploy after adding the variable?
- Is it exactly `NEXT_PUBLIC_ACCESS_GATE_ENABLED=true`?
- Check Vercel → Settings → Environment Variables

### Codes not working
- Run `pnpm tsx scripts/access-codes-manage.ts list` to verify codes exist
- Check Firebase Console → Firestore → `access_codes` collection
- Make sure `active: true` on each code

### Need help
- Check `GATED_LAUNCH_READY.md` for detailed troubleshooting
- Check Vercel logs: `vercel logs`
- Check Firebase Console

---

**You're ready. Set the env var, generate codes, and deploy.**
