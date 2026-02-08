# Platform Infrastructure Models Research

How the most successful platforms enable users to build infrastructure that serves large audiences. Research conducted February 2026.

---

## 1. Shopify — From "Build Your Store" to App Ecosystem

### What the Platform Provides
- **GraphQL Admin API** for products, customers, orders, inventory, fulfillment (REST deprecated for new public apps)
- **Shopify Functions** — WebAssembly-based backend logic customization (Rust/JS templates)
- **Checkout UI Extensions** — custom UI injected into checkout flow
- **Shopify CLI** — scaffolding, dependency management, local dev
- **App Bridge** — embedded app framework for admin UI integration
- **Polaris** — design system for consistent merchant-facing UX

### What Users Build
Third-party apps extending every aspect of commerce: marketing, inventory, shipping, analytics, loyalty, subscriptions, dropshipping. 11,000+ apps from 7,000+ vendors.

### How Discovery Works
Shopify App Store with categories, search, and editorial collections. New apps need 20-60 reviews before organic discovery kicks in. Median revenue for new apps in first 3 months: $0 (average $39.72 across 700 tracked launches). Discovery is heavily weighted toward established apps.

### How Trust Works
- Manual app review process (5-10 business days)
- Ongoing quality checks by App Excellence Team — requirements can update without notice
- Apps must comply with Partner Program Agreement
- Review/rating system visible to merchants

### How Quality Control Works
- Pre-publish review for compliance, functionality, UX
- Post-publish quality checks can flag or delist apps retroactively
- Requirements evolve — apps previously approved can be flagged under new standards

### Business Model
- 0% on first $1M lifetime revenue (one-time $19 registration)
- 15% on all revenue above $1M lifetime threshold
- Changed from annual reset to lifetime cap in 2025 — developer backlash

### How They Bootstrapped
Started as a simple store builder. The app ecosystem grew organically as merchants needed functionality Shopify didn't build natively. Shopify invested in developer tools (CLI, APIs, Polaris) to make extending the platform feasible. The marketplace created a flywheel: more apps attracted more merchants, which attracted more developers.

### What Broke
- **Revenue concentration**: Top 25% earn $167K+/year; 0.18% reach $1M+. Over half earn <$1K/month
- **Discovery gap**: New apps are essentially invisible without paid marketing or existing audience
- **Revenue share changes**: Lifetime cap replacing annual reset angered developers who built businesses on the old model
- **Quality vs. quantity**: 11,000 apps means most categories are saturated with near-identical solutions

---

## 2. Salesforce / Force.com — Enterprise App Platform

### What the Platform Provides
- **Lightning App Builder** — drag-and-drop app creation (low-code)
- **Apex** — proprietary server-side language for custom logic
- **Lightning Web Components (LWC)** — modern component framework
- **Visualforce** — legacy page rendering framework
- **Flow Builder** — no-code automation tool for business users
- **APIs** — REST and SOAP for external integration
- **Sandboxes** — isolated development environments

### What Users Build
Enterprise apps on top of CRM data: industry-specific solutions, integrations with ERPs, marketing platforms, payment gateways. From simple record management to complex multi-object workflows. Non-developers build automation with Flow Builder; developers build with Apex/LWC.

### How Discovery Works
AppExchange — the first enterprise app marketplace (launched 2005). Categories, search, editorial curation. Direct pipeline to 175,000+ customers. Community of 20M+ Trailblazers.

### How Trust Works
- **Security review** — mandatory before AppExchange listing
- **Business approval** — pricing model alignment with program policies
- **Partner Application Distribution Agreement (PADA)** — varies per partner
- **Dedicated account managers** for ISV partners
- Enterprise buyers trust apps on AppExchange because they run inside Salesforce's security perimeter

### How Quality Control Works
- Two-phase approval: business approval + technology/security review
- Ongoing compliance monitoring
- ISV partners must maintain standards or face delisting
- Security reviews are thorough — can take weeks to months

