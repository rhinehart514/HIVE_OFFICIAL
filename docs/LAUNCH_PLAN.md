# HIVE Launch Plan

**Last Updated:** December 2025

---

## Executive Summary

HIVE launches at University at Buffalo (UB) in Winter 2025-26. Three phases: Soft Launch (Dec-Jan), Beta Launch (Feb), Full Launch (Spring).

**The thesis:** Win one campus at density. If 50%+ of UB students use HIVE, we've proven the model. Then scale.

---

## Launch Phases

### Phase 1: Soft Launch (Dec 2025 - Jan 2026)

**Goal:** Validate core flows with 10-20 trusted org leaders.

**Who:** Hand-selected leaders from high-activity UB orgs. Minimum criteria:
- 50+ members in their org
- Active on campus (not dormant clubs)
- Leader is tech-forward (will give real feedback)

**What They Get:**
- Early access before anyone else
- Direct line to founders for feedback
- "Founding leader" badge (forever)
- Input on features that ship

**What We Learn:**
- Does onboarding convert?
- Does chat feel right?
- Do leaders understand HiveLab?
- What's broken that we missed?

**Success Criteria:**
| Metric | Target |
|--------|--------|
| Leaders onboarded | 15+ |
| Leaders who create a space | 80%+ |
| Leaders who send 10+ messages | 70%+ |
| Leaders who deploy 1+ HiveLab tool | 50%+ |
| NPS score | 40+ |
| Critical bugs reported | <5 |

**Exit Criteria to Beta:**
- 0 critical bugs open
- Onboarding converts 80%+
- Chat feels "instant" (no complaints about speed)
- 3+ leaders say they'd recommend to peers

---

### Phase 2: Beta Launch (Feb 2026)

**Goal:** 50+ active spaces, onboarding refined, word-of-mouth starts.

**Who:** Expand to:
- All orgs from soft launch invite their officers
- 30-50 additional orgs recruited
- Open waitlist for students (controlled)

**Tactics:**
- Each soft launch leader invites 5 officers
- Cold outreach to 50 highest-activity CampusLabs orgs
- Waitlist opens on landing page
- Social proof: "X leaders already building"

**What We Ship:**
- Refined onboarding based on soft launch feedback
- 10+ HiveLab templates
- Basic analytics (real data)
- Mobile polish
- Notification settings (in-app, not push)

**Success Criteria:**
| Metric | Target |
|--------|--------|
| Active spaces | 50+ |
| Weekly active users | 500+ |
| D7 retention | 40%+ |
| Leaders using HiveLab | 30%+ |
| Cross-space engagement | 25%+ (users in 2+ spaces) |
| Organic signups (not invited) | 100+ |

**Exit Criteria to Full Launch:**
- 50+ spaces with weekly activity
- Retention curve flattens (not dropping)
- Organic growth visible
- No major stability issues

---

### Phase 3: Full Launch (Spring 2026)

**Goal:** Campus-wide awareness. Density flywheel kicks in.

**Who:** Everyone at UB. Open registration.

**Tactics:**
- Public launch announcement
- Social media campaign
- Tabling at student union
- Partner with Student Association
- "Every org at UB is on HIVE" messaging

**What We Ship:**
- Push notifications
- Email digests (opt-in)
- Advanced analytics for leaders
- More HiveLab elements
- Full mobile experience

**Success Criteria (End of Spring 2026):**
| Metric | Target |
|--------|--------|
| Total users | 5,000+ |
| Weekly active users | 2,000+ |
| Active spaces | 150+ |
| D7 retention | 50%+ |
| D30 retention | 30%+ |
| Cross-space engagement | 40%+ |
| Organic growth | 50%+ of new users |
| NPS | 50+ |

---

## Feature Completeness Checklist

### Must Ship for Soft Launch

**Spaces:**
- [x] Real-time chat (SSE streaming)
- [x] Threading and reactions
- [x] Board (channel) system
- [x] Role management (owner/admin/mod/member)
- [x] Pinned messages
- [x] 60/40 layout with sidebar
- [ ] Fix typing indicator (presence-based, not polling)
- [ ] Real analytics (replace mock data)

