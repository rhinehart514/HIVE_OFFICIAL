# Value Proxy Evaluation Rubrics

## How to use

Every non-trivial change should move at least one value proxy in the right direction. Before implementing, identify which proxy the change affects and state the expected impact.

## HIVE's Value Proxies

### 1. Time-to-First-Creation (TTFC)
**What it measures:** How long from opening Build to having a working app
**Why it matters:** If creation is slow, leaders use Google Forms instead
**Targets:**
- Pass: <=60 seconds (shell path)
- Transformational: <=15 seconds (slash command in space)
**How to measure:** Timestamp delta from `SUBMIT_PROMPT` to `GENERATION_COMPLETE` or `ACCEPT_SHELL`

### 2. Placement Rate
**What it measures:** % of created apps that get placed in a space
**Why it matters:** Unplaced apps have zero reach; creation without distribution is waste
**Targets:**
- Pass: >=50% of created apps get placed
- Transformational: >=70%
**How to measure:** `tools where placedIn.length > 0` / `total tools created`

### 3. Notification-to-Engagement Rate
**What it measures:** % of "app placed" notifications that result in member interaction
**Why it matters:** This IS the reach mechanism; if notifications don't convert, the loop breaks
**Targets:**
- Pass: >=20% of notified members interact
- Transformational: >=40%
**How to measure:** `unique users who interacted after notification` / `total notification recipients`

### 4. Creator Return Rate
**What it measures:** % of creators who build a second app within 7 days
**Why it matters:** One creation is curiosity; two is a habit; the profile feedback loop drives this
**Targets:**
- Pass: >=30% build a second app
- Transformational: >=50%
**How to measure:** `users with 2+ tools created within 7 days` / `users with 1+ tool created`

### 5. Feed-to-Action Rate
**What it measures:** % of feed sessions that result in an RSVP, join, or app interaction
**Why it matters:** A feed that people scroll but don't act on is Instagram, not HIVE
**Targets:**
- Pass: >=15% of feed sessions include an action
- Transformational: >=30%
**How to measure:** Sessions with RSVP/join/vote event / total feed sessions

### 6. Standalone Conversion Rate
**What it measures:** % of standalone URL visitors who sign up for HIVE
**Why it matters:** This is the viral growth mechanism; if it doesn't convert, growth is linear
**Targets:**
- Pass: >=5% conversion
- Transformational: >=15%
**How to measure:** Signups with referrer matching `/t/{toolId}` / unique visitors to `/t/{toolId}`

## Proxy Health Rules

1. **Never optimize one proxy at the expense of another.** Speeding up creation (TTFC) at the cost of quality (placement rate drops) is a net loss.

2. **Proxies are proxies.** They approximate user value but aren't the thing itself. If all proxies are green but users are churning, the proxies are wrong.

3. **At launch, measure with manual observation.** We won't have analytics dashboards. Watch 10 users create, place, and share. Count the drops. That's the eval.

4. **Each proxy maps to a workflow step.** If a proxy is red, find the broken step:

| Proxy | Workflow Step | Fix surface |
|-------|-------------|-------------|
| TTFC | Create | Build (classify + generate) |
| Placement Rate | Place | Build (placement sheet UX) |
| Notification-to-Engagement | Share + Engage | Connective tissue (notifications) |
| Creator Return | See Impact | Profile (feedback loop) |
| Feed-to-Action | Discover | Feed (card CTAs) |
| Standalone Conversion | Viral | Standalone page (CTA + branding) |