### Business Model
- 15% revenue share (PNR model)
- AppExchange Checkout: 15% + $0.30/transaction (Stripe processing)
- Four pricing models: Free, Paid, Freemium, Paid Add-On
- ISV partners pay for Salesforce platform licenses to develop on

### How They Bootstrapped
Salesforce was CRM-first. Force.com (2007) opened the platform for custom apps. AppExchange launched in 2005 — two years before the iPhone App Store. They leveraged their existing customer base as guaranteed distribution. Trailhead (learning platform) created a pipeline of developers trained specifically on Salesforce's proprietary stack.

### What Broke
- **Vendor lock-in**: Apex is proprietary — skills and code don't transfer
- **Complexity**: Platform has accumulated 20+ years of concepts, APIs, and frameworks
- **Cost**: Platform licenses, per-seat pricing, and development costs make it expensive for smaller players
- **Review bottleneck**: Security reviews can take months, slowing time-to-market
- **Legacy overhang**: Visualforce, Classic, and Lightning coexist — fragmented developer experience

---

## 3. Roblox — Creator-to-Audience Pipeline

### What the Platform Provides
- **Roblox Studio** — full 3D game engine (free, desktop app)
- **Luau** — proprietary scripting language (Lua-derived)
- **Asset Manager** — models, textures, audio, animations
- **Roblox Cube** — generative AI for 3D/4D content creation
- **Voice/Text APIs** — NPC creation with speech understanding
- **Real-time voice translation** — multilingual voice chat
- **MCP integration** — automation between external tools and Studio
- **Analytics dashboard** — QPTR, DAU, retention metrics
- **Advertising tools** — in-experience ads, sponsored experiences

### What Users Build
Full 3D experiences: games, social hangouts, concerts, brand activations. Anything from simple obstacle courses to complex MMOs. Creators also build and sell individual assets (models, plugins, audio).

### How Discovery Works
Algorithm-driven home feed. Quality Tier Performance Rating (QPTR) determines visibility. Thumbnail personalization. Category browsing. Personalized recommendations. Brand partnerships (Mattel, Netflix, Sega, Lionsgate) drive traffic to specific experiences.

### How Trust Works
- Content moderation (96% automated in 2025 on Discord — Roblox has similar systems)
- Age-appropriate content ratings
- Brand partnership vetting
- Community reporting systems
- Trust & Safety team

### How Quality Control Works
- QPTR algorithm rewards retention, engagement, and session time
- Experiences that don't retain users get deprioritized algorithmically
- No pre-publish review for most content — quality is market-driven
- Brand partnerships require separate vetting

### Business Model
- 30% platform cut on all Robux transactions
- DevEx rate: $0.0035 per Robux (effective creator take ~65% after all cuts)
- Creators earned $1B+ globally (March 2024-2025), up 31% YoY
- 29,000+ creators in DevEx program; median earnings $1,440/year
- 8.5% DevEx conversion rate increase announced 2025

### How They Bootstrapped
Started as a physics sandbox (2006). The Lua scripting layer turned it into a game creation platform. Free-to-use Studio with zero publishing costs removed all barriers. Young creators (often 12-18) learned to build on the platform, creating a self-sustaining creator pipeline. Cross-platform availability (mobile, PC, console, VR) maximized audience reach.

### What Broke
- **QPTR instability**: Algorithm changes kill established games overnight. Inconsistent metrics between Overview and Acquisition dashboards
- **Thumbnail personalization bugs**: Algorithm picks worst-performing thumbnails
- **External dependencies**: AWS outage in Oct 2025 had lasting negative impact on game discovery
- **Revenue concentration**: Median DevEx earnings ($1,440/year) — most creators earn almost nothing
- **Child labor concerns**: Young creators building value for the platform sparked criticism
- **Platform dependency**: One algorithm change can destroy years of work

---

## 4. iOS / Android App Stores — Trust at Scale

### What the Platform Provides

