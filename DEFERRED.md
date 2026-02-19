# DEFERRED.md — Features Parked for Future Integration

**Rule: Nothing here is "cut." It's deferred.** Every item has a trigger condition for when it comes back. When HIVE hits that trigger, the feature gets built properly — not hacked back in.

---

## Tier 1 — Bring Back at 1,000 Users

| Feature | What It Does | Why Deferred | Reintegration Path |
|---------|-------------|-------------|-------------------|
| **Ghost Mode** | User goes invisible across the platform | Zero users to hide from yet | Re-add as privacy toggle in /settings. GhostModeModal + GhostModeCountdown components exist — restore from git history |
| **People You May Know** | Friend recommendations based on interests/spaces | Needs user graph data to be meaningful | Wire to interests + shared space membership. PeopleYouMayKnow.tsx exists |
| **Feed Ranking Service** | ML-based content ranking in discovery feed | Chronological is correct until content volume demands ranking | Restore feed-ranking.service.ts + get-personalized-feed.query.ts when daily posts exceed ~500 |
| **Profile Activity Heatmap** | GitHub-style contribution graph on profiles | No creation data to visualize yet | Restore ProfileActivityHeatmap.tsx, feed from HiveLab creation events |
| **Space Analytics** | Dashboard for space leaders showing engagement metrics | Need real engagement data first | /api/spaces/[spaceId]/analytics route exists — just needs real data flowing |

## Tier 2 — Bring Back at 5,000 Users

| Feature | What It Does | Why Deferred | Reintegration Path |
|---------|-------------|-------------|-------------------|
| **Connection Strength** | Calculates relationship depth between users | Needs months of interaction data | connection-strength.value.ts has the algorithm — feed from chat frequency + event co-attendance + space overlap |
| **Builder XP / Gamification** | XP points and levels for creating things | Gamification on an empty platform feels desperate | builder-xp.ts + BuilderLevel.tsx exist. Restore when creation volume is high enough that leaderboards feel earned |
| **Notification Batching** | "3 new messages in Chess Club" instead of 3 separate pings | Single notifications are fine at low volume | Batch logic in notification-delivery-service.ts. Add time-window grouping when notification volume causes fatigue |
| **Sharded Member Counter** | Distributed counter for space membership at scale | Firestore can handle simple increments to ~1000 writes/sec | sharded-member-counter.service.ts ready to deploy when any space exceeds ~10K members |
| **Email Notification Digests** | Daily/weekly email summary | Need enough activity to digest | Build as a Cloud Function cron. Template from notification preferences already in /api/profile/notifications/preferences |

## Tier 3 — Bring Back at 10,000+ Users / Multi-Campus

| Feature | What It Does | Why Deferred | Reintegration Path |
|---------|-------------|-------------|-------------------|
| **Boards/Tabs/Widgets** | Customizable space layouts beyond Chat+Events+Members | Adds complexity before the core loop is proven | Full system exists in subcollections. Restore BoardTabs, AddTabModal, AddWidgetModal when spaces need differentiation |
| **Setups/Orchestration** | Multi-step automated workflows (Zapier-lite) | Power-user feature, not onboarding feature | /lab/setups/*, /api/setups/* are complete. Restore when creators ask for automation |
| **Automation Engine** | Triggers + conditions + actions for tools | Same as setups — power-user feature | automations-panel.tsx, automation-builder-modal.tsx, automation-executor.service.ts all exist |
| **Custom Blocks** | User-defined HiveLab elements | 30+ built-in elements is plenty for now | custom-block-generator.service.ts + custom-block-element.tsx. Restore when element library feels limiting |
| **Learning/ML Pipeline** | AI that improves from user edits | Needs thousands of edit sessions to learn from | packages/core/src/application/hivelab/learning/ — 5 files. Restore when generation quality needs improvement beyond prompt engineering |
| **Connection System** | Tool-to-tool data flow | Single tools are the right abstraction for now | connections-panel.tsx, connection-builder-modal.tsx, connection-resolver.service.ts. Restore for "app" use cases |
| **Smart Guides / Canvas Minimap** | Figma-style alignment + overview | Only matters when tools have 20+ elements | Restore from git when tool complexity demands it |
| **Space Modes** | Custom navigation modes within spaces | Simple tabs work for now | EventsMode, MembersMode, ToolsMode exist. Restore when spaces need more than 3 tabs |
| **DDD Infrastructure** | Aggregates, value objects, specifications in packages/core | Over-architecture for a Firebase CRUD app at this scale | If HIVE migrates to a proper backend (Postgres, etc.), this DDD layer becomes valuable. Don't rewrite — just restore |

## Tier 4 — Design Polish (Revisit After PMF)

| Feature | What It Does | Why Deferred | Reintegration Path |
|---------|-------------|-------------|-------------------|
| **Page Transitions** | Animated route transitions | Performance > animation during growth phase | page-transitions.tsx, PageTransition.tsx. Restore as polish pass |
| **Spatial Depth System** | Z-index management | Standard z-index works fine | spatial-depth.ts. Restore if layering bugs appear at scale |
| **Space Celebrations** | Confetti on space milestones | Fun but not functional | space-celebrations.tsx. Restore as delight layer post-PMF |
| **Campus Dock/Drawer** | macOS-style dock navigation | Standard nav works, experimental UI is risk | CampusDock.tsx, DockOrb.tsx, CampusDrawer.tsx. Restore if mobile nav needs rethinking |
| **Theater Chat Board** | Alternate chat layout | Unknown use case — investigate before restoring | TheaterChatBoard. Needs user research to justify |
| **Multiple Layout Systems** | FocusFlow, Immersion, Orientation, ProfileBento | One layout strategy for now | packages/ui/src/layouts/. Restore individual layouts as specific pages need them |
| **Showcase** | HiveLab demo gallery | Needs real tools to showcase | packages/ui/src/components/hivelab/showcase/. Restore when there are 100+ public tools |
| **Cognitive Budget** | Information load management for users | Academic concept, test with real users first | use-cognitive-budget.ts. Restore if user research shows information overload |

---

## How to Restore

Every deferred feature exists in git history. To bring one back:

1. Check this doc for the reintegration path
2. `git log --all --oneline -- <file_path>` to find the last commit with the feature
3. `git checkout <commit> -- <file_path>` to restore
4. Update imports, test, integrate with current codebase
5. Move the item from DEFERRED.md to the active codebase
6. Delete the row from this doc

---

*Created Feb 19, 2026. Every feature here has a future — just not today.*
