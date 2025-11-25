# Component Information Architecture & AI Inspiration Guide
**How to Determine Component IA and Get AI to Give Strong Inspirations**

> **Purpose**: Understand current UI/UX state, determine component IA, and prompt AI effectively for component inspirations

---

## 📊 CURRENT STATE OF UI/UX SYSTEMS

### What Exists ✅

**Component Library**: 129+ components across atomic design hierarchy
```
packages/ui/src/atomic/
├── 00-Global/        (56 components: atoms, molecules, organisms)
├── 02-Feed/          (17 components)
├── 03-Spaces/        (15 components)
├── 04-Profile/       (7 components)
├── 05-HiveLab/       (6 components)
├── 06-Rituals/       (13 components)
└── 07-Admin/         (2 components)
```

**Design System**:
- ✅ Design tokens (`packages/tokens/src/`)
- ✅ Cognitive budgets (`packages/tokens/src/topology/slot-kit.ts`)
- ✅ Hooks (`packages/hooks/src/use-cognitive-budget.ts`)
- ✅ Storybook (port 6006, operational)

**Documentation**:
- ✅ Comprehensive topology guides (663+ lines)
- ✅ Component building guide
- ✅ Layout guide
- ✅ Cognitive budgets guide

### What's Documented But Not Implemented ❌

**Gap Analysis** (from `HIVE_UX_UI_OBJECTIVE_AUDIT.md`):
- ❌ Slot system (S0-S4, Z1, R) - documented but not implemented
- ❌ Cognitive budget enforcement - tokens/hooks exist but zero usage
- ⚠️ Domain types - mixed usage (~30% use `@hive/core` types)
- ⚠️ Loading states - ad-hoc, not systematic

---

## 🎯 HOW TO DETERMINE COMPONENT INFORMATION ARCHITECTURE

### Step 1: Identify Component Purpose

**Questions to Ask**:
1. **What problem does this component solve?**
   - "Display user profile information"
   - "Allow users to filter spaces"
   - "Show real-time notifications"

2. **Where is it used?**
   - Single feature (Feed, Spaces, Profile)
   - Multiple features (Global)
   - Specific context (Campus-specific)

3. **What's its atomic level?**
   - **Atom**: Single-purpose, no children (Button, Input, Badge)
   - **Molecule**: 2-3 atoms combined (SearchBar, FormField)
   - **Organism**: Complex feature component (PostCard, SpaceHeader)
   - **Template**: Page layout (FeedLayout, SpaceBoardLayout)

### Step 2: Determine Location in IA

**Decision Tree**:

```
Is it reusable across features?
├─ YES → 00-Global/
│   ├─ Single-purpose? → atoms/
│   ├─ 2-3 atoms? → molecules/
│   └─ Complex system? → organisms/
│
└─ NO → Feature-specific/
    ├─ Feed → 02-Feed/
    ├─ Spaces → 03-Spaces/
    ├─ Profile → 04-Profile/
    ├─ HiveLab → 05-HiveLab/
    ├─ Rituals → 06-Rituals/
    └─ Admin → 07-Admin/
```

**Examples**:

| Component | Purpose | Used In | Location |
|-----------|---------|---------|----------|
| `Button` | Single action | Everywhere | `00-Global/atoms/` |
| `SearchBar` | Search input + icon | Feed, Spaces | `00-Global/molecules/` |
| `PostCard` | Display post | Feed only | `02-Feed/organisms/` |
| `SpaceHeader` | Space info | Spaces only | `03-Spaces/molecules/` |
| `ProfileBentoGrid` | Profile layout | Profile only | `04-Profile/molecules/` |

### Step 3: Determine Atomic Level

**Atomic Design Decision Matrix**:

| Level | Characteristics | Examples | Location Pattern |
|-------|----------------|----------|------------------|
| **Atom** | - Single HTML element<br>- No children<br>- No business logic<br>- Pure presentation | Button, Input, Badge, Avatar | `[feature]/atoms/` |
| **Molecule** | - 2-3 atoms combined<br>- Simple composition<br>- Basic interactivity | SearchBar, FormField, CardHeader | `[feature]/molecules/` |
| **Organism** | - Complex composition<br>- Multiple molecules<br>- Business logic<br>- Feature-specific | PostCard, SpaceHeader, ProfileDashboard | `[feature]/organisms/` |
| **Template** | - Page-level layout<br>- Slot composition<br>- Route-specific | FeedLayout, SpaceBoardLayout | `[feature]/templates/` |