**Apple:**
- Xcode, SwiftUI, UIKit, Core frameworks
- TestFlight for beta distribution
- App Store Connect for submission/analytics
- In-App Purchase and subscription infrastructure
- Push notifications, CloudKit, HealthKit, etc.

**Google:**
- Android Studio, Jetpack Compose, Material Design
- Google Play Console
- Firebase suite (auth, database, analytics, crashlytics)
- Play Billing Library

### What Users Build
Everything: utilities, games, social, productivity, health, finance, entertainment. 1.58M apps on Google Play (after cleanup). ~1.8M on iOS App Store.

### How Discovery Works
Search (dominant), editorial features, category charts, personalized recommendations. Both stores suffer from severe discovery problems — most users download apps they already know about. The long tail is flatter than standard power law: discoverability for new/small apps is essentially broken.

### How Trust Works

**Apple:** Manual review of every app version and update. Human reviewers check functionality, content, and policy compliance. Review times ~24 hours (down from weeks pre-2016).

**Google:** Automated ML-based review by default. Apps go live in hours. Manual review triggered only for flagged content. Post-publish reviews can result in removal.

**Google 2025 addition:** New developer accounts require 12 engaged testers for 14 days before first public launch.

### How Quality Control Works
- Apple: Higher quality bar, slower iteration
- Google: Faster publishing, reactive enforcement
- Google cleaned up store to 1.58M apps (Sept 2025) — removed 27.2K apps vs 43.8K launched that month
- Stricter 2025 policies: Only 4.5+ star, high-retention apps survive discovery algorithm
- 71% of users churn within 90 days on both platforms

### Business Model
- 30% commission (standard), 15% for small developers (<$1M/year)
- Apple: $99/year developer account
- Google: $25 one-time registration
- Both take 15-30% of in-app purchases and subscriptions

### How They Bootstrapped
Apple: iPhone launch (2007) created demand. Initial 500 apps at launch. "There's an app for that" marketing made the store a destination. App Store was the only way to distribute iOS software — captive ecosystem.

Google: Android Market (2008) launched as open alternative. Lower barriers than Apple. Acquired by openness — APK sideloading possible but Play Store became default.

### What Broke
- **Discovery is broken**: App Store is a "vending machine" — users download what they already know. Search results have relevance and consistency problems
- **Revenue concentration**: Top 1% of apps capture vast majority of revenue
- **Review inconsistency** (Apple): Same app approved/rejected by different reviewers
- **Race to free**: Ad-supported model dominates, creating perverse incentives
- **Platform tax debate**: Epic v. Apple lawsuit; regulatory pressure in EU (DMA), Japan, South Korea
- **App abandonment**: Most apps are downloaded once and never opened again

---

## 5. WordPress — From Blog Tool to 43% of the Web

### What the Platform Provides
- **Core CMS** — content management, user roles, media handling, REST API
- **Plugin API** — hooks (actions/filters), custom post types, taxonomies, shortcodes
- **Theme API** — template hierarchy, customizer, block themes
- **Block Editor (Gutenberg)** — visual editing with reusable blocks
- **WP-CLI** — command-line management
- **Multisite** — single installation managing multiple sites

### What Users Build
Plugins (65,000+ on WordPress.org, 59,000+ free) and themes (13,000+ on WordPress.org, 12,000+ on ThemeForest). Everything from SEO tools to e-commerce (WooCommerce), membership sites, LMS, forums, booking systems, and full SaaS products.

### How Discovery Works
WordPress.org plugin/theme directory with search, categories, tags, popularity sorting. ThemeForest and other third-party marketplaces. Word of mouth and blog recommendations are major discovery channels. "Active installations" count provides social proof.

### How Trust Works
- WordPress.org has a plugin review team (volunteer-based)
- Ratings and reviews from users
- "Active installations" and "last updated" dates signal maintenance
- No sandboxing — plugins run with full WordPress privileges
- Security is fundamentally trust-based — users install code that has full database access

