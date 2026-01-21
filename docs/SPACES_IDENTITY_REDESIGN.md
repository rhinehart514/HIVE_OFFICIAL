# Spaces — Identity-First Redesign

**Core Insight:** Spaces aren't organizational categories. They're **identity containers**.

The question isn't "What type of space is this?"
The question is: **"Who are you on campus?"**

---

## The Identity Framework

### Everyone Has These Identities:

1. **MAJOR** — What you study (CS, Physics, Bio, etc.)
2. **HOME** — Where you live (Ellicott, Governors, off-campus)
3. **INTERESTS** — What you love (Gaming, Photography, Basketball)
4. **COMMUNITY** — Who you belong to (Greek, cultural orgs, teams, identity groups)

**Critical difference:**
- Old: 🏛️ University / ✨ Student / 👑 Greek / 🏠 Residential
- New: 📚 Your Major / 🏠 Your Home / ⚡ Your Interests / 🤝 Your Community

**Why this works:**
- ✓ Everyone has a major → everyone gets a space
- ✓ Everyone lives somewhere → everyone gets a space
- ✓ Everyone has interests → everyone gets spaces
- ✓ Community is optional but powerful when it applies

---

## Territory Map — Identity Version

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   📚  YOUR MAJOR              ⚡  YOUR INTERESTS        │
│   ─────────────────            ─────────────────        │
│                                                         │
│   ┌──────────┐                 ┌──────────┐            │
│   │ Computer │                 │ Gaming   │            │
│   │ Science  │                 │ Club  ●  │            │
│   │          │                 │ 89 here  │            │
│   │ 🔓 10/10 │                 └──────────┘            │
│   │ UNLOCKED │                                         │
│   └──────────┘                 ┌──────────┐            │
│                                │ Photo    │            │
│   ┌──────────┐                 │ Club  ●  │            │
│   │ Physics  │                 │ 56 here  │            │
│   │          │                 └──────────┘            │
│   │ 🔒 3/10  │                                         │
│   │ COMING   │                 [Explore all →]         │
│   │ SOON     │                                         │
│   └──────────┘                                         │
│                                                         │
│   [Explore majors →]                                   │
│                                                         │
│   ─────────────────────────────────────────────────    │
│                                                         │
│   🏠  YOUR HOME               🤝  YOUR COMMUNITY       │
│   ─────────────────            ─────────────────        │
│                                                         │
│   ┌──────────┐                 ┌──────────┐            │
│   │ Ellicott │                 │ Alpha    │            │
│   │ Complex  │                 │ Chi   ●  │            │
│   │ • 312    │                 │ 178 here │            │
│   └──────────┘                 └──────────┘            │
│                                                         │
│   ┌──────────┐                 ┌──────────┐            │
│   │Governors │                 │ BSU      │            │
│   │ Hall  ●  │                 │ • 89     │            │
│   │ 89 here  │                 └──────────┘            │
│   └──────────┘                                         │
│                                                         │
│   [Explore dorms →]            [Explore groups →]      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Major Spaces — The Unlock Mechanic

### How It Works

**Every major gets a space**. But they unlock when 10 students join:

```
┌────────────────────────────────┐
│  Computer Science              │
│                                │
│  🔓 UNLOCKED                   │
│  247 students in this space    │
│                                │
│  ┌──────────┐  ┌──────────┐   │
│  │ General  │  │ Projects │   │
│  │ • 23     │  │ • 8      │   │
│  └──────────┘  └──────────┘   │
│                                │
│  [Enter Space →]               │
└────────────────────────────────┘

┌────────────────────────────────┐
│  Physics                       │
│                                │
│  🔒 COMING SOON                │
│  3 of 10 students needed       │
│                                │
│  Be the first to unlock this   │
│  major's space. Invite friends!│
│                                │
│  [Invite Classmates]           │
│  [Notify Me When Unlocked]     │
└────────────────────────────────┘
```

### Visual States

