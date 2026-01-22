# Spaces — Identity-First Design (Final)

**Core Truth:** Spaces are how you express who you are on campus.

---

## The Four Identity Dimensions

Every student has these identities:

1. **📚 YOUR MAJOR** — What you study
2. **🏠 YOUR HOME** — Where you live
3. **⚡ YOUR INTERESTS** — What you love
4. **🤝 YOUR COMMUNITY** — Who you belong to

---

## Territory Map (Final)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   📚  YOUR MAJOR              ⚡  YOUR INTERESTS         │
│   ─────────────────            ─────────────────         │
│                                                          │
│   ┌──────────┐                 ┌──────────┐             │
│   │ Computer │                 │ Gaming   │             │
│   │ Science  │                 │ Club  ●  │             │
│   │ ✓ Active │                 │ 89 here  │             │
│   └──────────┘                 └──────────┘             │
│                                                          │
│   ┌──────────┐                 ┌──────────┐             │
│   │ Physics  │                 │ Photo    │             │
│   │          │                 │ Club  ●  │             │
│   │ 🔒 Soon  │                 │ 56 here  │             │
│   └──────────┘                 └──────────┘             │
│                                                          │
│   [Explore all majors →]       [Explore interests →]    │
│                                                          │
│   ─────────────────────────────────────────────────     │
│                                                          │
│   🏠  YOUR HOME               🤝  YOUR COMMUNITY        │
│   ─────────────────            ─────────────────         │
│                                                          │
│   ┌──────────┐                 ┌──────────┐             │
│   │ Ellicott │                 │International           │
│   │ Complex  │                 │ Students │             │
│   │ • 312    │                 │ • 234 ● │             │
│   └──────────┘                 └──────────┘             │
│                                                          │
│   ┌──────────┐                 ┌──────────┐             │
│   │Governors │                 │ Alpha    │             │
│   │ Hall  ●  │                 │ Chi   ●  │             │
│   │ 89 here  │                 │ 178 here │             │
│   └──────────┘                 └──────────┘             │
│                                                          │
│   [Explore housing →]          [Explore communities →]  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Major Spaces — Clean Unlock States

### Unlocked State (No Numbers)

```
┌────────────────────────────────┐
│  Computer Science              │
│                                │
│  ✓ Active                      │
│                                │
│  ┌──────────┐  ┌──────────┐   │
│  │ General  │  │ Projects │   │
│  │ • 23     │  │ • 8      │   │
│  └──────────┘  └──────────┘   │
│                                │
│  [Enter Space →]               │
└────────────────────────────────┘
```

**Key changes:**
- ✓ Just say "Active" (no member count)
- Show board previews
- Primary CTA to enter

### Locked State (No Numbers)

```
┌────────────────────────────────┐
│  Physics                       │
│                                │
│  🔒 Coming Soon                │
│                                │
│  This major space will unlock  │
│  when more students join.      │
│                                │
│  Be one of the first.          │
│                                │
│  [Join Waitlist]               │
│  [Invite Classmates]           │
└────────────────────────────────┘
```

**Key changes:**
- ✗ No "3/10" progress shown
- Just "Coming Soon" state
- Waitlist mechanic (get notified when unlocked)
- Invite flow to help unlock faster

---

## Community Quadrant — Expanded

### Core Community Spaces (Always Available)

```
🤝 YOUR COMMUNITY

┌──────────────┐  ┌──────────────┐
│International │  │ Transfer     │
│ Students  ●  │  │ Students     │
│ 234 here     │  │ • 89 here    │
└──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│ Alpha Chi    │  │ BSU          │
│ Omega     ●  │  │ • 145 here   │
│ 178 here     │  │              │
└──────────────┘  └──────────────┘

[Explore all communities →]
```

### Special Identity Spaces