### How Quality Control Works
- Initial review for obvious issues (GPL compliance, basic security)
- No ongoing quality checks for most plugins
- Abandoned plugins remain available (some for years after last update)
- Security researchers (Patchstack, Wordfence) independently audit and report vulnerabilities
- 7,966 new vulnerabilities discovered in 2024 (up 34% from 2023)
- Only ~50% of users update to patched versions

### Business Model
- WordPress.org: Free, open-source. No revenue share
- WordPress.com (Automattic): Hosted plans $4-$45/month
- ThemeForest: 12.5-87.5% commission depending on exclusivity
- Plugin developers monetize via freemium (free on .org, pro version separately)
- Premium themes average ~$59

### How They Bootstrapped
Started as a blogging fork (b2/cafelog, 2003). Plugin architecture added in 2004. Themes in 2005. The GPL license meant anyone could build and sell. Low barrier: PHP developers could extend WordPress without learning new languages. Hosting companies bundled WordPress with one-click installs, creating massive distribution. Community-driven: WordCamps, contributor days, Slack channels.

### What Broke
- **Security nightmare**: 64,782 total tracked vulnerabilities. Plugins have full system access with no sandboxing
- **Abandoned plugins**: Unmaintained code stays available and gets exploited (Eval PHP plugin dormant for a decade before exploitation)
- **Quality floor is low**: Initial review catches obvious issues but not architectural problems
- **Update fatigue**: Only half of users update to patched versions, leaving hundreds of thousands of sites exposed
- **Governance crisis**: Matt Mullenweg vs. WP Engine conflict (2024) shook ecosystem trust
- **Plugin conflicts**: No dependency management — plugins can break each other unpredictably

---

## 6. Figma Community — Design Infrastructure Sharing

### What the Platform Provides
- **Plugin API** — extend Figma functionality across Design, Dev Mode, FigJam, Slides
- **Widget API** — collaborative objects visible to all file participants (unlike plugins)
- **Community profiles** — creator identity, portfolio, follower counts
- **Community pages** — showcase files, plugins, widgets with descriptions and previews
- **Native payment system** — built-in monetization for approved creators
- **Creator Fund** — grants program for creators of free resources
- **Design system libraries** — publishable, shareable component libraries

### What Users Build
- Design files: UI kits, wireframe templates, icon sets, design systems
- Plugins: automation, content generation, accessibility checkers, AI integrations
- Widgets: voting tools, timers, sticky notes, embedded data from external apps
- Templates for FigJam, Slides, and collaborative workflows

### How Discovery Works
Figma Community page with browse, search, categories, and "trending" sections. Creator profiles aggregate all published resources. Social proof via "duplicated by X users" counts and likes. No sophisticated recommendation algorithm — mostly search and browse.

### How Trust Works
- Figma reviews plugins/widgets before Community listing
- Creator verification through account identity
- User ratings and duplicate counts as social proof
- 10% platform fee on paid resources creates alignment
- Third-party payment links allowed in plugin UI and descriptions

### How Quality Control Works
- Plugin submission review before publishing
- Data size limits enforced (100KB setPluginData limit)
- API stability issues: bugs in fill modification, inconsistent behavior across license types
- Plugin loading failures reported after platform updates
- Figma paused new creator approvals for paid files (still approving paid plugins/widgets)

### Business Model
- 10% flat fee on paid plugins and widgets sold via native payment
- Creator Fund grants for free resources
- Third-party monetization allowed (Gumroad, Stripe, etc.)
- Primary revenue from Figma subscriptions, not community marketplace

### How They Bootstrapped
Figma's collaborative, browser-based model made sharing inherently social. Community files could be "duplicated" with one click — zero friction to try someone's work. The plugin API launched in 2019, extending the platform beyond design-only. The Creator Fund incentivized free publishing, building the library before monetization existed.

