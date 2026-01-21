# Access Gate System

Gated launch mode for controlled rollout to select users.

## Overview

The access gate allows you to restrict platform access to a whitelist of emails during initial testing phases.

## How It Works

1. **Feature Flag**: Controlled by `NEXT_PUBLIC_ACCESS_GATE_ENABLED` environment variable
2. **Whitelist Storage**: Emails stored in Firestore `access_whitelist` collection
3. **Enforcement**: Checked during email verification code sending

## Configuration

### Enable Access Gate

Add to your `.env.local`:

```bash
NEXT_PUBLIC_ACCESS_GATE_ENABLED=true
```

### Disable Access Gate (Open Access)

Remove the variable or set to false:

```bash
NEXT_PUBLIC_ACCESS_GATE_ENABLED=false
```

## Managing the Whitelist

### Option 1: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Firestore Database
3. Create/edit documents in the `access_whitelist` collection
4. Document structure:
   ```
   Document ID: {email} (e.g., "jacob@buffalo.edu")
   Fields:
     - active: true
     - addedAt: {timestamp}
     - addedBy: {admin_email}
     - notes: "Student leader - LinkedIn test group"
   ```

### Option 2: Admin Panel

(Coming soon - admin interface for whitelist management)

### Option 3: Script (Quick Bulk Add)

Create a file `scripts/add-to-whitelist.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  // Your config from .env
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const EMAILS_TO_WHITELIST = [
  'student1@buffalo.edu',
  'student2@buffalo.edu',
  'student3@buffalo.edu',
  'student4@buffalo.edu',
  'student5@buffalo.edu',
];

async function addToWhitelist() {
  for (const email of EMAILS_TO_WHITELIST) {
    const normalizedEmail = email.toLowerCase().trim();
    await setDoc(doc(db, 'access_whitelist', normalizedEmail), {
      active: true,
      addedAt: new Date(),
      addedBy: 'admin',
      notes: 'LinkedIn 72hr test - Jan 2026',
    });
    console.log(`✓ Added: ${normalizedEmail}`);
  }
  console.log('\nWhitelist updated successfully!');
}

addToWhitelist();
```

Run with: `tsx scripts/add-to-whitelist.ts`

## User Experience

### When Gated (Not Whitelisted)

User sees:
```
"HIVE is currently in limited access mode. We're opening to select student leaders first. Check back soon!"
```

### When Whitelisted

Normal flow continues - code sent to email.

## Testing

### Development Mode

Access gate is **always disabled** in development mode (`NODE_ENV=development`), regardless of feature flag.

### Production Testing

1. Enable feature flag: `NEXT_PUBLIC_ACCESS_GATE_ENABLED=true`
2. Add test email to whitelist
3. Attempt sign-up with whitelisted email → Should succeed
4. Attempt sign-up with non-whitelisted email → Should see gated message

## Monitoring

Check logs for whitelist activity:

```bash
# Search for whitelist checks
grep "Access whitelist" logs/app.log

# Successful access
"Access whitelist: Email allowed"

# Blocked access
"Access whitelist: Email not whitelisted"
```

## Removing the Gate (Going Public)

When ready to open to all users:

1. Set `NEXT_PUBLIC_ACCESS_GATE_ENABLED=false` or remove the variable
2. Redeploy
3. (Optional) Archive whitelist collection for records

## Security Notes

- Whitelist checks happen **server-side** in the API route
- Feature flag is in `NEXT_PUBLIC_*` for client awareness but gate is enforced server-side
- Failed checks are audited in auth events with `error: 'not_whitelisted'`
- System fails **open** (allows access) if Firestore check errors out to prevent lockouts

## Firestore Rules

Ensure your Firestore rules protect the whitelist collection:

```javascript
match /access_whitelist/{email} {
  allow read: if false;  // Only server can read
  allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```