| Space | Who | Always Available |
|-------|-----|------------------|
| **International Students** | Non-US students | ✓ Yes |
| **Transfer Students** | Transfer admits | ✓ Yes |
| **First-Gen Students** | First-gen college | ✓ Yes |
| **Commuter Students** | Off-campus commuters | ✓ Yes |
| **Graduate Students** | Grad programs | ✓ Yes |
| **Veterans** | Military veterans | ✓ Yes |

**These spaces are ALWAYS unlocked** — no threshold. They exist the moment campus launches.

---

## Identity Onboarding — Updated

### Step 3: Build Your Identity (Enhanced)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│            Build Your Campus Identity           │
│                                                 │
│  This helps us show you the right spaces.       │
│  You can change this anytime.                   │
│                                                 │
│  ───────────────────────────────────────────    │
│                                                 │
│  📚 What's your major?                          │
│  [Dropdown: Computer Science___________]        │
│                                                 │
│  🏠 Where do you live?                          │
│  [Dropdown: Ellicott Complex___________]        │
│                                                 │
│  ⚡ What are you interested in? (pick 2-3)     │
│  [ ] Gaming    [ ] Photography  [ ] Art         │
│  [ ] Sports    [ ] Music        [ ] Tech        │
│  [ ] Politics  [ ] Fitness      [ ] Other       │
│                                                 │
│  🤝 Do any of these apply to you? (optional)   │
│  [ ] International Student                      │
│  [ ] Transfer Student                           │
│  [ ] First-Generation College Student           │
│  [ ] Commuter Student                           │
│  [ ] Graduate Student                           │
│  [ ] Veteran                                    │
│  [ ] Greek Life                                 │
│  [ ] Cultural Organization Member               │
│                                                 │
│  ───────────────────────────────────────────    │
│                                                 │
│  [Skip for Now]          [Continue →]           │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key additions:**
- ✓ International student checkbox
- ✓ Transfer student checkbox
- ✓ First-gen, commuter, graduate, veteran options
- These auto-join you to those community spaces

---

## Request Flow — Transfer Student Example

### If Major Space Locked + User is Transfer

```
┌────────────────────────────────────────────┐
│  Physics                                   │
│                                            │
│  🔒 Coming Soon                            │
│                                            │
│  This major space hasn't unlocked yet.     │
│                                            │
│  ──────────────────────────────────────    │
│                                            │
│  ℹ️  You're a transfer student?           │
│                                            │
│  Transfer students can request a           │
│  dedicated space for transfers in your     │
│  major.                                    │
│                                            │
│  [Request Transfer Physics Space]          │
│  [Join General Transfer Students]          │
│                                            │
│  ──────────────────────────────────────    │
│                                            │
│  Or help unlock the main space:            │
│  [Join Waitlist]  [Invite Classmates]      │
│                                            │
└────────────────────────────────────────────┘
```

**Smart detection:**
- If user marked "Transfer Student" in onboarding
- AND their major space is locked
- Show option to request transfer-specific space
- Example: "Transfer CS Students" (subset community)

---

## Community Space Types

### Tier 1: Universal Communities (Always Exist)

These spaces are created on campus launch:

```typescript
const universalCommunities = [
  { name: 'International Students', icon: '🌍', identityTag: 'international' },
  { name: 'Transfer Students', icon: '🔄', identityTag: 'transfer' },
  { name: 'First-Gen Students', icon: '🎓', identityTag: 'firstgen' },
  { name: 'Commuter Students', icon: '🚗', identityTag: 'commuter' },
  { name: 'Graduate Students', icon: '📚', identityTag: 'graduate' },
  { name: 'Veterans', icon: '🎖️', identityTag: 'veteran' }
];
```

**Auto-join logic:**
- If user checks "International Student" → auto-join International Students space
- If user checks "Transfer Student" → auto-join Transfer Students space
- etc.

### Tier 2: Organic Communities (User-Created)

These are created by students:
- Greek organizations
- Cultural orgs (BSU, Hillel, etc.)
- Identity groups (LGBTQ+ Alliance, etc.)
- Special interest communities

---

## Visual States — Final Spec

### Major Space: Active