**Unlocked (10+ members):**
- ✓ Gold unlock icon
- ✓ Shows member count
- ✓ Shows boards preview
- ✓ Enter button is primary CTA

**Locked (< 10 members):**
- Lock icon (white/60)
- Progress: "3/10 students"
- "Coming Soon" badge
- CTA: Invite classmates

**Your Major (Personalized):**
- If user's major is unlocked → highlight it with gold accent
- If user's major is locked → show "You're #3! Invite 7 more"

---

## Identity Quadrant Details

### 📚 YOUR MAJOR

**What It Shows:**
- Your major space (highlighted with gold if unlocked)
- Related major spaces (CS shows: Math, Engineering, Physics)
- Lock/unlock states for all

**Personalization:**
- On signup, we ask: "What's your major?"
- This quadrant centers on YOUR major
- Related majors shown as neighbors

**Empty State:**
- If major not selected → "Tell us your major to unlock your space"
- Links to profile settings

### 🏠 YOUR HOME

**What It Shows:**
- Your residence hall (if on-campus)
- Or "Off-Campus Students" space (if off-campus)
- Nearby residence halls

**Personalization:**
- On signup: "Where do you live?"
- This quadrant shows YOUR home first
- Other dorms as alternatives

**Special Cases:**
- Off-campus → shows "Off-Campus Buffalo" space
- Commuter → shows "Commuter Students" space
- Everyone has a home space, always

### ⚡ YOUR INTERESTS

**What It Shows:**
- Clubs/orgs you've joined
- Recommended based on profile
- Most active interest spaces

**Personalization:**
- If no interests joined → shows popular + onboarding prompt
- If interests selected → shows YOUR clubs first
- Adaptive based on engagement

### 🤝 YOUR COMMUNITY

**What It Shows:**
- Greek life (if applicable)
- Cultural organizations (BSU, Hillel, etc.)
- Identity groups (LGBTQ+, etc.)
- Sport teams
- Special interest communities

**Personalization:**
- If Greek → shows your chapter + council
- If cultural org → shows your orgs
- If neither → shows "Find Your Community"

**Critical:** This quadrant is **optional identity**. Not everyone is Greek. But everyone who IS greek needs this to be prominent.

---

## Full Discovery Hub — Identity Version

```
═══════════════════════════════════════════════════════════════
                    ZONE 1: WHO YOU ARE (Above Fold)
───────────────────────────────────────────────────────────────

                    Your Identity on Campus

              📚 CS Major  •  🏠 Ellicott  •  ⚡ Gamer

        ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
        │  📚     │  │  🏠     │  │  🎮     │  │  🏀     │
        │  CS     │  │Ellicott│  │  Gaming │  │  Hoops  │
        │  Major  │  │  Hall  │  │  Club   │  │  Team   │
        │         │  │         │  │         │  │         │
        │ • 247   │  │ • 89    │  │ • 156   │  │ offline │
        │ 23 onln │  │ 12 onln │  │ 34 onln │  │         │
        └─────────┘  └─────────┘  └─────────┘  └─────────┘

                    [Complete Your Identity →]

                                                    ↓ SCROLL
───────────────────────────────────────────────────────────────
                    ZONE 2: BUILD YOUR IDENTITY
                    (Territory Map — Identity Version)
───────────────────────────────────────────────────────────────

                    Build Your Campus Identity

        [Territory map with 4 identity quadrants as shown above]

                                                    ↓ SCROLL
───────────────────────────────────────────────────────────────
                    ZONE 3: UNLOCK YOUR POTENTIAL
───────────────────────────────────────────────────────────────

                    Unlock More Spaces

        ┌─────────────────────────────────────────────────┐
        │                                                 │
        │  🔓 Help unlock major spaces                    │
        │     Your major needs 10 students to unlock      │
        │                                                 │
        │     ┌──────────────────────────────────┐        │
        │     │  Computer Science: 247 ✓         │        │
        │     │  Physics: 3/10 🔒                │        │
        │     │  Biology: 8/10 🔒 (almost!)      │        │
        │     └──────────────────────────────────┘        │
        │                                                 │
        │     [Invite Classmates]                         │
        │                                                 │
        └─────────────────────────────────────────────────┘

        ┌─────────────────────────────────────────────────┐
        │                                                 │
        │  ✨ Create your own space                       │
        │     Start a club, group, or community           │
        │                                                 │
        │     • Full control                              │
        │     • Grow your community                       │
        │     • Build something new                       │
        │                                                 │
        │     [Create Space →]                            │
        │                                                 │
        └─────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## Onboarding — Identity Collection

**Critical:** We need to know their identity to personalize the territory map.

### During Signup Flow

```
STEP 1: Email verification
STEP 2: Basic info (name, handle)
STEP 3: ⭐ BUILD YOUR IDENTITY (NEW)
STEP 4: Done → Discovery Hub
```

### Identity Builder Screen

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
│  🤝 Any communities? (optional)                 │
│  [ ] Greek Life                                 │
│  [ ] Cultural Organizations                     │
│  [ ] LGBTQ+                                     │
│  [ ] Religious Groups                           │
│  [ ] None of these                              │
│                                                 │
│  ───────────────────────────────────────────    │
│                                                 │
│  [Skip for Now]          [Continue →]           │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Smart Defaults:**
- Major: Detected from email domain pattern or ask
- Home: Detected from signup location or ask
- Interests: Optional, shown later in empty states
- Community: Fully optional

---

## Data Model Changes

### User Profile (Add Fields)

```typescript
interface UserProfile {
  // Existing fields...