**HiveLab:**
- [x] AI generation (natural language → tool)
- [x] 24 element library
- [x] Visual canvas (drag-and-drop)
- [x] Deployment to sidebar
- [x] Tool state persistence
- [ ] Undo/redo on canvas
- [ ] 10+ quality templates

**Auth/Onboarding:**
- [x] OTP email authentication
- [x] 4-step onboarding flow
- [x] JWT session management
- [ ] Edge case fixes (email variations, timeouts)

**Landing Page:**
- [x] Hero section
- [x] Feature showcase
- [x] Waitlist signup
- [x] Legal pages (privacy, terms) as modals
- [ ] Final copy review

**Mobile:**
- [x] Responsive layout
- [x] Mobile drawer for sidebar
- [ ] Touch gestures polish
- [ ] Keyboard-aware input

### Must Ship for Beta Launch

**Spaces:**
- [ ] Notification settings (per-space mute)
- [ ] Member invite flow improvements
- [ ] Board muting
- [ ] Search messages (basic)

**HiveLab:**
- [ ] Template gallery (categorized)
- [ ] Save as template
- [ ] Copy/paste elements
- [ ] Multi-select on canvas

**General:**
- [ ] In-app notification center
- [ ] Profile completion flow
- [ ] Space recommendations

### Deferred to Full Launch

**Spaces:**
- Push notifications
- Email digests
- Voice messages
- Read receipts

**HiveLab:**
- Collaboration (multi-user editing)
- External webhooks
- Advanced analytics

**Platform:**
- Ghost mode (full privacy)
- Marketplace
- University integrations

---

## Go-to-Market: UB Strategy

### Pre-Launch (Now)

**Build the waitlist:**
- Landing page live with waitlist
- Soft social presence (X/Twitter)
- Reach out to 20 potential founding leaders

**Seed content:**
- 400+ spaces pre-created from CampusLabs data
- Categories mapped: Academic, Social, Sports, Arts, etc.
- Ready for leaders to "claim" their org

### Soft Launch Outreach

**Founding Leader Selection:**

| Org Type | Target Count | Why |
|----------|--------------|-----|
| Greek Life | 3-5 | High member count, active |
| Cultural Orgs | 3-5 | Strong community identity |
| Academic Clubs | 3-5 | Serious engagement |
| Club Sports | 2-3 | Coordination needs |
| Creative/Arts | 2-3 | HiveLab appeal |

**Outreach Script:**

> "Hey [Name], I'm building HIVE — a new platform where campus orgs actually live. Think Discord + campus-native features. Every org at UB is already on it (we pulled CampusLabs data).
>
> I'm looking for 10-15 founding leaders to test before anyone else. You'd get direct access to us for feedback, and a permanent 'founding leader' badge.
>
> Want to be part of it? Takes 5 min to set up your space."

### Beta Launch Campaign

**"50 Leaders, 5000 Students" Campaign:**

1. Each founding leader invites 5 officers
2. Each officer invites their members
3. Cascade effect → 10-50x growth

**Positioning:**
- "Where campus communities actually live"
- "Your org, your rules, your tools"
- "Finally, one place for everything"

**Channels:**
- DMs from founding leaders (peer-to-peer)
- Instagram stories/posts from leaders
- UB student media (Spectrum, etc.)
- Campus ambassadors (3-5 students)

### Full Launch Campaign

**"Everyone's Here" Positioning:**

Once 50+ spaces are active, messaging shifts:
- "100+ UB orgs are on HIVE"
- "Your friends are already here"
- FOMO-driven growth

**Tactics:**
- Student Union tabling (Feb-Mar)
- Partnerships with major events
- Student Association endorsement
- Featured in orientation materials (Fall 2026)

---

## Risk Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Chat feels slow | Medium | High | Performance testing before launch, SSE optimization |
| HiveLab bugs on deploy | Medium | Medium | End-to-end testing, error boundaries |
| Firebase costs spike | Low | High | Usage alerts, rate limiting, caching |
| Auth edge cases | Medium | High | Comprehensive email validation, session recovery |

