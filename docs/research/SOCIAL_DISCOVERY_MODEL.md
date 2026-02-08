# Social Discovery Model: How Campus Tools Get Found

Research into how student-built tools get discovered through social surfaces -- creator profiles, activity feeds, and social sharing -- rather than an app store.

The app store model is rejected. Tools should live inside the social fabric of campus life: in the profiles of the people who made them, in the feed of what's happening on campus, and in the links students share with each other.

---

## 1. Platform Discovery Models Worth Stealing From

### TikTok For You Page

The single most important insight: **content quality beats creator popularity**. TikTok's algorithm evaluates every piece of content independently of who made it. A first-time creator has the same chance of reaching 100,000 views as someone with a million followers.

**How it works:**
- New content is shown to a small, targeted test group based on inferred interests (not followers)
- If engagement signals are strong (watch time, likes, shares, comments), the content is pushed to progressively larger audiences
- Follower count, account age, and previous performance are explicitly de-weighted
- Non-follower reach has grown from 31% of impressions (2023) to 58% (2025)

**What HIVE should steal:**
- Every new tool launch gets shown to a test group on campus, regardless of who built it
- Engagement signals (clicks, installs, usage) determine whether it gets amplified
- A freshman's dining tracker gets the same initial exposure as a senior CS student's project
- The algorithm should be meritocratic at the content level, not the creator level

### Instagram Explore

Instagram Explore surfaces content exclusively from accounts users don't follow, using a three-stage pipeline:

1. **Retrieval**: ~1,500 candidate posts selected based on similarity to user's engagement history
2. **Early ranking**: Neural network narrows to ~100 based on media-user similarity
3. **Late ranking**: ML model scores likelihood of engagement (primarily likes and saves)

**Key insight**: Instagram tracks multiple distinct interest clusters per user. Two users who both like fitness see different Explore pages based on whether they engage more with weightlifting or yoga. This means the system understands nuanced preferences, not just broad categories.

**What HIVE should steal:**
- Track which types of tools each student engages with (academic, social, organizational, creative)
- Surface tools from interest-adjacent categories, not just exact matches
- "Students who use study finders also tend to use room booking tools" -- collaborative filtering at tool level

### Pinterest Interest Graph

Pinterest's Unified Taste Graph connects behaviors, interests, and content into a dynamic interest map. Key mechanism: **PinSage**, which finds candidate content through graph relationships among items, boards, topics, and users.

**Critical detail**: Pinterest gives fresh content (< 7 days old) an explicit visibility boost. New pins that pick up engagement quickly get amplified further. This solves the cold-start problem for new creators.

**What HIVE should steal:**
- New tool launches get a 7-day visibility window with boosted exposure
- Interest graph connecting tools, spaces, topics, and students
- "Students in design clubs tend to use color palette tools" -- graph-based recommendations

### Product Hunt Daily Feed

Product Hunt's discovery model is time-boxed and communal:
- New products launch at 12:01 AM PST and compete on a 24-hour leaderboard
- Initial display is chronological, not algorithmic -- everyone starts equal
- Community votes, comments, and engagement determine ranking throughout the day
- Maker profiles link to all products a person has built

**Key insight**: The daily cadence creates a shared ritual. People check Product Hunt daily because there's always something new. The leaderboard creates urgency and competition. Maker profiles create longitudinal reputation.

**What HIVE should steal:**
- Weekly or daily "What's New" cadence on campus feed
- Chronological start, engagement-ranked over time
- Creator profiles that accumulate all their launches and impact over time
- The ritual of checking "what launched this week on campus"

### Hacker News Show HN