### What Broke
- **Monetization limitations**: Paused new creator approvals for paid files — inconsistent policy signals
- **Plugin API instability**: Bugs break plugins after platform updates; validation errors on pattern fills
- **Data restrictions**: 100KB limit on plugin data storage enforced retroactively
- **License-type inconsistencies**: Plugins behave differently depending on seat type (Full vs. Collab)
- **No real marketplace economics**: Most resources are free; monetization is nascent and limited
- **Discoverability**: Basic search/browse — no real recommendation engine

---

## 7. Notion — Template Ecosystem and Viral Growth

### What the Platform Provides
- **Template API** — duplicate-able workspace templates
- **Notion API** — database queries, page creation, user management
- **Marketplace** — 30,000+ templates with built-in payment
- **Integrations** — Slack, GitHub, Google Drive, Zapier connections
- **Formulas and Relations** — pseudo-database functionality
- **Ambassador Program** — beta features, community support for power users

### What Users Build
Templates: project management systems, CRM, habit trackers, content calendars, personal dashboards, second brains, budget trackers, student planners, portfolio sites. Some creators build full "Notion-based SaaS" by combining templates with API integrations.

### How Discovery Works
- Notion Marketplace (in-app and web) with categories and search
- 95% organic traffic through community-led growth
- Template sharing via social media (Twitter/X, TikTok, YouTube)
- Creator courses teaching Notion spread awareness
- Ambassador program creates evangelists who produce tutorials

### How Trust Works
- Marketplace review before listing
- Creator profiles with follower counts
- Preview before purchase
- Ratings and reviews
- Notion's own brand trust transfers to marketplace items

### How Quality Control Works
- Marketplace submission review
- Template preview functionality
- Community reviews and ratings
- No automated quality checks — human review
- Templates are inherently safe (no code execution — just data structures)

### Business Model
- Notion Marketplace: 10% + $0.40 per transaction
- Biweekly payouts, $20 minimum
- 1% additional FX fee for non-US creators
- Third-party marketplaces: Gumroad (10% + $0.50), NotionEverything (20%)
- Top creators: Thomas Frank ($1M+), Easlo ($500K+), others at $1K-$3K/month

### How They Bootstrapped
Product-led growth: free personal tier created massive user base. Templates were shareable via links — every shared template was marketing for Notion. Ambassador program incentivized power users to create courses, tutorials, and templates. Community-led growth acted as "multiplier on top of product-led growth." The template ecosystem gave Notion use-case diversity it didn't have to build itself.

### What Broke
- **Template quality variance**: Low barrier means many low-effort templates flood the marketplace
- **Platform dependency**: Creators build on Notion's infrastructure — if Notion changes, templates break
- **Limited monetization ceiling**: Templates are one-time purchases, not recurring revenue
- **Copycat problem**: Successful templates get duplicated and resold by others
- **No code execution**: Templates can only organize information, not automate — limiting what "infrastructure" means
- **Creator concentration**: A few creators capture most of the revenue; long tail earns little

---

## 8. Discord — Bot/App Ecosystem

### What the Platform Provides
- **Bot API** — full access to server events, messages, members, channels
- **Slash Commands** — structured command system (max 100 global + 100 per guild)
- **App Directory** — centralized discovery for vetted apps
- **Developer Portal** — app creation, token management, OAuth2
- **Interactions API** — buttons, select menus, modals
- **Activities** — embedded apps within voice channels
- **AutoMod API** — automated content moderation tools
- **Client libraries** — discord.js, discord.py, nextcord, etc.

### What Users Build
Bots for moderation (Carl-bot, Dyno), music, games, leveling/XP, ticketing, welcome messages, role management, analytics, AI chat, and custom server experiences. Activities for in-call games and apps.

### How Discovery Works
- App Directory: search, browse, categories
- Server owners discover bots through community recommendations
- Bot listing sites (top.gg, Discord Bot List) serve as secondary discovery
- Social proof: server count displayed on bot profiles
- "Enable Discovery" opt-in through Developer Portal

