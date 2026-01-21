# Add Access Codes via Firebase Console

Quick 2-minute setup to add your 5 access codes.

## Steps

### 1. Go to Firebase Console
https://console.firebase.google.com/

Select your HIVE project

### 2. Navigate to Firestore Database
Left sidebar → Firestore Database

### 3. Create Collection
Click **"Start collection"** (if first time) or **"Add collection"**

Collection ID: `access_codes`

Click "Next"

### 4. Add Your 5 Codes

For each code, create a document:

**Document ID**: Enter a 6-digit number (this IS the code)
- Example: `847291`

**Fields** (click "Add field" for each):
1. Field: `active` | Type: `boolean` | Value: `true`
2. Field: `createdAt` | Type: `timestamp` | Value: (click to set to now)
3. Field: `createdBy` | Type: `string` | Value: `Jacob Fraass`
4. Field: `notes` | Type: `string` | Value: `LinkedIn 72hr test - Jan 2026`
5. Field: `useCount` | Type: `number` | Value: `0`

Click **"Save"**

### 5. Repeat for 4 More Codes

Generate random 6-digit numbers or use these:
- 847291
- 523816
- 691047
- 384529
- 175623

Each gets the same fields as above.

## Done!

Your codes are ready. Test one:
1. Go to hive.college
2. Enter one of your codes
3. Should proceed to onboarding ✓

## Save Your Codes

Copy them somewhere - you'll DM these to people who respond to your LinkedIn post.

```
Code 1: 847291
Code 2: 523816
Code 3: 691047
Code 4: 384529
Code 5: 175623
```

---

**Deployment is happening now. Once it completes (~2-3 min), you're live!**