**Quick Test**:
- Can it exist alone? → **Atom**
- Does it combine 2-3 atoms? → **Molecule**
- Does it solve a complete feature problem? → **Organism**
- Does it define page structure? → **Template**

### Step 4: Name Component

**Naming Convention**:
```
[Purpose][Type][Variant?]

Examples:
- Button (atom)
- SearchBar (molecule)
- PostCard (organism)
- FeedLayout (template)
- SpaceHeader (molecule)
- ProfileBentoGrid (molecule)
```

**Rules**:
- ✅ Descriptive (what it does, not how)
- ✅ Consistent (Card, not CardComponent)
- ✅ Feature prefix for feature-specific (SpaceHeader, not Header)
- ❌ Generic (Component, Widget, Thing)

---

## 🤖 HOW TO GET AI TO GIVE STRONG COMPONENT INSPIRATIONS

### The Problem with Generic AI Prompts

**Bad Prompt**:
```
"Create a button component"
```

**Result**: Generic button, no context, no inspiration

### The Masterful AI Prompt Framework

**Structure**:
1. **Context** (What exists, what's the system)
2. **Inspiration** (What to reference)
3. **Constraints** (What limits exist)
4. **Specifics** (What exactly you need)
5. **Quality** (What makes it masterful)

### Framework Template

```markdown
## Context
- Component system: [Atomic design, feature-specific]
- Design system: [Tokens, patterns, constraints]
- Existing components: [Similar components that exist]
- Usage: [Where/how it's used]

## Inspiration
- Reference: [Linear/Vercel/Stripe/OpenAI]
- Pattern: [Specific pattern to emulate]
- Feel: [What emotion/experience]

## Constraints
- Cognitive budgets: [Max pins, widgets, CTAs]
- Performance: [Load time, interaction speed]
- Accessibility: [WCAG requirements]
- Mobile: [Mobile-first requirements]

## Specifics
- Purpose: [What problem it solves]
- Props: [Key props needed]
- States: [Loading, error, empty, success]
- Interactions: [Hover, focus, click]

## Quality
- Polish level: [Masterful YC company feel]
- Micro-interactions: [Animations, transitions]
- Attention to detail: [Focus states, loading states]
```

### Example: Strong AI Prompt

```markdown
## Context
- Component system: HIVE atomic design (atoms → molecules → organisms)
- Design system: Monochrome + Gold, Geist Sans, 4px grid, cognitive budgets
- Existing components: Button (00-Global/atoms/button.tsx), Card (00-Global/atoms/card.tsx)
- Usage: Space Board (03-Spaces/) - displays pinned posts above feed

## Inspiration
- Reference: Linear's pinned items (clean, minimal, gold accent)
- Pattern: Vertical stack with gold left border (not carousel)
- Feel: Calm, focused, premium (not Instagram colorful)

## Constraints
- Cognitive budgets: Max 2 pins (enforced via useCognitiveBudget hook)
- Performance: < 16ms interaction, 60fps scroll
- Accessibility: WCAG 2.1 AA, keyboard navigation
- Mobile: Stack vertically, full-width on < 768px

## Specifics
- Purpose: Display max 2 pinned posts above Space Board feed
- Props: pins: Post[], spaceId: string, isLeader: boolean
- States: Loading (skeleton), Empty (no pins), Error (retry)
- Interactions: Click to view, hover shows preview, keyboard nav

## Quality
- Polish level: Masterful YC company feel (Linear/Vercel quality)
- Micro-interactions: Smooth fade-in, gold border pulse on hover
- Attention to detail: Focus ring, loading skeleton matches layout, error recovery
```

### What Makes AI Inspirations Strong

#### 1. **Reference Real Examples**

**Bad**: "Make it look good"  
**Good**: "Like Linear's pinned items - vertical stack, gold left border, minimal"

**Why**: AI can reference actual patterns, not abstract concepts

#### 2. **Provide System Context**

**Bad**: "Create a card component"  
**Good**: "Create a card component using HIVE design tokens (bg-background-secondary, border-radius-md, shadow-default)"

**Why**: AI understands constraints and can work within your system

#### 3. **Specify Quality Level**

**Bad**: "Make it functional"  
**Good**: "Masterful YC company feel - smooth animations, pixel-perfect, accessible"

**Why**: AI knows the polish level expected (not MVP, but production-ready)

#### 4. **Include Constraints**

**Bad**: "Add as many features as possible"  
**Good**: "Max 2 pins (cognitive budget), < 16ms interaction, WCAG 2.1 AA"

**Why**: AI respects limits and builds within them

#### 5. **Show Examples**

**Bad**: "Make it like other components"  
**Good**: "Similar to existing PostCard (02-Feed/organisms/feed-card-post.tsx) but for pinned posts"

**Why**: AI can reference actual code patterns

---

## 🎨 AI INSPIRATION PATTERNS THAT WORK

### Pattern 1: Reference + Constraint

```
"Create a [component] like [reference] but with [constraint]"

Example:
"Create a pinned posts stack like Linear's pinned items but with max 2 items (cognitive budget)"
```

### Pattern 2: System + Quality

```
"Create a [component] using [design system] with [quality level]"

Example:
"Create a search bar using HIVE design tokens (monochrome + gold) with masterful YC company feel"
```

### Pattern 3: Problem + Solution

```
"Create a [component] that solves [problem] inspired by [reference]"

Example:
"Create a space header that displays space info and join button, inspired by Vercel's project headers"
```

### Pattern 4: Existing + Enhancement

```
"Enhance [existing component] with [feature] like [reference]"

Example:
"Enhance PostCard with optimistic updates like Linear's issue cards"
```

### Pattern 5: Complete Context

```
"Create a [component] for [feature] that [does X] using [system] with [quality]"

Example:
"Create a ritual strip for Feed that displays active rituals using HIVE design tokens with masterful polish"
```

---

## 📋 COMPONENT IA DECISION CHECKLIST

### Before Creating Component

- [ ] **Purpose defined**: What problem does it solve?
- [ ] **Location determined**: Global or feature-specific?
- [ ] **Atomic level identified**: Atom, Molecule, Organism, or Template?
- [ ] **Name chosen**: Descriptive, consistent naming
- [ ] **Similar components checked**: Does something similar exist?
- [ ] **Constraints known**: Cognitive budgets, performance, accessibility
- [ ] **Inspiration identified**: What reference (Linear/Vercel/etc.)?

### When Prompting AI

- [ ] **Context provided**: System, existing components, usage
- [ ] **Inspiration specified**: Reference + pattern + feel
- [ ] **Constraints listed**: Budgets, performance, accessibility
- [ ] **Specifics detailed**: Props, states, interactions
- [ ] **Quality level set**: Masterful, not MVP

---

## 🎯 EXAMPLE: Strong AI Prompt for New Component

### Scenario: Create a "Space Member List" Component

**Strong Prompt**:

```markdown
## Context
- Component system: HIVE atomic design, feature-specific (03-Spaces/)
- Design system: Monochrome + Gold, Geist Sans, 4px grid
- Existing components: UserAvatarGroup (00-Global/molecules/user-avatar-group.tsx), Card (00-Global/atoms/card.tsx)
- Usage: Space Board sidebar (R rail), shows members of a space

## Inspiration
- Reference: Linear's team member list (clean avatars, roles, online status)
- Pattern: Vertical list with avatars, names, roles, online indicators
- Feel: Calm, professional, campus-focused (not social media)

## Constraints
- Cognitive budgets: Max 20 visible members (then "Show more")
- Performance: Virtualized if > 50 members, < 16ms scroll
- Accessibility: Keyboard navigation, screen reader support
- Mobile: Full-width, touch-optimized (44px targets)

## Specifics
- Purpose: Display space members with roles and online status
- Props: members: Member[], spaceId: string, showRoles: boolean
- States: Loading (skeleton), Empty (no members), Error (retry)
- Interactions: Click member → profile sheet, hover shows role, keyboard nav

## Quality
- Polish level: Masterful YC company feel (Linear quality)
- Micro-interactions: Smooth avatar load, online indicator pulse
- Attention to detail: Focus ring, loading skeleton, error recovery, empty state with CTA
```

**Expected AI Output**:
- Component with proper TypeScript types
- Uses HIVE design tokens
- Respects cognitive budgets
- Includes loading/error/empty states
- Accessible and keyboard-navigable
- Smooth animations and micro-interactions

---

## 🔧 CURRENT COMPONENT IA STRUCTURE

### Actual Structure (packages/ui/src/atomic/)

```
00-Global/              # Reusable across all features
├── atoms/              # 38 components (Button, Input, Card, etc.)
├── molecules/          # 15 components (SearchBar, FormField, etc.)
├── organisms/          # 3 components (NotificationSystem, etc.)
└── templates/          # 1 component (AuthOnboardingLayout)

02-Feed/                # Feed-specific components
├── atoms/              # 6 components (MediaThumb, PostCard, etc.)
├── molecules/          # 6 components (FeedFilterBar, etc.)
├── organisms/          # 6 components (FeedCardPost, etc.)
└── templates/          # 2 components (FeedPageLayout, etc.)

03-Spaces/              # Space-specific components
├── atoms/              # 1 component (TopBarNav)
├── molecules/          # 10 components (SpaceHeader, SpaceComposer, etc.)
├── organisms/          # 2 components (SpaceBoardLayout, etc.)
└── templates/          # 1 component (SpaceBoardTemplate)

04-Profile/             # Profile-specific components
├── molecules/          # 1 component (ProfileBentoGrid)
├── organisms/          # 9 components (ProfileOverview, etc.)
└── templates/          # 1 component (ProfileViewLayout)

05-HiveLab/             # HiveLab-specific components
├── molecules/          # 4 components
└── organisms/          # 2 components

06-Rituals/             # Ritual-specific components
├── molecules/          # 4 components
├── organisms/          # 14 components
└── templates/          # 2 components

07-Admin/               # Admin-specific components
└── organisms/          # 6 components
```

### IA Principles Applied

1. **Progressive Disclosure**: Foundation → Components → Systems
2. **Feature Isolation**: Each feature has its own directory
3. **Atomic Hierarchy**: Atoms → Molecules → Organisms → Templates
4. **Reusability**: Global components in 00-Global/

---

## 💡 AI PROMPT TEMPLATES FOR COMMON SCENARIOS

### Template 1: New Atom Component

```markdown
Create a [component name] atom component for HIVE design system.

Context:
- Location: [00-Global/atoms/] or [feature]/atoms/
- Design system: HIVE tokens (monochrome + gold, Geist Sans, 4px grid)
- Similar components: [list similar atoms]

Inspiration:
- Reference: [Linear/Vercel/Stripe component]
- Pattern: [specific pattern]
- Feel: [emotion/experience]

Constraints:
- Performance: < 16ms interaction
- Accessibility: WCAG 2.1 AA
- Mobile: 44px touch targets

Specifics:
- Purpose: [what it does]
- Props: [key props]
- Variants: [if any]
- States: [default, hover, focus, disabled, loading]

Quality:
- Masterful YC company feel
- Smooth micro-interactions
- Pixel-perfect alignment
```

### Template 2: New Molecule Component

```markdown
Create a [component name] molecule component that combines [atom 1] + [atom 2] + [atom 3].

Context:
- Location: [00-Global/molecules/] or [feature]/molecules/
- Composes: [list atoms it uses]
- Usage: [where/how it's used]

Inspiration:
- Reference: [Linear/Vercel component]
- Pattern: [composition pattern]
- Feel: [emotion/experience]

Constraints:
- Cognitive budgets: [if applicable]
- Performance: < 16ms interaction
- Accessibility: Keyboard navigation, screen reader

Specifics:
- Purpose: [what problem it solves]
- Props: [key props]
- Slots: [if flexible composition]
- States: [loading, error, empty]

Quality:
- Masterful polish
- Smooth animations
- Consistent with design system
```

### Template 3: New Organism Component

```markdown
Create a [component name] organism component for [feature].

Context:
- Location: [feature]/organisms/
- Feature: [Feed/Spaces/Profile/etc.]
- Composes: [list molecules/atoms it uses]
- Usage: [specific use case]

Inspiration:
- Reference: [Linear/Vercel/Stripe component]
- Pattern: [complex pattern]
- Feel: [emotion/experience]

Constraints:
- Cognitive budgets: [max pins, widgets, CTAs]
- Performance: < 1.8s load, < 16ms interaction
- Accessibility: Full WCAG 2.1 AA
- Mobile: Mobile-first, 375px viewport

Specifics:
- Purpose: [complete feature problem]
- Props: [domain types from @hive/core]
- States: [loading skeleton, error recovery, empty state]
- Interactions: [all user interactions]

Quality:
- Masterful YC company feel
- Production-ready polish
- Smooth animations, micro-interactions
- Error boundaries, loading states
```

---

## 🎨 REFERENCE LIBRARY FOR AI INSPIRATION

### When Prompting AI, Reference These Patterns

**Linear**:
- Pinned items (vertical stack, gold accent)
- Issue cards (clean, minimal, keyboard-first)
- Command palette (Cmd+K, instant search)

**Vercel**:
- Project headers (clean, minimal, monochrome)
- Dashboard cards (subtle borders, no shadows)
- Navigation (collapsible sidebar)

**Stripe**:
- Form fields (clear labels, inline validation)
- Dashboard widgets (clean data display)
- Settings pages (progressive disclosure)

**OpenAI**:
- Chat interface (conversational, warm)
- Loading states (smooth, informative)
- Error recovery (helpful, not technical)

**Figma**:
- Canvas interactions (smooth drag, snap guides)
- Property panels (organized, clear)
- Tool palettes (categorized, searchable)

---

## 📊 COMPONENT IA DECISION MATRIX

| Component Type | Atomic Level | Location | Naming Pattern | Example |
|----------------|--------------|----------|----------------|---------|
| **Primitive** | Atom | `00-Global/atoms/` | `[Name]` | `Button`, `Input`, `Badge` |
| **Composition** | Molecule | `00-Global/molecules/` or `[feature]/molecules/` | `[Name][Type]` | `SearchBar`, `FormField`, `SpaceHeader` |
| **Feature Block** | Organism | `[feature]/organisms/` | `[Feature][Name]` | `PostCard`, `SpaceBoardLayout`, `ProfileDashboard` |
| **Page Layout** | Template | `[feature]/templates/` | `[Feature]Layout` | `FeedLayout`, `SpaceBoardTemplate` |

---

## 🚀 QUICK REFERENCE: AI PROMPT CHECKLIST

### ✅ Strong AI Prompt Includes

1. **Context** (System, existing components, usage)
2. **Inspiration** (Reference + pattern + feel)
3. **Constraints** (Budgets, performance, accessibility)
4. **Specifics** (Props, states, interactions)
5. **Quality** (Masterful level, polish expectations)

### ❌ Weak AI Prompt Missing

- No context (AI doesn't know your system)
- No inspiration (generic output)
- No constraints (AI adds unnecessary features)
- No specifics (vague requirements)
- No quality level (MVP instead of masterful)

---

## 📝 EXAMPLE: Complete Component Creation Flow

### Step 1: Determine IA

**Component**: "Space Member List"

**Questions**:
- Purpose? → Display space members
- Used where? → Space Board sidebar (R rail)
- Atomic level? → Organism (complex, feature-specific)
- Location? → `03-Spaces/organisms/space-member-list.tsx`

### Step 2: Check Existing

```bash
# Check for similar components
grep -r "member\|user.*list" packages/ui/src/atomic/03-Spaces/
# Result: No existing member list component
```

### Step 3: Create AI Prompt

Using the framework above, create comprehensive prompt with:
- Context (HIVE system, Space Board usage)
- Inspiration (Linear's team list)
- Constraints (Max 20 visible, virtualized, accessible)
- Specifics (Props, states, interactions)
- Quality (Masterful polish)

### Step 4: Review AI Output

**Check**:
- ✅ Uses HIVE design tokens
- ✅ Respects cognitive budgets
- ✅ Includes loading/error/empty states
- ✅ Accessible (keyboard nav, screen reader)
- ✅ Mobile-optimized
- ✅ Smooth animations

### Step 5: Integrate

- Add to `03-Spaces/organisms/`
- Export from `03-Spaces/index.ts`
- Create Storybook story
- Use in Space Board

---

## 🎯 CONCLUSION

### Current State
- ✅ 129+ components exist
- ✅ Atomic design structure in place
- ✅ Design system documented
- ⚠️ Slot system not implemented
- ⚠️ Cognitive budgets not enforced

### IA Determination
1. Identify purpose and usage
2. Determine atomic level (atom/molecule/organism/template)
3. Choose location (global vs feature-specific)
4. Name consistently

### AI Inspiration
1. Provide full context (system, existing, usage)
2. Specify inspiration (reference + pattern + feel)
3. List constraints (budgets, performance, accessibility)
4. Detail specifics (props, states, interactions)
5. Set quality level (masterful, not MVP)

**The Secret**: The more context you give AI, the better the output. Don't ask for "a button" - ask for "a button using HIVE design tokens, inspired by Linear's buttons, with masterful polish."

---

**Next Steps**:
1. Use IA decision tree for new components
2. Use AI prompt framework for component creation
3. Reference masterful YC companies for inspiration
4. Enforce cognitive budgets and design tokens