### How Trust Works
- Apps must comply with Developer Terms of Service, Developer Policy, Content Requirements
- Discord can remove apps from App Directory at any time for trust/safety concerns
- Trust & Safety team: 250+ employees globally
- 96% of moderation actions automated (423,000 daily actions average)
- AutoMod V2 reduced manual intervention by 37% vs 2024
- Server admins control which bots can access their server and what permissions they have

### How Quality Control Works
- Opt-in to App Directory requires meeting quality bar
- No formal pre-publish review for bots in general (anyone can create a bot)
- App Directory listing has additional requirements
- Community ratings and server adoption counts
- Discord reserves right to delist for any trust/safety concern

### Business Model
- No revenue share — bots are free to create and run
- Discord monetizes through Nitro subscriptions and server boosts
- Bot developers monetize independently (Patreon, premium tiers, hosted dashboard subscriptions)
- Discord does not participate in bot creator economics

### How They Bootstrapped
Discord launched as a gaming voice chat (2015). The bot API existed from early on — community developers built moderation and music bots that became essential to running servers. The bot ecosystem made Discord sticky: servers couldn't function without their bots. Discord never charged developers, keeping the barrier at zero. The App Directory (2022) formalized discovery but bots had been thriving for years via word-of-mouth.

### What Broke
- **No native monetization**: Bot developers must figure out their own revenue — no platform support
- **Bot hosting costs**: Developers pay for compute out of pocket; popular bots can be expensive to run
- **Verification bottleneck**: Getting verified (required at 100+ servers) can be slow
- **API breaking changes**: Discord has deprecated features (message content intent changes) that broke existing bots
- **Music bot crackdown**: YouTube/Spotify legal pressure killed major music bots (Rythm, Groovy)
- **Trust asymmetry**: Server admins give bots powerful permissions often without understanding the risk

---

## 9. Twilio / Stripe — Capabilities + Connections

### What the Platform Provides

**Twilio:**
- APIs for SMS, voice, video, email (SendGrid), WhatsApp, conversations
- Programmable communications — every interaction is an API call
- Twilio Studio — visual workflow builder (low-code)
- Account/subaccount architecture for multi-tenant apps
- Global carrier network abstracted behind API

**Stripe:**
- Payments API — cards, ACH, wire, 135+ currencies
- Stripe Connect — marketplace/platform payment infrastructure
- Stripe Billing — subscriptions and invoicing
- Stripe Identity — verification
- Prebuilt UI components (Checkout, Elements, Payment Links)
- Stripe Apps — extensions within the Stripe Dashboard
- Comprehensive webhooks for event-driven architecture

### What Users Build
Developers don't build "apps on an app store" — they embed Twilio/Stripe capabilities into their own products. Twilio: notification systems, call centers, 2FA, chat support, appointment reminders. Stripe: checkout flows, subscription billing, marketplace payment splitting, identity verification.

### How Discovery Works
Not applicable in the traditional sense. These are infrastructure APIs, not marketplaces. Discovery = developer documentation, tutorials, and word-of-mouth. Stripe and Twilio "discover" customers through:
- Documentation quality (universally praised)
- Developer community and evangelism
- Technical blog posts and conference talks
- Sample apps and quickstart guides

### How Trust Works
- PCI compliance (Stripe handles all card data, removing burden from developers)
- SOC 2, ISO 27001 certifications
- Global regulatory compliance handled by the platform
- Enterprise SLAs
- Transparent status pages and incident communication

### How Quality Control Works
- Not applicable — developers use APIs to build their own products
- Stripe Apps (dashboard extensions) have a review process
- API versioning ensures backward compatibility
- Deprecation policies with long migration windows

### Business Model
- **Twilio**: Usage-based pricing (per SMS, per minute, per email). No upfront costs
- **Stripe**: 2.9% + $0.30 per transaction (standard). Volume discounts for enterprise. Connect fees on top for marketplace features
- Both: no monthly fees, pay only for usage