Show HN is the purest form of "show what you built":
- Prefix "Show HN:" signals this is a creator showing their work (not a link to someone else's content)
- The product must actually exist and be testable -- no landing pages, no vaporware
- Community provides immediate, unfiltered technical feedback
- Voting is simple: one upvote per user, with time decay
- Stripe and Dropbox both started with Show HN posts

**Key insight**: The constraint that the product must be real and testable is what makes Show HN valuable. It filters out hype. Combined with a technically sophisticated audience, it creates high-signal discovery.

**What HIVE should steal:**
- Tools must be usable to be listed -- no "coming soon" pages
- Community feedback and voting from actual users
- Simple voting mechanics that reward quality over marketing
- The pride of showing what you built to your campus

### Are.na Social Curation

Are.na organizes content into "Blocks" and "Channels" -- a structured system for collaborative idea mapping. Unlike Pinterest (visual-first) or bookmarking (personal-first), Are.na emphasizes intentional curation and interconnected collections.

**What HIVE should steal:**
- Let students create curated collections of tools ("My essential toolkit", "Best tools for pre-med students")
- Collections themselves become discoverable -- curators become a discovery channel
- Interconnected mapping: tools that appear together in many collections are probably related

---

## 2. Profile-Based Discovery

The core question: **What makes a profile a discovery mechanism instead of a dead page?**

### GitHub: The Gold Standard for Builder Profiles

GitHub profiles work as discovery because they contain proof of work:
- **Pinned repositories** (up to 6): Creator-curated showcase of best work
- **Contribution graph**: Visual proof of consistent activity over time
- **Stars**: Social proof from other developers
- **Follower/Following graph**: Network-based discovery ("who does this person follow?")
- **Activity feed**: Real-time stream of what someone is working on

**Why it works**: Everything on a GitHub profile is backed by actual code. You can't fake a contribution graph. Stars are given by real developers who found value. The profile is a living document that updates with every commit.

**Why most profiles are dead pages**: Dribbble and Behance profiles are static portfolios -- they show polished final work but not the process, impact, or ongoing activity. There's no equivalent of the contribution graph or star count. Discovery on these platforms relies on search filters (skills, location, tools) rather than organic surfacing.

### What Makes HIVE Creator Profiles a Discovery Engine

A HIVE creator profile should answer three questions for any visitor:

1. **What did this person build?** -- List of tools with usage stats, not just screenshots
2. **What impact did it have?** -- "1,200 students used this", "Active in 4 spaces"
3. **What are they building now?** -- Activity feed showing current work

**Profile elements that drive discovery:**

| Element | Purpose | Discovery mechanism |
|---------|---------|-------------------|
| Pinned tools (up to 3) | Showcase best work | Visitors try them directly |
| Builder level + XP | Reputation signal | Filtered search by experience |
| Usage stats per tool | Impact proof | Social proof drives clicks |
| Activity feed | Shows ongoing work | "Sarah is building something new" in campus feed |
| Spaces contributed to | Community context | "She builds tools for the design club" |
| Endorsements from spaces | Trust from communities | "The CS club recommends this builder" |

**The key insight from GitHub**: The profile must be a living document, not a static portfolio. It should update automatically as tools gain users, as the builder ships updates, and as communities endorse their work.

---

## 3. Feed-Based Discovery for Tools

### The Central Design Question

Should tool launches mix with social content in the main feed, or have their own dedicated section?

**Analysis of approaches:**

| Approach | Pros | Cons |
|----------|------|------|
| Mixed into main feed | Natural discovery, feels organic | Can get buried, may feel like ads |
| Separate "What's New" tab | Dedicated browsing, no noise | Lower traffic, opt-in only |
| Hybrid: featured in main + dedicated section | Best of both, multiple touchpoints | More complex, risk of redundancy |

**Recommendation: Hybrid approach.**

The main campus feed should include tool-related activity as a natural content type alongside social posts:
- "Sarah just launched a dining tracker" (launch event)
- "247 students used the study finder this week" (trending signal)
- "The CS club endorsed Room Finder as their official tool" (community signal)

A dedicated "What's New" or "Explore" section should exist for intentional browsing:
- Weekly launches, organized chronologically then by engagement
- Trending tools this week
- Tools popular in your spaces
- Tools popular with students like you

### Preventing Tool Launches from Feeling Like Ads

This is the critical UX challenge. Research on native advertising shows that promotional content works when it matches the voice and format of organic content. Content that feels robotic or overly polished breaks trust.

**Design principles:**

1. **Social framing over product framing**: Not "Dining Tracker v1.0 -- track your meals!" but "Sarah built a way to see what's open for dinner right now"
2. **People-first, tool-second**: The launch card should show the creator's face, name, and a one-line human description before showing the tool itself
3. **Usage signals over marketing claims**: "47 students tried this today" is more trustworthy than "The best dining tracker on campus"
4. **Peer context**: "3 of your friends use this" or "Popular in Design Club" makes it social, not promotional
5. **No separate visual treatment**: Tool launch cards should use the same visual system as other feed content -- different enough to be recognizable as a tool, similar enough to not feel like a banner ad

### Feed Content Types for Tools

| Content type | Trigger | Example |
|-------------|---------|---------|
| Launch | Creator publishes a new tool | "Marcus just launched Study Buddy -- find study partners by course" |
| Milestone | Tool hits usage threshold | "Room Finder just hit 500 users this semester" |
| Trending | Rapid usage growth | "Dining Tracker is trending -- 89 new users this week" |
| Endorsement | Space officially adopts a tool | "Engineering Club now uses Project Tracker" |
| Update | Creator ships a significant update | "Sarah added meal ratings to Dining Tracker" |
| Social proof | Friend starts using a tool | "Alex and 2 others started using Study Buddy" |

---

## 4. Trust Without a Store

App stores provide trust through review processes, ratings, and refund policies. Without a store, HIVE needs alternative trust mechanisms.

### Campus Identity as Foundation

The single strongest trust signal available: **verified campus identity**. Every tool builder is a real, verified student at the same university. This is a trust advantage no app store has.

- "Built by a UB student" is inherently more trustworthy than "Built by anonymous developer"
- The builder can be found, messaged, and held accountable
- Campus email verification eliminates bots, spam, and anonymous bad actors

### Trust Signal Hierarchy

Ranked by effectiveness based on social proof research (where 66% of customers say social proof increases purchase likelihood):

| Signal | Strength | Why it works |
|--------|----------|-------------|
| "3 of your friends use this" | Highest | Personal social proof from known peers |
| "1,200 students use this" | Very high | Aggregate social proof, safety in numbers |
| "Popular in Design Club" | High | Community endorsement from trusted group |
| "Built by Sarah Chen, Level 4 Builder" | High | Creator reputation + verified identity |
| Star rating (4.7/5) | Medium | Familiar signal, but can be gamed |
| "Updated 2 days ago" | Medium | Shows active maintenance |
| "Featured by campus" | Medium | Institutional trust signal |
| Screenshot/preview | Low-medium | Reduces uncertainty about what it does |

### Creator Reputation System

Builder reputation should accumulate across all their tools:

- **Builder Level**: Based on cumulative impact (total users across all tools, consistency of updates, community endorsements)
- **Badges**: "First Launch", "100 Users", "Space Endorsed", "Semester Streak"
- **Portfolio effect**: A builder with 3 successful tools is more trustworthy for their 4th launch
- **Accountability**: If a tool breaks or has issues, it affects the builder's reputation -- creating incentive to maintain quality

---

## 5. Viral Mechanics for Campus Tools

### Word of Mouth (The Dominant Channel)

Research shows word-of-mouth impressions create 5x more sales than paid media. College students are particularly effective word-of-mouth marketers but are selective about what they endorse. ClassDojo reached 51 million students across 95% of US PreK-8 schools with 100% organic, zero-ad-spend growth.

**How to enable word of mouth on HIVE:**
- One-tap sharing of tools via link, message, or social media
- Shareable usage stats: "I've used Study Buddy 47 times this semester" (bragging rights)
- Invitation mechanics: "Invite a friend to Study Buddy" with both parties getting credit
- Outcome sharing: "I found 3 study partners through Study Buddy" (success stories in feed)

### Space Bridging

Tools adopted by one space can be recommended to similar spaces:

- "Engineering Club uses Project Tracker. You're in CS Club -- want to try it?"
- Cross-space recommendations based on space type similarity (all academic clubs, all creative groups)
- "3 clubs in STEM use this tool" -- category-level social proof

This creates network effects: each space that adopts a tool makes it more likely that similar spaces will too.

### Physical-Digital Bridge

QR codes and physical presence are underutilized in campus tool distribution:

- **Posters**: "Scan to find what's open for dinner" QR code in dining halls
- **Event integration**: QR code at club fair table that opens the club's space on HIVE
- **Classroom**: Professor shares QR code to a study group finder tool
- **Bulletin boards**: Digital bulletin board items with QR codes linking to HIVE tools
- **NFC tags**: Tap-to-open on dorm room doors, lab equipment, common areas

**Key insight from research**: QR codes on campus already work for navigation, library resources, and event check-in. Students are trained to scan. The infrastructure is free.

### Viral Loop Design

The ideal viral loop for a campus tool:

1. Student discovers tool (via feed, profile, or friend)
2. Student uses tool and gets value
3. Tool creates a shareable moment ("I found a study partner!")
4. Student shares with friend or space
5. Friend discovers tool
6. Repeat

**Critical constraint**: The tool must deliver value before asking for sharing. Premature sharing requests kill viral loops. The share should feel like a natural part of the experience, not a growth hack.

---

## 6. Feed Design Decisions

### Trending at Small Scale

The cold-start problem is real for a campus platform. With a few hundred or thousand users, algorithmic ranking doesn't have enough signal.

**Solutions from research:**

| Scale | Approach | Rationale |
|-------|----------|-----------|
| < 100 users | Chronological + staff picks | Not enough signal for algorithms |
| 100-500 users | Chronological + popularity sorting | Simple engagement counts work |
| 500-2,000 users | Hybrid: time-decay + engagement | Enough signal for basic trending |
| 2,000+ users | Interest graph + collaborative filtering | Rich enough data for personalization |

**Practical cold-start strategy:**
- Launch with chronological feed + "Staff Picks" / "Featured" section curated by campus admins
- Add simple trending (most used this week) once there are 10+ tools with measurable usage
- Add personalized recommendations once there's enough cross-tool usage data to build an interest graph
- Never remove chronological as an option -- it's the fairest for new creators

### Social Group-Based Recommendations

Research on cold-start recommender systems shows that social group information significantly outperforms pure algorithmic approaches when data is sparse. Using social groups (spaces/clubs) as a recommendation signal:

- "Popular in spaces you're a member of"
- "Students in your major use these tools"
- "Trending in Greek life / STEM clubs / arts organizations"

This works because campus social groups are strong interest signals that don't require individual behavioral data.

### Main Feed vs. Dedicated Section

**Main feed should include tool activity when it's socially relevant:**
- A friend launched something
- A space you belong to endorsed a tool
- Something is trending campus-wide
- A tool you use got a major update

**Dedicated section for intentional discovery:**
- Browse all tools by category
- Weekly launches
- Trending this week
- Recommended for you (when algorithm has enough data)
- Search and filter

The main feed creates passive, serendipitous discovery. The dedicated section enables active, intentional browsing. Both are necessary.

---

## 7. Synthesis: The HIVE Social Discovery Architecture

### Three Discovery Surfaces

**1. Creator Profiles (Pull)**
- Living portfolios with usage stats, activity feeds, builder levels
- Pinned tools, endorsements from spaces, contribution history
- Discovery happens when someone visits a profile and finds something interesting
- Profiles surface in feed when creators launch or hit milestones

**2. Campus Feed (Push)**
- Tool launches, milestones, trending signals mixed with social content
- Social framing: people-first, usage-proof, peer context
- Hybrid approach: natural integration in main feed + dedicated explore section
- Starts chronological, evolves to interest-graph-based as data accumulates

**3. Social Sharing (Viral)**
- One-tap sharing via links, messages, QR codes
- Shareable moments created by tool usage
- Space bridging: tools flow between similar communities
- Physical-digital: QR codes, posters, NFC on campus

### Trust Stack (No App Store Needed)

1. **Verified campus identity** (foundation)
2. **Peer social proof** ("3 friends use this")
3. **Aggregate usage** ("1,200 students")
4. **Community endorsement** ("CS Club's official tool")
5. **Creator reputation** (level, portfolio, track record)
6. **Activity signals** (recently updated, actively maintained)

### Cold Start to Scale Progression

| Phase | Discovery approach |
|-------|-------------------|
| Launch (< 100 tools) | Chronological feed, staff picks, manual curation |
| Growth (100-500 tools) | Add trending, popularity sorting, space-based recs |
| Scale (500+ tools) | Interest graph, collaborative filtering, personalized feed |

### What Makes This Different from an App Store

| App Store | HIVE Social Discovery |
|-----------|----------------------|
| Browse by category | Discover through people and activity |
| Anonymous developers | Verified campus students you can find |
| Ratings from strangers | Social proof from friends and communities |
| Marketing-driven visibility | Usage-driven visibility |
| Static listing | Living feed with milestones and updates |
| One-time download decision | Ongoing social reinforcement |
| Reviews as trust | Campus identity + peer behavior as trust |

The fundamental difference: an app store is a catalog you search. HIVE social discovery is a living feed where tools emerge naturally from the activity of people you know and communities you belong to.

---

## Sources

- [TikTok Algorithm Guide 2026 - Buffer](https://buffer.com/resources/tiktok-algorithm/)
- [TikTok's Algorithm Makes it Easy to Get Famous - MIT Technology Review](https://www.technologyreview.com/2021/02/24/1017814/tiktok-algorithm-famous-social-media/)
- [How Instagram Explore Page Works - RecurPost](https://recurpost.com/blog/instagram-explore-page/)
- [Instagram Algorithm 2026 - Buffer](https://buffer.com/resources/instagram-algorithms/)
- [Pinterest Algorithm 2026 - Outfy](https://www.outfy.com/blog/pinterest-algorithm/)
- [Pinterest Interest Taxonomy - Pinterest Engineering](https://medium.com/pinterest-engineering/interest-taxonomy-a-knowledge-graph-management-system-for-content-understanding-at-pinterest-a6ae75c203fd)
- [Pinterest Personalization Strategy - Raw.Studio](https://raw.studio/blog/why-pinterests-personalization-strategy-could-revolutionize-digital-discovery/)
- [Product Hunt Launch Guide](https://www.producthunt.com/launch)
- [How to Launch on Product Hunt - Swipefiles](https://www.swipefiles.com/articles/how-to-launch-on-product-hunt)
- [Show HN Guidelines - Hacker News](https://news.ycombinator.com/showhn.html)
- [Unpacking Hacker News - TechAnnouncer](https://techannouncer.com/unpacking-hacker-news-a-comprehensive-guide-to-the-tech-worlds-favourite-forum/)
- [GitHub Contributions on Profile - GitHub Docs](https://docs.github.com/en/account-and-profile/concepts/contributions-on-your-profile)
- [Trust Signals and Social Proof - Trustmary](https://trustmary.com/social-proof/trust-signals/)
- [Social Proof in UX Design - Sigma](https://www.thesigma.co/social-proof)
- [Psychology Behind Trust Signals - Trustpilot](https://business.trustpilot.com/guides-reports/build-trusted-brand/why-and-how-social-proof-influences-consumers)
- [5 Companies Leading Word of Mouth on Campus - Inc.](https://www.inc.com/jeremy-goldman/5-companies-leading-word-of-mouth-marketing-on-campus.html)
- [Virality Design in Products - Viral Loops](https://viral-loops.com/blog/4-steps-design-virality-product/)
- [Social Discovery Trends 2025 - We Are Social](https://wearesocial.com/me/blog/2025/12/how-brand-discovery-on-social-accelerated-in-2025/)
- [Social Media Trends 2026 - Hootsuite](https://www.hootsuite.com/research/social-trends)
- [Cold Start Problem Solutions - Express Analytics](https://www.expressanalytics.com/blog/cold-start-problem)
- [Social Group Ranking for Cold Start - Springer](https://link.springer.com/article/10.1007/s41060-016-0015-0)
- [QR Codes for Student Engagement - Faculty Focus](https://www.facultyfocus.com/articles/effective-teaching-strategies/qr-codes-for-quick-student-engagement/)
- [QR Codes on Campus - CampusIDNews](https://www.campusidnews.com/qr-codes-on-campus-the-history-and-technology-behind-the-ubiquitous-little-squares/)
