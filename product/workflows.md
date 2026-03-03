# HIVE Core Workflows

## The Primary Loop

```
CREATE ──> PLACE ──> SHARE ──> ENGAGE ──> SEE IMPACT ──> CREATE AGAIN
Build     Build→    Space/     Space      Profile        Build
/build    Space     Link       /s/[h]     /u/[h]         /build
          sheet     + push                               "My Apps"
```

Every feature must make one step faster, more reliable, or more obvious.

---

## Workflow 1: Leader Creates an App

**Surface:** Build (`/build`)
**User:** Org leader
**Value mechanism:** Speed
**Success:** Working app in <60 seconds

### Steps
1. Leader opens Make tab
2. Types prompt (e.g., "Best dining hall on campus")
3. System classifies → shell match (poll, bracket, RSVP) or code gen
4. Leader sees preview, edits config if needed
5. Taps "Create" → tool doc created in Firestore

### Eval criteria
- Classification accuracy: right format >80% of the time
- Time to preview: <3 seconds for shell match, <15 seconds for code gen
- Zero dead ends: error states always have "Try again" action

---

## Workflow 2: Leader Places App in Space

**Surface:** Build → Space
**User:** Org leader
**Value mechanism:** Loop closure
**Success:** App visible in space's Apps tab

### Steps
1. After creation, Build shows "Place in a Space" sheet
2. If `?spaceId` present, auto-selects that space (one-tap deploy)
3. If no space context, shows picker with leader's spaces
4. On placement: `POST /api/tools/{toolId}/deploy` → deployment doc created
5. Navigate to `/s/[handle]?tab=apps`

### Eval criteria
- Placement rate: >70% of created apps get placed (vs. abandoned)
- One-tap placement when spaceId in context
- "Not placed yet" indicator on My Apps cards drives completion

---

## Workflow 3: Leader Shares with Members

**Surface:** Space + external
**User:** Org leader
**Value mechanism:** Reach
**Success:** Members receive notification and tap through

### Steps
1. After placement, Share Sheet offers: notify members + copy link
2. Push notification sent to all space members via FCM
3. Notification text: "[Creator] added [App Name] to [Space]"
4. Members tap → land on `/s/[handle]?app={toolId}`

### Eval criteria
- Notification delivery rate: >90% of active members
- Tap-through rate: >30% of notified members open the app
- Link works in GroupMe/iMessage (standalone URL `/t/{toolId}`)

---

## Workflow 4: Member Engages with App

**Surface:** Space (`/s/[handle]`)
**User:** Space member
**Value mechanism:** Engagement
**Success:** Member interacts (votes, RSVPs, submits)

### Steps
1. Member opens space (from notification or browse)
2. Sees app in Apps tab or inline in chat (slash command)
3. Interacts: votes on poll, RSVPs, fills out signup
4. State updates in real-time via Firebase RTDB
5. Other members see updated counts live

### Eval criteria
- Interaction rate: >50% of members who view an app interact with it
- Latency: vote/RSVP reflects in <200ms (optimistic UI)
- Works without auth for standalone URLs (`/t/{toolId}`)

---

## Workflow 5: Creator Sees Impact

**Surface:** Profile (`/u/[handle]`)
**User:** Creator (org leader)
**Value mechanism:** Loop closure (creates motivation for next creation)
**Success:** Creator sees engagement numbers and feels it was worth it

### Steps
1. Creator gets "Someone used your app" notification
2. Opens profile → sees participation count ("47 people participated")
3. Per-app impact lines show contextual numbers (votes, RSVPs)
4. Stats Row shows Reach (total unique users)
5. Creator thinks "That worked. I should make another one."

### Eval criteria
- Participation count visible within 2 seconds of profile load
- Numbers are contextual (not just "47 runs" — "47 votes")
- "Create your next app" CTA visible on own profile

---

## Workflow 6: Student Discovers via Feed

**Surface:** Feed (`/discover`)
**User:** Any student
**Value mechanism:** Aliveness
**Success:** Student finds something to engage with or a space to join

### Steps
1. Student opens HIVE → lands on Feed
2. Sees sectioned content: Live Now, Today, Your Spaces, New Apps, Discover
3. Taps event → EventDetailDrawer → RSVPs or views space
4. Taps space card → joins → becomes a member
5. Joins a space → now sees "Your Spaces" section on next visit

### Eval criteria
- Feed is never fully empty (650+ pre-seeded spaces = Discover section always populated)
- Time to first interaction: <10 seconds (event RSVP or space join)
- Returning user sees different content (time-based feed handles this naturally)

---

## Workflow 7: Stranger Uses Standalone Link

**Surface:** Standalone (`/t/{toolId}`)
**User:** Non-HIVE user (friend of a creator)
**Value mechanism:** Reach (viral growth)
**Success:** Stranger uses the app and sees HIVE branding

### Steps
1. Creator shares link in GroupMe/iMessage
2. Friend taps link → opens `/t/{toolId}` (no auth required)
3. Sees the app (poll, bracket, RSVP) and interacts
4. Sees "Made with HIVE" footer
5. Some tap through to download/sign up

### Eval criteria
- Renders without auth on mobile browsers
- Interaction works (voting, RSVP) without account
- HIVE branding visible but not intrusive
- Deep link works when HIVE PWA is installed