  // New identity fields
  major?: string;              // "Computer Science"
  majorSpaceId?: string;       // Linked space ID
  residenceType: 'on-campus' | 'off-campus' | 'commuter';
  residenceHall?: string;      // "Ellicott Complex"
  residenceSpaceId?: string;   // Linked space ID
  interests: string[];         // ["gaming", "photography", "tech"]
  communities: string[];       // ["greek", "cultural", "lgbtq"]
}
```

### Space Model (Add Fields)

```typescript
interface Space {
  // Existing fields...

  // New identity fields
  identityType: 'major' | 'residence' | 'interest' | 'community';
  majorName?: string;          // "Computer Science"
  unlockThreshold?: number;    // 10 for major spaces
  isUnlocked: boolean;         // True if memberCount >= threshold
  relatedSpaces?: string[];    // Related major/interest spaces
}
```

### Major Space Unlock Logic

```typescript
// Check unlock status on member join
async function checkMajorUnlock(spaceId: string) {
  const space = await getSpace(spaceId);

  if (space.identityType !== 'major') return;
  if (space.isUnlocked) return;

  const memberCount = await getMemberCount(spaceId);

  if (memberCount >= (space.unlockThreshold || 10)) {
    // 🎉 UNLOCK MOMENT
    await updateSpace(spaceId, { isUnlocked: true });

    // Notify all members who joined pre-unlock
    await notifyMembers(spaceId, {
      title: `${space.name} is now unlocked!`,
      message: `${memberCount} students have joined. Your major space is live.`,
      type: 'celebration'
    });

    // Create default boards
    await createDefaultBoards(spaceId, ['General', 'Study Groups', 'Projects']);
  }
}
```

---

## Motion: Identity Reveal

### Zone 1: Identity Badge Sequence

```tsx
// User's identity components reveal in sequence
const identityBadges = {
  major: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { delay: 0.2, duration: 0.4 } }
  },
  home: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { delay: 0.35, duration: 0.4 } }
  },
  interest: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { delay: 0.5, duration: 0.4 } }
  }
};