### How They Bootstrapped
**Twilio (2008)**: Jeff Lawson saw that telecommunications required carrier relationships, hardware, and months of integration. Twilio made it a single API call. Targeted developers directly (not enterprises) — "land with devs, expand to enterprise." Grew from 900K devs (2016) to 10M (2020).

**Stripe (2010)**: Patrick and John Collison saw that accepting payments online required merchant accounts, payment gateways, and weeks of integration. Stripe reduced it to 7 lines of code. Targeted YC startups first — as startups grew, Stripe grew with them.

### What Broke
**Twilio:**
- Internal architecture couldn't scale: micro-frontend system became obsolete as products multiplied
- Build systems built in 2008 couldn't support 50 engineers by 2013
- Tooling divergence across teams — uneven developer effectiveness
- CPaaS market became commoditized — fierce competition
- Layoffs (2022-2023) after over-hiring during COVID

**Stripe:**
- Early Connect architecture forced trade-offs: choosing custom monetization locked you out of hosted dashboards
- Complexity grew as product surface expanded (20+ products)
- Enterprise sales motion conflicted with self-serve developer culture
- Regulatory complexity in different markets (India restrictions, EU PSD2)

---

## 10. WeChat Mini Programs — Apps Inside a Super App

**CLOSEST MODEL TO "APPS INSIDE A CAMPUS PLATFORM"**

### What the Platform Provides
- **WXML/WXSS** — WeChat's HTML/CSS-like markup languages
- **WeChat Pay** — integrated payment processing
- **Location services** — GPS, nearby, maps
- **QR code generation/scanning** — primary distribution mechanism
- **Social APIs** — sharing to chats, Moments, group messages
- **41+ entry points** — embedded in chats, Moments, Official Account menus, search, QR codes
- **User identity** — WeChat login (real-name verified in China)
- **Camera, Bluetooth, NFC** — device capability access
- **Cloud development** — serverless backend provided by WeChat

### What Users Build
Mini-apps for everything: e-commerce, food delivery, ride-hailing, ticket booking, government services, healthcare, education, gaming, loyalty programs. 3.5M+ active mini programs. In 2023, mini programs handled 2.7 trillion RMB ($370B+) in transactions.

### How Discovery Works
- **De-centralized philosophy**: WeChat deliberately does not have an "app store" with charts and rankings
- QR codes (physical and digital) — primary discovery mechanism
- Sharing via chat messages and group chats (social discovery)
- "Nearby" mini programs based on GPS
- WeChat Search (in-app search)
- "Recently used" list (swipe down on chat page)
- Official Account integration (embedded in content)
- Discovery through Moments posts and ads
- 41+ entry points scattered throughout WeChat

### How Trust Works
- **Real-name verification** — WeChat accounts tied to Chinese national ID
- **Business verification** — only Chinese entities or WFOEs can publish
- **Manual review** — 1-3 day approval process for every submission and update
- **Tencent can remove** mini programs at any time
- Social trust: mini programs spread through personal shares and group chats, not anonymous discovery

### How Quality Control Works
- Pre-publish review for every version (content compliance, functionality, regulations)
- Category-specific licensing requirements (e.g., e-commerce needs business license, healthcare needs medical permits)
- Every update requires re-submission and re-approval
- Tencent enforces Chinese regulatory requirements (ICP filing, real-name verification)
- No sideloading — the only way to distribute is through WeChat's approved channels

### Business Model
- WeChat Pay transaction fees (~0.6% for most merchants)
- Advertising within mini programs (WeChat Ad Network)
- No "app store tax" — no percentage of mini program revenue
- Mini programs drive WeChat Pay adoption, which is the real monetization lever

### How They Bootstrapped
WeChat had 1B+ users before mini programs launched (2017). The QR code was already ubiquitous in China for payments. Mini programs required no download, no installation — scan a QR code and you're in. Merchants adopted because their customers were already in WeChat. The "de-centralized" model meant discovery happened through existing social relationships, not algorithms. COVID accelerated adoption as physical businesses needed contactless solutions.

