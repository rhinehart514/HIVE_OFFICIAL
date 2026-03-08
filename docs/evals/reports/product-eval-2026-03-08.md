## Product Eval: HIVE — 2026-03-08

### The 4-Second Test: 0.5/1.0
Landing page says "Say something. Your campus responds." with a prompt input and demo poll. In 4 seconds: it's some kind of campus tool builder. But the feeling is dev-tool, not campus culture. Black background, clean typography, structured sections — reads like a YC launch page, not something a UB sophomore sends to their groupchat. The demo section (typing animation → poll bars) is the strongest moment but it's below the fold. Hero leads with a text input, signaling "productivity tool" not "social platform."

Who is it for? Copy says campus, visual language says developers. Nothing signals college — no campus imagery, no social energy, no faces, no urgency tied to student life.

Why now? Social proof section tries ("650+ orgs") but it's a stat, not urgency. Compare: "Your org's election is in 3 days and you're still using Google Forms." That's urgency. This page has information.

Would I tap Sign up? Maybe, if someone told me to. I wouldn't screenshot it and send it to my roommate.

### The Empty Room Test: 0.3/1.0
This is where HIVE breaks down for new users.

- **Spaces empty state:** "You haven't joined any spaces yet. [Find your clubs]" — functional, dead. Compare Discord's server discovery with previews, member counts, activity indicators.
- **Discover/feed:** Requires fetching personalized events. New user with no spaces joined sees... what? Feed scoped to "personalized" events and "spaces you belong to." User who belongs to nothing gets empty feed on first authenticated experience. Fatal for retention.
- **Profile:** If user hasn't set handle, they see ProfileShell with "Complete your profile" — onboarding friction before value delivery. User hasn't made anything yet, hasn't felt value, app asks them to fill out a form.
- **First action:** Yellow FAB and Make tab exist, but default landing is `/discover` — browse-first page. For creation-first product, first thing you see should be creation surface, not empty feed.
- **Taps to first value:** Sign up → empty discover → tap Make → type prompt → classify → edit → deploy → get link → share → someone sees it. 8+ steps before anyone sees what you made.

### Creation-to-Distribution: 0.5/1.0
- **Creation speed:** Build page is strong. Type prompt → instant AI classification into poll/bracket/RSVP shell. Under 3 taps from intent to configured output if already on `/build`. AI classification with inline editors is a genuine differentiator.
- **Distribution:** After deploy, you get `{ toolId, shareUrl }`. Then what? Copy link, paste somewhere else. No share sheet with WhatsApp/iMessage/Instagram Story integrations. No "share to your spaces" shortcut. No suggested distribution. User manually figures out where to put the link.
- **Channel fit:** Shared link (`/t/[toolId]`) works in any chat. Non-authenticated users can interact. Good. But no evidence of rich link previews — does an iMessage link show "47 people voted" or generic HIVE card?
- **Social proof on output:** "Made with HIVE" footer exists on shared tools, but no evidence of live engagement counts on shared tool pages.

### Day 3 Return: 0.2/1.0
Weakest dimension. Previous eval already flagged it.

- **Anything different?** No. Discover page fetches same data. No "since you left" signal. No "your poll got 200 votes" notification-driven return.
- **Does app know you?** Barely. Spaces have unread dots. That's it.
- **Pull mechanism:** `PushNotificationRegistration` exists, auto-requests after "value moments" — architecturally correct but implementation is passive. No "your bracket entered round 3" push, no "Sarah responded to your poll" push, no digest email. Infrastructure exists, compelling triggers don't.
- **What would make you NOT open this?** Everything else is more interesting. GroupMe has conversations, Instagram has stories, Discord has pings. HIVE has nothing pulling you back.

### Competitive Position
| Screen | vs. | Verdict |
|--------|-----|---------|
| Feed/Home (Discover) | Instagram Explore, Discord home | **LOSES** — empty without pre-existing connections, no algorithmic discovery |
| Spaces | Discord servers, GroupMe groups | **LOSES** — no vibe preview, no voice, no real-time presence on list page |
| Create (/build) | Instagram Stories polls, Google Forms | **WINS** — AI-classified instant creation is genuinely faster and more capable |
| Events | UB events portal, word of mouth | **TIES** — structured events fine but no advantage over existing tools |
| Profile | LinkedIn, Instagram bio | **LOSES** — bento grid interesting but doesn't showcase impact |
| Share output | iMessage link, GroupMe post | **TIES** — link sharing works but no rich previews or native share integrations |