```
┌────────────────────────────────┐
│  Computer Science              │
│                                │
│  ✓ Active                      │ ← Green checkmark
│  • 23 online now               │ ← Gold dot if active
│                                │
│  ┌──────────┐  ┌──────────┐   │
│  │ General  │  │ Projects │   │
│  │ • 23     │  │ • 8      │   │
│  └──────────┘  └──────────┘   │
│                                │
│  [Enter Space →]               │ ← Primary button
└────────────────────────────────┘
```

### Major Space: Coming Soon

```
┌────────────────────────────────┐
│  Physics                       │
│                                │
│  🔒 Coming Soon                │ ← Gray lock icon
│                                │
│  This major space will unlock  │
│  when more students join.      │
│                                │
│  Be one of the first.          │
│                                │
│  [Join Waitlist]               │ ← Secondary button
│  [Invite Classmates]           │ ← Ghost button
└────────────────────────────────┘
```

### Community Space: Always Available

```
┌────────────────────────────────┐
│  🌍 International Students     │
│                                │
│  ✓ Active                      │
│  • 34 online now               │
│                                │
│  Connect with international    │
│  students from around the      │
│  world.                        │
│                                │
│  [Enter Space →]               │
└────────────────────────────────┘
```

---

## Data Model — Final

### User Profile

```typescript
interface UserProfile {
  // Existing...

  // Core identity (required)
  major?: string;
  residenceType: 'on-campus' | 'off-campus' | 'commuter';
  residenceHall?: string;

  // Interests (optional)
  interests: string[];

  // Community identities (optional, multi-select)
  communityIdentities: {
    international?: boolean;
    transfer?: boolean;
    firstGen?: boolean;
    commuter?: boolean;
    graduate?: boolean;
    veteran?: boolean;
    greek?: boolean;
    cultural?: boolean;
  };

  // Space memberships
  majorSpaceId?: string;
  homeSpaceId?: string;
  communitySpaceIds: string[];
}
```

### Space Model

```typescript
interface Space {
  // Existing...

  // Identity type
  identityType: 'major' | 'residence' | 'interest' | 'community';

  // Major spaces
  majorName?: string;
  isUnlocked: boolean;

  // Community spaces
  communityType?: 'international' | 'transfer' | 'firstgen' | 'commuter' | 'graduate' | 'veteran' | 'greek' | 'cultural' | 'other';
  isUniversal?: boolean;  // True for international, transfer, etc. (always exist)

  // Related spaces
  relatedSpaces?: string[];
}
```

---

## Unlock Behavior — Behind the Scenes

### Major Space Unlock (User Never Sees Threshold)

```typescript
// Server-side only (never exposed to client)
const MAJOR_UNLOCK_THRESHOLD = 10;

async function checkMajorUnlock(spaceId: string) {
  const space = await getSpace(spaceId);

  if (space.identityType !== 'major') return;
  if (space.isUnlocked) return;

  const memberCount = await getMemberCount(spaceId);

  if (memberCount >= MAJOR_UNLOCK_THRESHOLD) {
    // 🎉 UNLOCK
    await updateSpace(spaceId, { isUnlocked: true });

    // Notify waitlist members
    const waitlist = await getWaitlist(spaceId);
    await notifyUsers(waitlist, {
      title: `${space.name} is now active!`,
      message: `Your major space is ready. Welcome home.`,
      type: 'celebration',
      action: { label: 'Enter Space', url: `/s/${space.handle}` }
    });

    // Create default boards
    await createDefaultBoards(spaceId, ['General', 'Study Groups', 'Projects', 'Resources']);
  }
}
```

**User-facing states:**
- `isUnlocked: true` → Show "✓ Active"
- `isUnlocked: false` → Show "🔒 Coming Soon"
- No numbers, no progress bars, no thresholds exposed

---

## Waitlist Flow

### Join Waitlist

