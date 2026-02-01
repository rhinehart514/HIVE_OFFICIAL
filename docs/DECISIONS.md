# Decisions

Architectural and strategic decisions. Reference before revisiting closed questions.

---

## Made

| Date | Decision | Why | Rejected |
|------|----------|-----|----------|
| 2026-01-26 | Audit-first before Campus One | Deep audit found 26 critical issues | Ship and patch — too risky |
| 2026-01-26 | Structural sprint before security | 4 orphaned packages, .env exposed | Clean during features — compounds debt |
| 2026-01-26 | Security sprint before features | Privilege escalation in admin grant | Features first — unacceptable risk |
| 2026-01-26 | Error boundaries before polish | 6 main routes have no error recovery | Polish first — crashes lose users |
| 2026-01-26 | Delete orphaned packages | analytics/, api-client/, i18n/, utilities/ empty | Keep as placeholders — confuses contributors |
| 2026-01-26 | Extract HiveLab from core | Embedded in packages/core/src/hivelab/ | Keep embedded — violates separation |
| 2026-01-26 | Calendar OAuth is L effort | Full sync requires event editing, conflict detection | Quick stub — creates tech debt |
| 2026-01-26 | Search v2 before explore | Discovery depends on working search | Build explore first — no foundation |
| 2026-01-26 | Parallel design sprint track | Design debt is 48% | Design after code — results in rework |
| 2026-01-26 | Design leads implementation | Feed, Browse, Profile need research | Code first — builds wrong thing |
| 2026-01-26 | Browse vs Explore: Keep both | Complementary: Browse (emotional) for new users, Explore (search-first) for power users | Merge — loses emotional Browse |
| 2026-01-26 | Profile: Identity + Activity | "Who is this person, what do they DO on campus?" 3-zone layout | Single-purpose profile |

---

## Pending

| Question | Options | Blocking |
|----------|---------|----------|
| Feed: Chronological vs Algorithmic? | A) Pure chrono, B) 8-factor ranking, C) User toggle | D2 |
| Feed: What's the job? | A) Stay informed, B) Jump into action, C) Catch up and go | D2 |
| Feed: Sidebar or full-width? | A) Full-width, B) Right sidebar, C) Left nav | D2 |
| Ghost mode: Full invisibility? | A) Full ghost, B) Hide activity only, C) Timed modes | Sprint 4 |
| Tool marketplace scope? | A) Campus isolated, B) Federated, C) Global | Sprint 5 |
| Density modes: User preference? | A) Fixed, B) User toggle, C) Context-adaptive | D2 |

---

## Open Questions

Not yet framed as decisions:

- Multi-campus space spanning?
- Alumni experience post-graduation?
- AI tool generation boundaries?
- Handle permanence rules?