HIVE wins exactly one battle — creation. Everything else ties or loses to incumbents.

### Identity: 0.3/1.0
- **Swap the logo?** Yes. Black background, white text, monochromatic + gold — default aesthetic of every dark-mode SaaS tool. Gold accent isn't enough personality.
- **Signature interaction?** Typing-animation demo is close. AI classification flow is unique. But no signature feeling — no branded moment distinctly HIVE.
- **Visual language match audience?** No. College students live in color. HIVE's monochromatic + gold reads as premium developer tool, not campus social platform.
- **Warmth?** Almost none. No photography, no illustration, no personality in empty states. Landing page org marquee is closest thing to human presence.
- **Screenshot test?** No screen is screenshot-worthy.

### Escape Velocity
| Dimension | Score | Assessment |
|-----------|-------|------------|
| Network effects | 0.4 | More users → more poll responses → better data, but spaces need critical mass (5-10 active). 600+ pre-seeded spaces means engagement spread too thin. |
| Content compounding | 0.3 | Each creation is isolated. Poll ends, it's done. No trending, no "all-time greatest," no building on previous creations. |
| Habit formation | 0.2 | Trigger (want to ask campus something) → Action (build) → Reward (see responses). Loop exists but trigger too infrequent. No daily trigger in product. |
| Viral coefficient | 0.5 | Creator shares → non-users interact → "Made with HIVE" → some create. Mechanic sound but relies on creator's existing reach. HIVE doesn't amplify. |
| Switching cost | 0.1 | After 30 days, what do you lose? Poll history? Nothing irreplaceable. No social graph, no reputation, no content library. |

### Overall: 0.35/1.0
HIVE has one genuine product insight (AI-powered instant creation for campus) and has built a functional implementation. But the product surrounding that insight — distribution, retention, identity, empty states, return mechanisms — is generic startup infrastructure. Would not survive its first 100 users. Users would create one thing, share it, get some responses, and never come back.

The core loop (create → place → share → engage → see impact → create again) is theoretically complete but practically broken at 3 of 6 stages: "see impact" is passive, "create again" has no trigger, "place" requires spaces to have members.

### What's Keeping This Generic
1. Monochromatic dark mode aesthetic — signals developer tool, not campus culture
2. Browse-first IA — landing on `/discover` after auth when creation is the differentiator
3. Passive impact feedback — creator must check profile to see traction
4. Dead empty states — functional text with a button, no personality or urgency
5. No daily trigger — product waits for user to have a reason to create
6. Distribution is manual — copy link, paste somewhere, no native share integrations

### The 3 Changes That Would Matter Most
1. **Creation-first IA with active distribution**: After auth, land on creation — not discovery. After creating, offer "share to GroupMe / iMessage / your 3 spaces" with one tap. This changes the outcome because HIVE's only competitive win (fast creation) is currently disconnected from what happens after.

2. **Push-driven impact loop**: When poll hits 50 votes → push notification with current results + "share again" CTA. When someone in your space creates something → push "Sarah just made a bracket." Make the app the source of "something happened" not "go check if something happened." This changes the outcome because retention is 0.2 — without pull, every user is one-time.

3. **Visual identity that signals campus**: Color in the shell, campus-specific imagery in empty states ("nobody in SGA has posted yet — be the first"), personality in copy, illustration that feels young and social. This changes the outcome because the current visual identity actively repels the target user.

### Ceiling Gaps (feed forward to builder)
- **No return pull (0.2)** → next plan must add push notification triggers for engagement milestones + space activity
- **Dead empty states (0.3)** → next plan must replace every empty state with contextual, warm, action-oriented guidance
- **Generic visual identity (0.3)** → next plan must introduce color, illustration, or photography that signals campus culture
- **Passive impact feedback** → next plan must add real-time creation impact (live count on creator's screen, push on milestones)
- **Distribution is afterthought (0.5)** → next plan must make share flow primary post-creation action with native integrations
- **Browse-first IA for creation-first product** → next plan must reconsider default authenticated landing and new user flow
