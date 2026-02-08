# Campus Data Connections Research

What data sources, APIs, and systems exist on college campuses that student-built tools could connect to?

---

## 1. Learning Management Systems (LMS)

The single most data-rich integration point on any campus. Every student uses one.

### Canvas (Instructure) — Most Valuable LMS API

- **API type:** REST, JSON responses, OAuth 2.0
- **Coverage:** ~4,000+ institutions, dominant in US higher ed
- **What you can access:** Courses, assignments, grades, calendars, announcements, discussions, enrollments, user profiles, modules, submissions, files
- **Auth:** OAuth 2.0 with institutional approval; students can generate personal access tokens
- **Rate limits:** 700 requests/10 seconds per token
- **Docs:** [Instructure Developer Portal](https://developerdocs.instructure.com/services/canvas)
- **Student token access:** Yes — students can create their own API tokens in account settings
- **Key insight:** Students can pull their OWN data (assignments, due dates, grades) without institutional approval. Building tools ON TOP of a student's own Canvas data is the lowest-friction integration path

### Blackboard (Anthology)

- **API type:** REST, OAuth 2.0 (non-standard implementation)
- **Coverage:** ~2,700+ institutions globally
- **What you can access:** Users, courses, enrollments, grades, content, announcements
- **Auth:** OAuth 2.0 with app registration through Developer Portal
- **Quirks:** OAuth implementation is non-standard; requires institutional admin approval for most operations
- **Docs:** [Blackboard Developer Portal](https://developer.blackboard.com/portal/displayApi/Learn)

### Moodle

- **API type:** REST + SOAP via Web Services, plugin-based
- **Coverage:** ~300M+ users worldwide, dominant outside US
- **What you can access:** Courses, grades, users, calendar events, messages, forums
- **Auth:** Token-based via Web Services; OAuth2 for external integrations
- **Quirks:** Requires admin to enable specific web service functions; two integration paths (LTI standard or custom plugin)
- **Docs:** [Moodle Web Services API](https://supportus.moodle.com/support/solutions/articles/80001016973)

### LMS Integration Assessment

| LMS | API Quality | Student Self-Service | Institutional Barrier | Market Share |
|-----|-------------|---------------------|----------------------|-------------|
| Canvas | Excellent | Yes (personal tokens) | Low | ~35% US |
| Blackboard | Good | Limited | High | ~25% US |
| Moodle | Adequate | No (admin required) | High | ~20% US |

**Recommendation:** Canvas first. Personal access tokens mean students can connect their own data without asking anyone for permission. This is rare and extremely valuable.

---

## 2. Student Information Systems (SIS)

The institutional backbone. Course catalogs, enrollment, registration, transcripts, financial aid. These are the hardest to access but contain the most valuable structural data.

### Ellucian Banner

- **Coverage:** ~1,700+ institutions
- **API type:** RESTful JSON + Ellucian Ethos Integration platform
- **What it contains:** Student records, course catalogs, enrollment, financial aid, academic history, scheduling
- **Access model:** Institutional only — no student self-service API access
- **Integration path:** Ethos APIs (modern REST/JSON) or direct database (Oracle). Ethos is actively developed and preferred
- **Docs:** [Ellucian Developer Examples](https://github.com/ellucian-developer/experience-ethos-examples)
- **Reality check:** Banner data requires institutional partnership. No student can access this independently

### Workday Student

- **Coverage:** Growing rapidly (~100+ institutions, many large research universities migrating)
- **API type:** SOAP (primary) + REST + Reports as a Service (RaaS)
- **What it contains:** Student records, courses, scheduling, financial, HR
- **Access model:** Institutional only
- **Docs:** [Workday Community API](https://community.workday.com/api)
- **Reality check:** Even more locked down than Banner. Enterprise-grade security

### PeopleSoft (Oracle)

- **Coverage:** ~1,000+ institutions (shrinking as schools migrate to Workday/Banner)
- **API type:** Component interfaces, Integration Broker, REST (newer versions)
- **Access model:** Institutional only
- **Trend:** Legacy system, many schools actively migrating away

### SIS Integration Assessment

Student-built tools cannot access SIS data directly. The path is:
1. **Build something useful with data students CAN access** (Canvas, public course catalogs)
2. **Demonstrate value to administrators**
3. **Request institutional API access as a recognized student project**

Universities like Waterloo, Yale, and Maryland have created open data portals that expose course catalog and scheduling data specifically because student demand was high enough.

---

## 3. Campus Dining

Students check dining hours and menus constantly. High-frequency, low-stakes data.

### Major Vendors

| Vendor | Market Share | API Status |
|--------|-------------|------------|
| Aramark | ~30% of US campuses | No public API. Mobile apps exist but closed |
| Sodexo | ~25% of US campuses | No public API |
| Chartwells (Compass) | ~20% of US campuses | No public API |

### How Students Actually Get Dining Data

- **Scraping:** Most campus dining apps/websites are scrapable (menus are public)
- **Published PDFs/pages:** Many dining services publish weekly menus on websites
- **Campus-specific APIs:** Some universities (Waterloo, Maryland) expose dining data through their own open data portals
- **Mobile ordering:** Grubhub Campus Dining, Transact GET, and similar platforms have their own ecosystems but no developer APIs

### Dining Integration Assessment

No standard API exists. The most practical approach:
1. Scrape the campus dining website (menus and hours are public information)
2. Structure the data into a consistent format
3. Cache and serve it — this alone is a valuable campus tool

---

## 4. Campus Transit and Shuttles

### GTFS (General Transit Feed Specification)

- **Standard:** Google-created open standard for transit data
- **What it contains:** Routes, stops, schedules, trip shapes, fare info
- **GTFS Realtime:** Vehicle positions, trip updates, service alerts (Protocol Buffers format)
- **Campus adoption:** Many university shuttle systems publish GTFS feeds

### Universities with GTFS Feeds

- UC San Diego (Triton Transit)
- Texas State University (Bobcat Shuttle)
- Boise State University (Bronco Shuttle)
- Indiana University (IU Shuttle)
- Many others via [OpenMobilityData/TransitFeeds](https://transitfeeds.com/)

### Transit Integration Assessment

- **Data availability:** HIGH — GTFS is an open standard and many campus shuttles publish feeds
- **Developer friendliness:** HIGH — well-documented standard, many open-source parsers
- **Student value:** HIGH — "where's my shuttle" is a universal campus need
- **Integration difficulty:** LOW — standard format, free data, no auth required

**Recommendation:** GTFS is one of the easiest and most valuable integrations. Standard format, public data, immediate student value.

---

## 5. Student Organization Platforms

Where clubs and orgs live. Events, membership, communication.

### Engage (Campus Labs / Anthology)

- **Coverage:** ~1,000+ institutions (merged with Blackboard parent company)
- **What it contains:** Organizations, events, membership rosters, attendance tracking
- **API status:** Limited institutional API; no student developer access
- **Trend:** Consolidating with Blackboard ecosystem

### OrgSync (Legacy, now part of Engage)

- **Historical API:** OrgSync provided an API for IT departments to sync data between OrgSync and campus information systems (pull data out, push data in)
- **Current status:** Merged into Engage platform
- **Docs:** [OrgSync API (legacy)](https://api.orgsync.com/api/docs)

### CampusGroups (Ready Education)

- **Coverage:** ~500+ institutions
- **What it contains:** Student organizations, events, event registration, group communication
- **API status:** No public developer API

### Presence (by Ready Education)

- **Coverage:** ~400+ institutions
- **What it contains:** Event management, attendance, organization management, assessment
- **API status:** No public developer API

### Student Org Platform Assessment

These platforms are walled gardens. The data students actually need from them:
- **Event listings** (what's happening on campus)
- **Organization directory** (what clubs exist)
- **Meeting times/locations**

Most of this data is publicly visible on the platform websites and scrapable. The real opportunity: most students HATE these platforms and would prefer something better.

---

## 6. Consumer Tools Students Already Use

### GroupMe

- **API type:** REST, JSON
- **What you can access:** Groups, messages, direct messages, bots, likes, images
- **Bot API:** Create bots that post to groups and respond to messages via callback URLs
- **Auth:** OAuth for user actions; bot tokens for bot posts
- **Rate limits:** Reasonable for small-scale apps
- **Docs:** [GroupMe Developers](https://dev.groupme.com/tutorials/bots)
- **Student relevance:** EXTREMELY HIGH — GroupMe is the default communication tool on most US campuses
- **Key capability:** Bots can read all messages in a group (via callbacks) and post responses. This enables campus tools that live WHERE students already communicate

### Discord

- **API type:** REST + WebSocket (Gateway), JSON
- **What you can access:** Servers, channels, messages, users, roles, reactions, voice state
- **Bot capabilities:** Full server management, message sending/reading, slash commands, embeds, buttons, modals
- **Webhooks:** Simple POST to send formatted messages to any channel
- **Auth:** Bot tokens for bot actions; OAuth2 for user identity
- **Docs:** [Discord Developer Portal](https://discord.com/developers/docs)
- **Student relevance:** HIGH — dominant in CS/engineering/gaming communities; growing for general student use

### Slack

- **API type:** REST (Web API) + Events API + WebSocket
- **What you can access:** Channels, messages, users, files, reactions, workflows
- **Bot capabilities:** Slash commands, interactive messages, modals, Home tab
- **Webhooks:** Incoming (send messages) and outgoing (receive triggers)
- **Free tier:** Limited message history (90 days) on free plan
- **Student relevance:** MODERATE — used by some orgs and CS departments, but less universal than GroupMe/Discord

### Google Workspace APIs

| API | What It Does | Student Value | Free? |
|-----|-------------|---------------|-------|
| Google Calendar | Read/write events, check availability | Schedule coordination | Yes (generous quota) |
| Google Sheets | Read/write spreadsheet data | Data storage/display | Yes |
| Google Forms | Read responses (not create forms via API) | Collect input | Yes |
| Google Drive | File management, sharing | Document sharing | Yes |
| Google Maps/Places | Location data, directions | Campus navigation | Yes (free tier) |

- **Auth:** OAuth 2.0 for user data; API keys for public data
- **Student relevance:** HIGH — every student has a Google account through their university
- **Key insight:** Google Sheets as a backend is how many student tools already work. Supporting "connect your Google Sheet" is a powerful pattern

### Notion API

- **API type:** REST, JSON
- **What you can access:** Pages, databases, blocks, users, comments, search
- **Auth:** OAuth 2.0 for integrations; internal integration tokens for personal use
- **Rate limits:** 3 requests/second
- **Docs:** [Notion Developers](https://developers.notion.so/)
- **Student relevance:** HIGH among organized/productivity-minded students
- **Key capability:** Notion as database — students already structure data in Notion. Reading/writing Notion databases is a powerful integration

### Spotify API

- **API type:** REST, JSON, OAuth 2.0
- **What you can access:** User playlists, playback, search, recommendations, audio features, artist/album/track data
- **Free tier:** Yes — requires Spotify account (free or premium)
- **Docs:** [Spotify for Developers](https://developer.spotify.com/documentation/web-api)
- **Student relevance:** MODERATE — fun/social feature rather than infrastructure. Collaborative playlists for events, study spaces, party planning

### Payment Apps (Venmo, Cash App)

- **Venmo:** Developer and Payouts APIs have been RETIRED (generally closed to new developers since 2016). Venmo does support payment links and deep links for requesting/sending money, but no programmatic transaction API for new apps
- **Cash App:** No public developer API exists
- **Reality:** Payment integration on campus requires either payment links (redirect to Venmo/CashApp) or a proper payment processor (Stripe, Square). No peer-to-peer API available

### Scheduling Tools (When2Meet, Doodle)

- **When2Meet:** No API. Deliberately minimal, no-signup tool. Extremely popular with students
- **Doodle:** Has an API but primarily for enterprise/paid plans
- **Rallly:** Open-source alternative (MIT license), self-hostable, could be embedded
- **Cal.com:** Open-source scheduling with a proper API
- **Opportunity:** Building a scheduling component INTO student tools (rather than linking out to When2Meet) would be very valuable. When2Meet's simplicity is beloved but its lack of integration is a pain point

---

## 7. Campus Card and ID Systems

### Major Vendors

| Vendor | What It Controls | API Status |
|--------|-----------------|------------|
| CBORD / Transact (merged) | Dining balance, door access, laundry, vending, printing | Closed API; institutional access only |
| TouchNet | Payments, campus commerce | Closed API |
| Atrium | Access control, campus card | Closed API |

### Mobile Wallet Integration

- CBORD/Transact IDX supports Apple Wallet and Google Wallet for student IDs
- Google has a [Campus ID API](https://developers.google.com/wallet/access/campus-id) for mobile credential integration
- These are institutional-level integrations, not available to student developers

### Campus Card Assessment

Completely locked down. Student-built tools cannot access campus card data (meal plan balance, door access, etc.) without institutional partnership. However:
- Meal plan balance is the #1 thing students want to check
- Some universities expose balance-check through their portal (scrapable)
- This is a high-value, high-barrier integration

---

## 8. Campus-Specific Public Data

### Academic Calendars

- Published on every university website
- No standard format — each school does it differently
- Can be scraped and structured into iCal/JSON
- Includes: semester dates, registration deadlines, breaks, finals schedules

### Course Catalogs

- Most universities publish searchable course catalogs online
- No standard API, but many are scrapable
- Some universities (Waterloo, Maryland, Yale) have open APIs
- Contains: course descriptions, prerequisites, meeting times, instructors, room locations

### Campus Maps

- Most universities use Google Maps or custom GIS
- Building locations, parking, accessibility routes
- Some publish GeoJSON or KML files
- Google Maps Platform has free tier for basic usage

### Campus Safety / Emergency Alerts

- Rave Alert, Everbridge, and similar systems
- No public API — push notifications only
- Some universities have RSS feeds for safety alerts
- Clery Act requires public crime statistics (scrapable)

### University Open Data Portals (Examples)

| University | What They Expose | URL Pattern |
|-----------|-----------------|-------------|
| Waterloo | 25+ endpoints: courses, food, buildings, parking, transit, weather | api.uwaterloo.ca |
| Yale | Metadata, courses, events, directories | developer.yale.edu |
| Maryland (UMD.io) | Courses, buses, maps | umd.io |

These are the gold standard. Most universities don't have this, but the ones that do prove the demand.

---

## 9. Weather and External Data

### Weather APIs

| API | Free Tier | Student Program | Best For |
|-----|-----------|----------------|----------|
| OpenWeatherMap | 1,000 calls/day | Yes — free Medium plan for students with .edu email | General weather |
| Open-Meteo | Unlimited (non-commercial) | N/A (already free) | No API key needed |
| WeatherAPI.com | 1M calls/month | No | Weather + astronomy |

### Sports Data

| Source | Type | Cost | Coverage |
|--------|------|------|----------|
| ESPN API (hidden) | REST, undocumented | Free | All NCAA sports, scores, schedules |
| NCAA API | REST, JSON | Free (5 req/sec) | Scores, stats, rankings, schedules |
| CollegeFootballData.com | REST | Free | College football deep stats |
| SportsDataIO | REST | Paid | Comprehensive NCAA data |

### Local Business Data

- Google Places API (free tier: $200/month credit)
- Yelp Fusion API (free: 5,000 calls/day)
- Useful for: campus-area restaurants, study spots, late-night food

---

## 10. Authentication and Identity

### How Universities Handle Auth

| Protocol | What It Is | Campus Prevalence | Student App Integration |
|----------|-----------|-------------------|------------------------|
| CAS (Central Authentication Service) | Single sign-on protocol | Very common | Moderate difficulty — need institutional registration |
| Shibboleth | SAML-based federated identity | Very common (part of InCommon federation) | Hard — need SP registration with IT |
| SAML 2.0 | XML-based auth standard | Universal in higher ed | Hard — requires institutional partnership |
| OAuth 2.0 / OIDC | Modern token-based auth | Growing (Azure AD / Entra ID) | Easier — if school supports it |

### Integration Reality

- Most universities require app registration with IT to use campus SSO
- The process varies wildly: some have self-service portals, others require committee approval
- CAS is simpler to integrate than Shibboleth/SAML but is campus-only (not federated)
- Many schools are migrating to Microsoft Entra ID (Azure AD), which supports standard OAuth 2.0/OIDC — this is the easiest path for student developers
- **For HIVE:** Campus email verification (.edu) is the practical alternative to full SSO integration

### InCommon Federation

- ~1,300+ member institutions
- Enables cross-institutional SAML authentication
- Primarily used by research tools, library systems, and enterprise apps
- Overkill for most student tools — but relevant if HIVE ever needs multi-campus identity

---

## 11. Privacy and Compliance (FERPA)

### What FERPA Protects

Education records — any records directly related to a student maintained by the institution. Includes grades, enrollment, financial aid, disciplinary records.

### What FERPA Does NOT Protect (Directory Information)

Schools MAY designate the following as directory information (shareable without consent):
- Name
- Address and phone number
- Email address
- Date and place of birth
- Major and field of study
- Dates of attendance
- Enrollment status (full/part-time)
- Degrees, honors, awards
- Participation in activities and sports
- Height/weight of athletes
- Most recently attended institution
- Photographs

**Key caveat:** Students can OPT OUT of directory information sharing. Schools must notify students of their right to restrict this.

### What Students CAN Share About Themselves

Students own their own data. A student can:
- Share their own grades, schedule, enrollment status
- Authorize apps to access their Canvas/LMS data (via personal tokens)
- Publish their own profile information
- Share membership in organizations

### What Student-Built Tools Must NOT Do

- Access another student's education records without their consent
- Scrape institutional systems to collect student data en masse
- Store FERPA-protected data without proper security controls
- Share student data with third parties without consent

### HIVE Implications

- **Self-reported data is fine:** Students choosing to share their major, interests, year = no FERPA issue
- **Canvas integration (personal tokens):** Student authorizes their own data = compliant
- **Scraping university directories:** Risky if it includes students who opted out of directory sharing
- **Best practice:** Let students connect their own data; never scrape or bulk-collect student information

---

## 12. Value Ranking: What to Build First

Ranked by: (number of tools that would use it) x (feasibility without institutional approval) x (student value)

### Tier 1: Build Now — No Permission Needed

| Connection | Why | Difficulty | Tools That Use It |
|-----------|-----|-----------|------------------|
| **Canvas API (personal tokens)** | Students connect their own data. Assignments, due dates, grades | Medium | Study tools, planners, group formation, workload balancers |
| **Google Calendar API** | Universal — every student has one | Low | Event tools, scheduling, availability |
| **Google Sheets API** | "Database" students already use | Low | Any tool that needs structured data input |
| **GroupMe Bot API** | Where students already communicate | Low | Notifications, reminders, polls, info bots |
| **GTFS Transit Feeds** | Public data, standard format | Low | Shuttle trackers, commute planners |
| **Weather APIs** | Public, free, instant value | Very Low | Event planning, outdoor activity tools |
| **Discord/Slack Webhooks** | Notifications and integrations | Low | Any tool that needs to push updates |

### Tier 2: Build Soon — Requires Some Effort

| Connection | Why | Difficulty | Tools That Use It |
|-----------|-----|-----------|------------------|
| **Campus dining scraper** | High demand, no API exists | Medium (scraping) | Dining tools, meal planners, dietary filters |
| **Course catalog scraper** | Essential for academic tools | Medium (scraping) | Course planners, schedule builders, professor reviews |
| **Notion API** | Power users love it | Medium | Study tools, project management, knowledge bases |
| **Spotify API** | Social/fun layer | Medium | Event playlists, study music, social profiles |
| **ESPN/NCAA Sports API** | Game days are campus culture | Low-Medium | Game day tools, sports social, tailgate planning |
| **Campus events scraper** | From Engage/CampusGroups/university calendar | Medium (scraping) | Event discovery, campus activity feeds |

### Tier 3: Build Later — Requires Institutional Partnership

| Connection | Why | Difficulty | Tools That Use It |
|-----------|-----|-----------|------------------|
| **Campus SSO (CAS/SAML)** | Real identity verification | High (IT approval) | Any tool needing verified identity |
| **SIS course data (Banner/Workday)** | Authoritative academic data | Very High | Registration tools, degree audits |
| **Campus card balance** | #1 student request | Very High | Meal plan tools, spending trackers |
| **Library systems (OPAC)** | Study room booking, availability | High | Study tools, library finders |
| **Engage/CampusGroups API** | Official org data | High | Org discovery, membership management |
| **Recreation/gym availability** | Crowd-level data | High | Fitness tools, availability checkers |

### Tier 4: Aspirational — Would Transform Campus

| Connection | Why | Difficulty | Tools That Use It |
|-----------|-----|-----------|------------------|
| **University open data portal** | Convince school to create one | Political, not technical | Everything |
| **Campus parking systems** | Real-time lot availability | Very High | Commuter tools |
| **Room/space booking** | Know what rooms are open | Very High | Study group tools, event planning |
| **Laundry machines** | Real-time availability | High (vendor partnership) | Laundry alert tools |

---

## 13. The "Connections" Architecture for HIVE

Based on this research, student-built tools on HIVE would benefit from a connections layer with three patterns:

### Pattern 1: OAuth Connections (User-Authorized)
Student authorizes HIVE tool to access their data on another service.
- Canvas (personal access token)
- Google (OAuth 2.0 — Calendar, Sheets, Drive, Forms)
- Spotify (OAuth 2.0)
- Notion (OAuth 2.0)
- Discord (OAuth 2.0)

### Pattern 2: Bot/Webhook Connections (Push Notifications)
Tool sends messages or data to where students already are.
- GroupMe (bot API)
- Discord (webhooks)
- Slack (webhooks)
- SMS/email (via standard providers)

### Pattern 3: Public Data Connections (No Auth Needed)
Tool reads publicly available campus and external data.
- GTFS transit feeds
- Weather APIs
- Sports scores/schedules
- Academic calendars (scraped/structured)
- Campus dining menus (scraped/structured)
- Course catalogs (scraped/structured)

### The Unlock

The real value is not providing these connections individually — it is providing them as a SHARED LAYER that any student-built tool on HIVE can use. Build the Canvas connector once, and every tool on the platform can offer "connect your Canvas" as a feature. This is the network effect: each new connection makes every tool more powerful.

---

## Sources

- [Canvas LMS REST API](https://developerdocs.instructure.com/services/canvas)
- [Blackboard Developer Portal](https://developer.blackboard.com/portal/displayApi/Learn)
- [Moodle Web Services API](https://supportus.moodle.com/support/solutions/articles/80001016973)
- [Ellucian Ethos Examples](https://github.com/ellucian-developer/experience-ethos-examples)
- [Workday Community API](https://community.workday.com/api)
- [GTFS Specification](https://gtfs.org/)
- [OpenMobilityData](https://transitfeeds.com/)
- [GroupMe Developer Docs](https://dev.groupme.com/tutorials/bots)
- [Discord Developer Portal](https://discord.com/developers/docs)
- [Google Calendar API](https://developers.google.com/workspace/calendar/api/guides/overview)
- [Notion API](https://developers.notion.so/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [OrgSync API (legacy)](https://api.orgsync.com/api/docs)
- [OpenWeatherMap Student Program](https://openweathermap.org/our-initiatives/student-initiative)
- [ESPN Hidden API](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b)
- [NCAA API](https://github.com/henrygd/ncaa-api)
- [FERPA — Student Privacy](https://studentprivacy.ed.gov/ferpa)
- [FERPA Directory Information](https://studentprivacy.ed.gov/content/directory-information)
- [Google Campus ID](https://developers.google.com/wallet/access/campus-id)
- [University API Workshop](https://kinlane.github.io/university-api-workshop/)
- [Venmo API Status](https://venmo.com/docs/overview/)
- [Cal.com (open source scheduling)](https://cal.com)
- [Rallly (open source polling)](https://rallly.co)