### Market Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Leaders don't adopt | Medium | Critical | Deep interviews, iterate fast, be in the room |
| Discord is "good enough" | High | High | Campus-native features, pre-seeded orgs, HiveLab |
| University pushback | Low | Medium | Student-first positioning, no admin access |
| Competitor launches | Low | Medium | Speed > perfection, network effects lock-in |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Moderation issues | Medium | High | Content moderation in place, reporting flow |
| Support overwhelm | Medium | Medium | Good docs, in-app help, Slack for leaders |
| Founder burnout | Medium | High | Sustainable pace, milestone celebrations |

---

## Success Metrics (KPIs)

### North Star Metric

**Weekly Active Spaces (WAS):** Spaces with 10+ messages in the past 7 days.

This is the single number that matters. More active spaces = more activity = more users = more value.

### Supporting Metrics

**Acquisition:**
- Signups per week
- Signup → Onboarding completion rate
- Organic vs. invited ratio

**Activation:**
- Onboarding completion rate (target: 80%+)
- Time to first message (target: <5 min)
- Leaders who deploy a tool (target: 50%+)

**Retention:**
- D1 retention (target: 70%)
- D7 retention (target: 50%)
- D30 retention (target: 30%)
- Weekly retention (target: 60%)

**Engagement:**
- Messages per user per week
- Cross-space engagement (users in 2+ spaces)
- HiveLab tool interactions

**Health:**
- NPS score (target: 50+)
- Support tickets per 100 users
- Critical bugs open

---

## Team Focus Areas

### Engineering

**Soft Launch:**
- Typing indicator fix (switch to presence-based)
- Real analytics (replace mocks)
- Undo/redo on canvas
- Mobile polish pass

**Beta Launch:**
- Notification system (in-app)
- Template gallery
- Search improvements
- Performance optimization

### Design

**Soft Launch:**
- Landing page final polish
- Mobile UX audit
- HiveLab template designs

**Beta Launch:**
- Onboarding refinements
- Space customization options
- Empty states and edge cases

### Growth

**Soft Launch:**
- Founding leader recruitment (15-20)
- Waitlist growth
- Feedback collection system

**Beta Launch:**
- Ambassador program
- Social content
- Campus partnerships

---

## Timeline Summary

```
Dec 2025     Jan 2026     Feb 2026     Mar 2026     Apr 2026
    |            |            |            |            |
    ├────────────┤            |            |            |
    │ SOFT LAUNCH│            |            |            |
    │ 15 leaders │            |            |            |
    │ Core fixes │            |            |            |
    └────────────┘            |            |            |
                              |            |            |
                 ┌────────────┤            |            |
                 │ BETA LAUNCH│            |            |
                 │ 50+ spaces │            |            |
                 │ 500+ users │            |            |
                 └────────────┘            |            |
                                           |            |
                              ┌────────────┴────────────┤
                              │      FULL LAUNCH        │
                              │      5000+ users        │
                              │      150+ spaces        │
                              └─────────────────────────┘
```

---

## Decision Log

Track major decisions here as they're made.

| Date | Decision | Rationale |
|------|----------|-----------|
| Dec 2025 | Soft launch with 15-20 leaders | Quality feedback > quantity; fix issues before scale |
| Dec 2025 | Defer push notifications | Adds complexity; in-app sufficient for soft launch |
| Dec 2025 | Leader-first GTM | Leaders bring 50-500 members each; efficient growth |
| Dec 2025 | UB-only for Year 1 | Prove density at one campus before expanding |

---

## Appendix: Pre-Seeded Spaces

400+ spaces pre-created from CampusLabs data, organized by category:

| Category | Count | Examples |
|----------|-------|----------|
| Academic | ~80 | CS Club, Pre-Med Society, Business Association |
| Greek Life | ~50 | Fraternities, Sororities, Greek Council |
| Cultural | ~60 | Indian Students Association, Black Student Union |
| Sports | ~40 | Club Soccer, Ultimate Frisbee, Running Club |
| Arts/Creative | ~30 | Theatre, A Cappella, Photography |
| Service | ~35 | Habitat for Humanity, Best Buddies |
| Professional | ~45 | Engineering Society, Law Society |
| Special Interest | ~60 | Gaming, Anime, Environmental |

Leaders "claim" their org during onboarding → instant community.

---

*This is a living document. Update as we learn from each phase.*