```
[User clicks "Join Waitlist" on locked major space]

┌────────────────────────────────┐
│  You're on the waitlist!       │
│                                │
│  We'll notify you when Physics │
│  unlocks.                      │
│                                │
│  Want to help unlock it faster?│
│                                │
│  [Invite Classmates]           │
│  [Done]                        │
└────────────────────────────────┘
```

**Backend:**
- Add user to waitlist for that space
- When space unlocks → send notification
- Track waitlist position (for internal analytics only)

---

## Motion: Unlock Celebration

### When 10th Person Joins (They See Instant Access)

```tsx
// The 10th person sees immediate unlock
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
>
  <div className="space-unlocked">
    {/* Gold border draws in */}
    <AnimatedBorder color="gold" />

    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        ✨
      </motion.div>

      <h2>Welcome to Computer Science!</h2>
      <p>You unlocked this major space for everyone.</p>

      <Button variant="primary">Enter Space →</Button>
    </div>
  </div>
</motion.div>
```

### Waitlist Members Get Notification

```
┌────────────────────────────────┐
│  🎉 Physics is now active!     │
│                                │
│  Your major space unlocked.    │
│  Join your classmates.         │
│                                │
│  [Enter Space →]               │
└────────────────────────────────┘
```

---

## Examples: Identity in Action

### Example 1: International Transfer CS Major

**Identity tags:**
- 📚 Major: Computer Science
- 🏠 Home: Off-Campus
- 🤝 Community: International, Transfer

**Discovery Hub shows:**

Zone 1: "Your Identity on Campus"
```
📚 CS Major  •  🏠 Off-Campus  •  🌍 International  •  🔄 Transfer
```

Zone 2: Territory Map
```
📚 YOUR MAJOR          ⚡ YOUR INTERESTS
  Computer Science       Gaming Club
  (highlighted)          Tech Builders

🏠 YOUR HOME           🤝 YOUR COMMUNITY
  Off-Campus Buffalo     International Students
                        Transfer Students
                        (both highlighted)
```

**Result:** They see their major space, off-campus housing space, and both community spaces prominently.

---

### Example 2: Domestic First-Year Bio Major, On-Campus

**Identity tags:**
- 📚 Major: Biology
- 🏠 Home: Ellicott Complex
- 🤝 Community: First-Gen

**Discovery Hub shows:**

Zone 1:
```
📚 Bio Major  •  🏠 Ellicott  •  🎓 First-Gen
```

Zone 2: Territory Map
```
📚 YOUR MAJOR          ⚡ YOUR INTERESTS
  Biology (locked)       [empty state:
  (highlighted)          "Explore clubs"]

🏠 YOUR HOME           🤝 YOUR COMMUNITY
  Ellicott Complex       First-Gen Students
  (highlighted)          (highlighted)
```

**If Biology is locked, they see:**
- Join Waitlist option
- Invite Classmates link
- First-Gen Students space as alternative community

---

## Migration Plan

### Phase 1: Add Identity Fields
- Update user schema with community identities
- Add identity onboarding step to signup flow
- Backfill existing users (prompt on next login)

### Phase 2: Create Universal Communities
- Create International Students space (all campuses)
- Create Transfer Students space
- Create First-Gen, Commuter, Graduate, Veterans spaces
- Auto-join users based on tags

### Phase 3: Remap Existing Spaces
- Map university spaces → major spaces
- Set unlock status based on current member count
- Create waitlists for locked spaces

### Phase 4: Update Discovery Hub UI
- Rebuild territory map with identity quadrants
- Add personalization logic
- Add unlock celebration flows

---

## Open Questions

1. **Class year identity?** (Freshman, Sophomore, Junior, Senior spaces?)
2. **Multiple majors?** Double majors see both in quadrant?
3. **Changed major?** What happens to old major space membership?
4. **Unlock threshold variation?** Some majors harder to unlock (obscure fields)?
5. **Sub-communities?** "Transfer CS Students" as subset of "Transfer Students"?

---

**Next:** Should we build the identity onboarding flow first, or start with the territory map component?
