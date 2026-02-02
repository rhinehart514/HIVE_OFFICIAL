# Quality Standards

"Done" is not "Good." Features work. They need to be flawless.

---

## What "Good" Means

| Dimension | Done | Good |
|-----------|------|------|
| **Speed** | Page loads | Feels instant (<100ms feedback on every action) |
| **Motion** | Static | Subtle, purposeful, guides attention |
| **Feedback** | Action completes | User knows it worked (visual confirmation) |
| **Loading** | Spinner | Skeleton that matches content shape |
| **Errors** | Alert box | Contextual, recoverable, human copy |
| **Empty states** | "Nothing here" | Guides next action, feels intentional |
| **Copy** | Functional | Clear, human, occasionally delightful |
| **Layout** | Content visible | No jank, no shift, proper hierarchy |
| **Affordances** | Clickable | Obviously clickable, hover states, focus states |

---

## Quality Tiers

| Tier | Bar | Systems |
|------|-----|---------|
| **Flawless** | Zero friction, delightful | Entry, Spaces, Discovery |
| **Good** | Smooth, professional | Home, Profiles, DMs, Notifications |
| **Acceptable** | Works, no embarrassments | HiveLab, Settings, Calendar |

---

## Quality Audit Questions

Before shipping, answer:

1. **Speed:** Is there any action without instant feedback?
2. **Confusion:** Is there any moment where user doesn't know what to do?
3. **Jank:** Is there any layout shift, flash, or stutter?
4. **Dead end:** Is there any state with no clear next action?
5. **Error:** What happens when things fail? Is it graceful?
6. **Delight:** Is there at least one moment that feels premium?

---

## Motion Standards

All motion uses `@hive/tokens/motion`:

```typescript
import {
  revealVariants,
  staggerContainerVariants,
  cardHoverVariants,
  MOTION
} from '@hive/tokens';

// Page/section entrance
<motion.div
  variants={staggerContainerVariants}
  initial="initial"
  animate="animate"
>
  {items.map(item => (
    <motion.div key={item.id} variants={revealVariants}>
      <Card />
    </motion.div>
  ))}
</motion.div>

// Interactive cards
<motion.div
  variants={cardHoverVariants}
  whileHover="hover"
  whileTap="tap"
>
  <Card />
</motion.div>
```

**Rules:**
- Duration: <300ms
- Easing: Use MOTION.ease tokens
- Purpose: Guide attention, confirm action, create continuity
- Never: Delay user, distract, or feel heavy

---

## Loading States

**Never:**
- Spinners (except tiny inline indicators)
- "Loading..." text
- Flash of empty content

**Always:**
- Skeleton that matches content shape
- Immediate visual feedback
- Optimistic UI where safe

---

## Error States

**Professional, not playful:**
- Clear what went wrong
- Clear how to fix it
- Recovery action visible

**Example:**
```
✗ "Oops! Something went wrong :("
✓ "Couldn't send message. Check your connection and try again."
```

---

## Empty States

**Never:**
- "Nothing here"
- "No results"
- Blank space

**Always:**
- Guide to next action
- Feel intentional, not broken

**Examples:**
```
✗ "No messages"
✓ "Start the conversation — say hello to your space"

✗ "No events"
✓ "No upcoming events. Explore spaces to find what's happening."

✗ "No results"
✓ "No spaces match that search. Try a different term or browse popular spaces."
```

---

## Startup Heuristics

When making decisions:

1. **Does this serve the core loop?** If no, kill it.
2. **Will a new user notice?** If no, defer it.
3. **Is this blocking launch?** If no, it can wait.
4. **Would this embarrass us?** If yes, fix or cut. If no, ship.
5. **Can humans solve this instead of code?** Often yes.
6. **Is there a simpler version?** Build that.