### What Broke
- **Discoverability wall**: No central app store means organic discovery is very hard — you need existing audience or paid ads
- **International exclusion**: Only Chinese entities can publish — non-Chinese businesses need a WFOE (expensive)
- **Update friction**: Every update requires re-approval (1-3 days) — can't iterate quickly
- **Regulatory overhead**: Different categories require different licenses and permits
- **Platform dependency**: WeChat controls all distribution — if your mini program is removed, you lose everything
- **Technical constraints**: Limited Bluetooth support (BLE only), constrained runtime, 2MB package size limits
- **Censorship risk**: Content must comply with Chinese regulations — Tencent has removed mini programs for political reasons

---

## Cross-Platform Patterns

### What Every Successful Platform Provides

| Capability | Examples |
|-----------|----------|
| **Identity** | WeChat real-name, App Store developer accounts, Salesforce org identity |
| **Distribution** | App stores, directories, QR codes, social sharing |
| **Payment infrastructure** | Stripe Connect, WeChat Pay, IAP, Shopify Payments |
| **Development tools** | SDKs, CLIs, APIs, visual builders |
| **Hosting/compute** | Roblox servers, Shopify Functions, WeChat cloud dev |
| **Data access** | Platform data APIs (customers, orders, users, etc.) |
| **Design systems** | Polaris (Shopify), Material (Google), Figma plugins |

### Universal Bootstrap Pattern
1. Build something people use daily (chat, commerce, gaming, work tool)
2. Open an extension point (API, plugin system, template system)
3. Remove friction (free tools, zero publishing cost, instant distribution)
4. Let community build what you can't (10x the feature surface without 10x the team)
5. Add discovery once volume justifies it (not before)

### Universal Failure Patterns

| Failure | Platforms Affected |
|---------|-------------------|
| **Discovery concentration** — top creators/apps capture 90%+ of attention | All of them |
| **Revenue concentration** — long tail earns nearly nothing | Shopify, Roblox, App Stores, Notion |
| **Platform dependency** — one policy change destroys businesses | All of them |
| **Quality control at scale** — either too strict (slow) or too loose (security/spam) | WordPress, App Stores, Roblox |
| **API breaking changes** — platform updates break existing integrations | Discord, Figma, Roblox |
| **Review bottleneck** — manual review doesn't scale | Apple, Salesforce, WeChat |

### Revenue Share Comparison

| Platform | Take Rate |
|----------|-----------|
| Apple/Google | 15-30% |
| Roblox | ~35% effective (after DevEx) |
| Shopify | 0-15% (lifetime threshold) |
| Salesforce AppExchange | 15% |
| Figma | 10% |
| Notion | 10% + $0.40/tx |
| Discord | 0% |
| WeChat | 0% (revenue from payments infra) |
| WordPress.org | 0% |
| Twilio/Stripe | Usage-based (not a marketplace) |

### Most Relevant Model for HIVE: WeChat Mini Programs

WeChat is the closest analogy to "apps inside a campus platform" because:

1. **Captive audience**: Users are already in the app for other reasons (chat → campus life)
2. **Social discovery over algorithmic**: Tools spread through friend groups, not search rankings
3. **QR code distribution**: Physical campus presence (posters, flyers) maps to QR-based discovery
4. **Identity is solved**: Real-name verification exists (campus email verification in HIVE's case)
5. **No separate install**: Mini programs run inside the host app — no App Store friction
6. **De-centralized philosophy**: Tools spread through use, not through a "store" — aligns with HIVE's "place to do" ethos

Key differences: HIVE operates at campus scale (thousands, not billions), which changes discovery dynamics. HIVE doesn't need to solve payment infrastructure (most campus tools are free). HIVE's advantage is that campus context makes curation feasible — a campus of 5,000 students only needs 20-50 tools, not 3.5 million.
