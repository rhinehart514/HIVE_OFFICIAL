# HIVE Launch Plan

**Last Updated:** 2026-01-02

---

## Executive Summary

HIVE launches at University at Buffalo (UB). Strategy: Go big or go home. We're building for 1000s of users expecting high value from day one.

**The thesis:** Win one campus at density. If 50%+ of UB students use HIVE, we've proven the model. Then scale.

---

## Launch Strategy

### Core Principle

No "soft launch" mindset. Every user who touches HIVE should experience a complete, polished product. We're not testing — we're launching.

### Technical Readiness Criteria

Before opening to users at scale:
- [ ] 1000 concurrent users sustained without degradation
- [ ] <500ms p95 response time on core endpoints
- [ ] Error rate <1%
- [ ] No memory leaks after 24-hour soak test
- [ ] All "mock data" references removed or gated
- [ ] E2E tests pass for core user journeys

### What's Ready Now

| Feature | Status | Notes |
|---------|--------|-------|
| Spaces + Chat | ✅ 96% | Production ready, real-time works |
| HiveLab | ✅ 100% | Tool builder complete |
| Onboarding | ✅ 90% | OTP + 3 steps + auto-join |
| Discovery | ✅ 80% | 400+ pre-seeded spaces |
| Profiles | ✅ 75% | Bento grid works |
| Admin | ✅ 70% | Internal tool ready |

### What Needs Work

| Feature | Issue | Fix |
|---------|-------|-----|
| Feed | Returns mock data | Design "Coming Soon" (HIVE-branded) |
| Infrastructure | In-memory rate limits | Deploy Redis |
| Presence | Loads all users | Refactor to space-specific |
| SSE | Resource leak risk | Add cleanup with timeout |

---

## Go-to-Market

### Pre-Launch (Now)

**Build the waitlist:**
- Landing page live with waitlist
- Social presence (X/Twitter)
- Reach out to founding leaders

**Seed content:**
- 400+ spaces pre-created from CampusLabs data
- Categories mapped: Academic, Social, Sports, Arts, etc.
- Ready for leaders to "claim" their org

### Launch Campaign

**"Everyone's Here" Positioning:**
- "100+ UB orgs are on HIVE"
- "Your friends are already here"
- FOMO-driven growth

**Tactics:**
- Leader-first: Each leader brings 50-500 members
- Peer-to-peer DMs from founding leaders
- Instagram stories/posts from leaders
- UB student media (Spectrum, etc.)
- Campus ambassadors (3-5 students)

**Post-Launch:**
- Student Union tabling
- Partnerships with major events
- Student Association endorsement
- Featured in orientation materials (Fall 2026)

---

## Success Criteria

### First 30 Days
| Metric | Target |
|--------|--------|
| Total signups | 500+ |
| Onboarding completion | 80%+ |
| Active spaces | 50+ |
| Chat feels "instant" | No complaints |
| NPS score | 40+ |
| Critical bugs | <5 |

### First 90 Days
| Metric | Target |
|--------|--------|
| Total users | 5,000+ |
| Weekly active users | 2,000+ |
| Active spaces | 150+ |
| D7 retention | 50%+ |
| Cross-space engagement | 40%+ |
| Organic growth | 50%+ of new users |

---

## Feature Completeness Checklist

### Core Features (Launch Ready)

**Spaces:**
- [x] Real-time chat (SSE streaming)
- [x] Threading and reactions
- [x] Board (channel) system
- [x] Role management (owner/admin/mod/member)
- [x] Pinned messages
- [x] 60/40 layout with sidebar
- [x] Typing indicator (3s throttle)
- [x] Real analytics

**HiveLab:**
- [x] AI generation (natural language → tool)
- [x] 27 element library
- [x] Visual canvas (drag-and-drop)
- [x] Deployment to sidebar/inline/modal/tab
- [x] Tool state persistence
- [x] 35 templates

**Auth/Onboarding:**
- [x] OTP email authentication
- [x] 3-step onboarding flow
- [x] JWT session management
- [x] Auto-join recommended spaces

**Landing Page:**
- [x] Hero section
- [x] Feature showcase
- [x] Waitlist signup
- [x] Legal pages (privacy, terms)

**Mobile:**
- [x] Responsive layout (1024px breakpoint)
- [x] Mobile drawer for sidebar
- [x] Touch gestures

### Launch Blockers (Fix Now)

**Infrastructure:**
- [ ] Deploy Redis for distributed rate limiting
- [ ] Refactor presence to space-specific
- [ ] SSE cleanup with timeout
- [ ] Enable scaling feature flags

**Stability:**
- [ ] Session secret hardening
- [ ] Onboarding transaction safety
- [ ] Error boundaries on critical pages

**User Experience:**
- [ ] Feed "Coming Soon" (HIVE-branded)
- [ ] Events placeholder in spaces

### Deferred (Post-Launch)

**Features:**
- Push notifications
- Email digests
- Voice messages
- Ghost mode full UI
- Rituals (75% built, feature-gated)
- Marketplace
- Multi-campus expansion

---

## Risk Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scaling issues at 1000+ | Medium | High | Deploy Redis, load testing, presence refactor |
| Chat feels slow | Medium | High | SSE optimization, edge caching |
| HiveLab bugs on deploy | Medium | Medium | End-to-end testing, error boundaries |
| Firebase costs spike | Low | High | Usage alerts, rate limiting, caching |

### Market Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Leaders don't adopt | Medium | Critical | Deep interviews, iterate fast, be in the room |
| Discord is "good enough" | High | High | Campus-native features, pre-seeded orgs, HiveLab |
| University pushback | Low | Medium | Student-first positioning, no admin access |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Moderation issues | Medium | High | Content moderation in place, reporting flow |
| Support overwhelm | Medium | Medium | Good docs, in-app help, Slack for leaders |

---

## KPIs

### North Star

**Weekly Active Spaces (WAS):** Spaces with 10+ messages in the past 7 days.

### Supporting Metrics

| Category | Metric | Target |
|----------|--------|--------|
| Acquisition | Signup → Onboarding completion | 80%+ |
| Activation | Time to first message | <5 min |
| Retention | D7 retention | 50%+ |
| Engagement | Cross-space (users in 2+ spaces) | 40%+ |
| Health | NPS score | 50+ |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Jan 2026 | Full launch mindset | Build for 1000s, not 10-20 |
| Jan 2026 | Defer push notifications | In-app sufficient for launch |
| Jan 2026 | Leader-first GTM | Leaders bring 50-500 members each |
| Jan 2026 | UB-only for Year 1 | Prove density at one campus |
| Jan 2026 | Feed "Coming Soon" | Intentional design, not broken |
| Jan 2026 | Rituals gated | Enable post-launch |

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