// Rendered as:
// "📚 CS Major  •  🏠 Ellicott  •  ⚡ Gamer"
```

### Zone 2: Territory Map (Same as Hybrid)

But now territories are identity-based:
- Top-left: 📚 YOUR MAJOR (personalized, shows YOUR major first)
- Top-right: ⚡ YOUR INTERESTS
- Bottom-left: 🏠 YOUR HOME
- Bottom-right: 🤝 YOUR COMMUNITY

### Lock/Unlock Animation

```tsx
// Locked state (pulsing lock icon)
const lockPulse = {
  scale: [1, 1.1, 1],
  opacity: [0.6, 1, 0.6],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut'
  }
};

// Unlock moment (when 10th person joins)
const unlockCelebration = {
  // Lock icon fades out
  lock: {
    opacity: [1, 0],
    scale: [1, 0.8],
    transition: { duration: 0.3 }
  },
  // Unlock icon scales in with gold glow
  unlock: {
    opacity: [0, 1],
    scale: [0.8, 1.2, 1],
    transition: { delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  },
  // Gold border draws around card
  border: {
    scaleX: [0, 1],
    transition: { delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};
```

---

## Examples: How Identity Shapes Experience

### Example 1: CS Major, On-Campus, Gamer, Not Greek

**Discovery Hub shows:**
- Zone 1: CS Major space, Ellicott Hall, Gaming Club (prominent)
- Zone 2:
  - 📚 YOUR MAJOR: CS (highlighted), Math, Engineering, Physics
  - ⚡ YOUR INTERESTS: Gaming Club, Esports, Tech Club
  - 🏠 YOUR HOME: Ellicott Complex, Governors, Richmond
  - 🤝 YOUR COMMUNITY: "Find Your Community" (empty state)

### Example 2: Bio Major, Off-Campus, Greek, Photography

**Discovery Hub shows:**
- Zone 1: Bio Major space (locked, 4/10), Off-Campus Students, Alpha Chi, Photo Club
- Zone 2:
  - 📚 YOUR MAJOR: Biology (4/10 locked), Chemistry, Pre-Med
  - ⚡ YOUR INTERESTS: Photography Club, Art Club
  - 🏠 YOUR HOME: Off-Campus Buffalo (large community space)
  - 🤝 YOUR COMMUNITY: Alpha Chi Omega, Panhellenic Council

### Example 3: Undecided Major, Freshman, No Interests Yet

**Discovery Hub shows:**
- Zone 1: Empty state with identity prompts
- Zone 2:
  - 📚 YOUR MAJOR: "Choose your major" CTA
  - ⚡ YOUR INTERESTS: "Explore clubs" + popular clubs
  - 🏠 YOUR HOME: Their dorm (if provided)
  - 🤝 YOUR COMMUNITY: "Find Your Community"

---

## Migration Strategy

### Existing Spaces → Identity Types

```typescript
// Map existing categories to identity types
const categoryToIdentity = {
  'university': 'major',        // Departments become majors
  'student_org': 'interest',    // Student orgs become interests
  'greek': 'community',         // Greek stays community
  'residential': 'residence'    // Residential becomes residence
};

// Migration script
async function migrateToIdentity() {
  const spaces = await getAllSpaces();

  for (const space of spaces) {
    const identityType = categoryToIdentity[space.category];

    await updateSpace(space.id, {
      identityType,
      isUnlocked: space.memberCount >= 10,  // Grandfather existing spaces
      unlockThreshold: identityType === 'major' ? 10 : undefined
    });
  }
}
```

---

## Questions to Answer

1. **Major detection:** Ask on signup or infer from course data?
2. **Lock threshold:** 10 students for major unlock, or different number?
3. **Unlock celebration:** In-app notification, email, or both?
4. **Identity update:** Can users change major/home after signup? How often?
5. **Territory ordering:** Major/Home/Interests/Community, or different priority?
6. **Off-campus handling:** One big "Off-Campus" space or neighborhood-based?
7. **Empty identity:** If no major selected, hide that quadrant or show prompt?

---

**This fundamentally changes the Spaces experience from "browse organizations" to "express your identity."**

What do you think? Should we refine the identity categories further, or start building this structure?
