# University at Buffalo — Data Source Research

*Compiled January 2026*

---

## Executive Summary

UB has **15+ data sources** identified, with 8 immediately usable via public APIs. Combined totals provide massive campus content coverage.

| Source | Status | Records | Priority |
|--------|--------|---------|----------|
| CampusLabs Orgs | ✅ Ready | 667 organizations | P0 |
| CampusLabs Events | ✅ Ready | 66,702 events (2,264 upcoming) | P0 |
| UB Places API | ✅ Ready | 298 campus locations | P0 |
| Passio GO Transit | ✅ Ready | Routes, stops, real-time | P0 |
| Reddy Bikeshare GBFS | ✅ Ready | Bikes, stations, availability | P1 |
| UB Calendar | ⚠️ Partial | RSS/iCal available | P1 |
| Modii Parking | ⚠️ Partial | Predictive availability | P1 |
| UB Alert | ⚠️ Manual | Emergency/closures | P2 |
| UB Dining (CBORD) | ⚠️ Limited | Menus, hours | P2 |
| UB Athletics | ⚠️ Limited | iCal per sport | P2 |
| ArcGIS Maps | ⚠️ Partial | Building GIS data | P3 |
| Handshake/Bullseye | ❌ No API | Jobs, internships | P3 |
| Recreation | ❌ No API | Gym hours, programs | P3 |

**Total importable records: ~70,000+**

---

## Tier 1: Production-Ready APIs

### 1. CampusLabs Organizations

**Endpoint:** `https://buffalo.campuslabs.com/engage/api/discovery/`

| Data | Count | Scraper Status |
|------|-------|----------------|
| Organizations | 667 | ✅ Built |
| Events | 66,702 | ✅ Built |
| News | ~1,100 | 🟡 Identified |
| Categories | 38 | ✅ Mapped |
| Branches | 4 | ✅ Mapped |

**Scraper:** `scripts/scrapers/campuslabs-scraper.ts`

---

### 2. CampusLabs Events API

**Endpoint:** `https://buffalo.campuslabs.com/engage/api/discovery/event/search`

**Volume:** 66,702 total events, 2,264 upcoming

**Event Schema:**
```typescript
interface CampusLabsEvent {
  id: string;
  name: string;
  description: string;           // HTML content
  location: string;              // "Davis Hall Atrium"
  startsOn: string;              // ISO 8601
  endsOn: string;
  imagePath: string | null;      // UUID for image
  theme: string;                 // Social, Cultural, Athletics, etc.
  categoryIds: string[];
  categoryNames: string[];       // ["Health and Wellness", "Tabling"]
  benefitNames: string[];        // ["Free Food", "Free Stuff", "Credit"]
  visibility: string;            // Public/Private
  status: string;                // Approved/Pending
  latitude: string | null;
  longitude: string | null;
  rsvpTotal: number;

  // Organization info
  organizationId: number;
  organizationName: string;
  organizationNames: string[];   // Co-hosting orgs
  organizationProfilePicture: string;

  // Classification
  branchId: number;
  branchIds: string[];
  institutionId: number;
}
```

**Themes (event types):**
| Theme | Count |
|-------|-------|
| Social | 19,647 |
| ThoughtfulLearning | 12,056 |
| Cultural | 8,191 |
| Athletics | 6,863 |
| Arts | 6,593 |
| Spirituality | 4,008 |
| GroupBusiness | 3,750 |
| CommunityService | 2,429 |
| Unknown | 1,618 |
| Fundraising | 1,547 |

**Benefits (perks):**
| Benefit | Count |
|---------|-------|
| Free Food | 7,400 |
| Free Stuff | 3,971 |
| Credit | 464 |
| Merchandise | 14 |

**Scraper:** `scripts/scrapers/campuslabs-events.ts`

**Priority:** P0 — Massive value, easy integration

---

### 3. UB Places API

**Endpoint:** `https://www.buffalo.edu/places_api/v1/markers`

Returns JSON object with `results` array of 298 campus locations.

**Schema:**
```typescript
interface UBLocation {
  locationid: string;    // "BELL", "KNOX", etc.
  stateid: string;       // "A210" (state building code)
  title: string;         // "Bell Hall"
  campus: string;        // "North Campus" | "South Campus" | "Downtown Campus"
  areas: string[];       // ["North Campus Area"]
  category: {
    id: string;          // "academic", "adm-serv", "residen", etc.
    title: string;       // "Academic Buildings"
  };
  latlng: [string, string]; // ["43.0015164211526", "-78.7870267849107"]
  keywords: string[];    // ["ACADEMIC"]
}
```

**Categories available:**
| API ID | Title |
|--------|-------|
| academic | Academic Buildings |
| adm-serv | Administrative Services |
| residen | Student Housing |
| arts | Arts & Athletics |
| athletics | Athletics |
| health | Health Services |
| dining | Dining and Shops |
| iconic | Iconic Places |
| parking | Parking |
| transit | Transit |

**Scraper:** `scripts/scrapers/ub-places.ts`

**Priority:** P0 — Easy integration, high value

---

### 4. Passio GO Transit (UB Stampede)

**Platform:** Passio Technologies (passiogo.com)

**Web App:** `https://ubuffalo.passiogo.com/`

**System ID:** 4882

**Unofficial Python API:** [passiogo.readthedocs.io](https://passiogo.readthedocs.io/)

```bash
pip install passiogo
```

**Available Data:**
```python
import passiogo

# Get UB system
ub = passiogo.getSystemFromID(4882)

# Routes
routes = ub.getRoutes()  # All shuttle routes

# Stops
stops = ub.getStops()    # All stops with coordinates

# Alerts
alerts = ub.getSystemAlerts()  # Service alerts
```

**Route Object:**
```python
{
  "id": "...",
  "name": "Blue Line",
  "shortName": "BL",
  "groupColor": "#6ebd52",
  "latitude": 43.0015,
  "longitude": -78.7870,
  "distance": 5.2  # miles
}
```

**Stop Object:**
```python
{
  "id": "...",
  "name": "Student Union",
  "latitude": 43.0012,
  "longitude": -78.7865,
  "radius": 50  # meters
}
```

**Use cases:**
- Real-time shuttle tracking
- "Next bus" predictions
- Route planning between campuses
- Service alerts

**Operator:** WeDriveU (as of July 2024, replaced First Transit)

**Priority:** P0 — High value, API available

---

### 5. Reddy Bikeshare (GBFS)

**Platform:** Social Bicycles (SoBi)

**GBFS Base URL:** `http://reddybikeshare.socialbicycles.com/opendata/`

**Available Endpoints:**
| Endpoint | URL |
|----------|-----|
| Index | `/gbfs.json` |
| System Info | `/system_information.json` |
| Station Info | `/station_information.json` |
| Station Status | `/station_status.json` |
| Free Bike Status | `/free_bike_status.json` |
| System Hours | `/system_hours.json` |
| System Calendar | `/system_calendar.json` |
| System Regions | `/system_regions.json` |
| Pricing Plans | `/system_pricing_plans.json` |
| Alerts | `/system_alerts.json` |

**Example - Station Status:**
```json
{
  "station_id": "123",
  "num_bikes_available": 5,
  "num_docks_available": 10,
  "is_renting": true,
  "is_returning": true,
  "last_reported": 1706215200
}
```

**Fleet:** ~500 bikes (standard + pedal-assist e-bikes)

**Coverage:** UB North Campus, South Campus, Buffalo, Niagara Falls

**Use cases:**
- Bike availability on campus map
- "Find nearest bike" feature
- Integration with transit for multi-modal trips

**Priority:** P1 — Standard GBFS, easy integration

---

## Tier 2: Available but Requires Work

### 6. UB Events Calendar

**Base URL:** `https://calendar.buffalo.edu/`

**Available formats:**
- RSS feeds (dynamically generated per filter)
- iCal exports (webcal:// protocol)
- Google Calendar integration

**API Endpoints:**
```
/handlers/query.ashx?tenant=ubcms&site=ubnews&view=[summary|grid|list]
/handlers/locationsearch.ashx?max=10&input=[search term]
```

**Filters available:**
- Date range
- Category (academic, arts, athletics, etc.)
- Location
- Audience (students, faculty, public)

**Registrar Calendar Feed:** `https://www.buffalo.edu/registrar/calendars/calendar-feed.html`

**Use cases:**
- Official university events in Feed
- Academic calendar integration
- Campus-wide event discovery

**Priority:** P1 — Medium effort, high value

---

### 7. Modii Parking

**Web App:** `https://modii.app/university-at-buffalo`

**Features:**
- Predictive parking availability by lot
- Permit-type filtering
- Event notifications for lot closures
- ParkMobile payment integration

**Upcoming integrations (announced):**
- ChargePoint EV charging availability
- Reddy Bikeshare live availability
- Real-time shuttle information

**API Status:** No public API documented. Contact Modii for partnership.

**Use cases:**
- "Find parking" feature
- Parking predictions before events
- Multi-modal trip planning

**Priority:** P1 — High value, requires partnership

---

### 8. UB Dining (CBORD GET)

**Platform:** CBORD GET System

**Portal:** `https://get.cbord.com/myubcard/`

**Dining Website:** `https://ubdining.com/`

**What's Open:** `https://ubdining.com/locations/whats-open`

**Menus:** `https://ubdining.com/locations/menu`

**Nutrition Database:** `http://nutrition.myubcard.com`

**Available Data:**
- Dining hall locations
- Hours of operation (changes frequently)
- Menus (Crossroads, Governors, Goodyear)
- Nutrition information

**API Status:** No public API. CBORD requires institutional partnership.

**Technology Stack:** Drupal CMS + CBORD backend

**Use cases:**
- "What's open now" feature
- Dining hall hours in space cards
- Meal plan balance (if CBORD API obtained)

**Priority:** P2 — Valuable but complex integration

---

### 9. UB Athletics (SIDEARM Sports)

**Base URL:** `https://ubbulls.com/`

**Available:**
- Composite schedule: `/sports/[year]/[month]/[day]/composite-schedule.aspx`
- Individual sport schedules
- iCal exports per sport (via "Add to Calendar")
- Game results and live scores

**iCal Access:**
1. Navigate to sport schedule page
2. Click "+ Add to Calendar" or "+"
3. Select "Other" to get .ics URL

**Data per event:**
- Date, time, location
- Opponent
- Result/score
- Media links (video, stats, tickets)

**API Status:** No public JSON API. iCal available per-sport.

**Use cases:**
- Athletics events in Feed
- Game day notifications
- Sports community engagement

**Priority:** P2 — iCal import for events

---

### 10. UB Alert / Emergency

**Base URL:** `https://emergency.buffalo.edu/`

**Channels:**
- Website: emergency.buffalo.edu
- Twitter/X: @ub_alert
- UB Guardian App (Rave Mobile Safety)
- Phone: 716-645-NEWS
- Email: UB Alert listserv

**Available:**
- Current campus status (open/closed/limited)
- Weather closures
- Emergency notifications

**Mobile App:** UB Guardian (push notifications)

**API Status:** No public API. Monitor Twitter or scrape website.

**Use cases:**
- Campus status in app header
- Push notifications for closures
- "Is campus open?" feature

**Priority:** P2 — Critical for safety, manual integration

---

## Tier 3: Manual or Limited

### 11. Recreation

**URL:** `https://www.buffalo.edu/recreation`

**Facilities:**
- Alumni Arena (North Campus)
- Clark Hall (South Campus)

**Available (no API):**
- Facility hours (changes weekly, especially for pool/track)
- Program schedules (intramurals, fitness classes)
- Membership info

**Contact:** ub-recreation@buffalo.edu, 716-645-2286

**Challenge:** Hours change weekly due to D1 sports schedules.

**Priority:** P3 — Manual data entry

---

### 12. ArcGIS Campus Maps

**Interactive Map:** `https://experience.arcgis.com/experience/38b2920ca7fd475a9241f2a237cbb4b1/`

**Web Map:** `https://www.arcgis.com/apps/mapviewer/index.html?webmap=a8992f3dabcb4c73a1398ba4ac0d8ffb`

**Available:**
- Building footprints
- GPS coordinates
- Floor plans (limited)

**API Status:** ArcGIS REST API may be available. Requires investigation.

**Priority:** P3 — UB Places API is sufficient for v1

---

### 13. Handshake (Bullseye)

**Platform:** Handshake (bullseye.buffalo.edu)

**Available:**
- Job postings
- Internship listings
- Career events
- Employer connections

**API Status:** No public API. Handshake EDU API requires institutional partnership.

**Priority:** P3 — Future HiveLab integration

---

### 14. Course Catalog / Class Schedule

**Public Search:** `https://www.buffalo.edu/registrar/classes-and-grades/class-schedules.html`

**Catalog:** `https://catalog.buffalo.edu/`

**Available:**
- Course listings by term
- Schedule search by subject/instructor
- Course descriptions

**API Status:** No public API. Likely uses Ellucian Banner backend.

**Priority:** P3 — Complex, deferred

---

### 15. Library Hours

**Hours Page:** `https://library.buffalo.edu/hours`

**Booking System:** `https://booking.lib.buffalo.edu/hours`

**Available:**
- Building hours (7 libraries)
- Study room booking
- Reference desk hours

**API Status:** No public API. Hours displayed via CMS.

**Note:** Silverman Library is 24/7 except intersessions.

**Priority:** P3 — Manual data or scraping

---

## Scraper Roadmap

| Scraper | File | Records | Status |
|---------|------|---------|--------|
| CampusLabs Orgs | `campuslabs-scraper.ts` | 667 | ✅ Done |
| CampusLabs Events | `campuslabs-events.ts` | 66,702 | ✅ Done |
| CampusLabs Schools | `campuslabs-schools.ts` | Registry + probe | ✅ Done |
| UB Places | `ub-places.ts` | 298 | ✅ Done |
| Passio GO Transit | `passio-transit.ts` | Routes + stops | 🟡 TODO |
| Reddy Bikeshare | `reddy-bikeshare.ts` | Stations + bikes | 🟡 TODO |
| CampusLabs News | `campuslabs-news.ts` | ~1,100 | 🟡 TODO |
| UB Calendar | `ub-calendar.ts` | Unknown | 🟡 TODO |
| UB Athletics | `ub-athletics.ts` | Unknown | ⏳ Deferred |

---

## Quick Wins

```bash
# 1. Seed 667 organizations as HIVE spaces
pnpm exec tsx scripts/scrapers/campuslabs-scraper.ts

# 2. Import 2,264 upcoming events
pnpm exec tsx scripts/scrapers/campuslabs-events.ts

# 3. Import 298 campus locations
pnpm exec tsx scripts/scrapers/ub-places.ts

# Test any scraper with --dry-run first
pnpm exec tsx scripts/scrapers/campuslabs-events.ts --dry-run --limit 20

# Probe a new school
pnpm exec tsx scripts/scrapers/campuslabs-schools.ts probe nyu
```

**Total first-run import: ~3,229 records**

---

## Data Integration Strategy

### Phase 1: Launch (Week 1)
1. ✅ Run CampusLabs scraper for 667 organizations
2. ✅ Run UB Places scraper for 298 buildings
3. ✅ Run CampusLabs events scraper for upcoming events
4. Wire building data to space location fields

### Phase 2: Mobility (Week 2)
1. Build Passio GO transit scraper
2. Build Reddy Bikeshare GBFS client
3. Add "Next bus" widget to campus map

### Phase 3: Enrichment (Week 3-4)
1. Build UB Calendar importer (RSS/iCal)
2. Add UB Alert status to app header
3. Import athletics schedule via iCal

### Phase 4: Partnerships (Month 2+)
1. Modii parking integration (requires partnership)
2. CBORD dining integration (requires partnership)
3. Handshake jobs integration (requires partnership)

---

## API Authentication Summary

| Source | Auth Type | Notes |
|--------|-----------|-------|
| CampusLabs | None | Public discovery API |
| UB Places | None | Public JSON endpoint |
| Passio GO | None | Unofficial Python API |
| Reddy GBFS | None | Standard GBFS feeds |
| UB Calendar | None | RSS/iCal feeds |
| UB Alert | None | Scrape/Twitter |
| Modii | Partnership | Contact for API access |
| CBORD | Partnership | Requires institutional deal |
| Handshake | Partnership | EDU API access |

---

## External Tools & Services

| Service | Provider | Used For |
|---------|----------|----------|
| Meal Plans | CBORD GET | Dining points, campus cash |
| Transit Tracking | Passio Technologies | Real-time bus location |
| Parking | Modii | Predictive availability |
| Bikeshare | Social Bicycles (SoBi) | GBFS bike availability |
| Campus Card | CBORD | Door access, payments |
| Emergency Alerts | Rave Mobile Safety | UB Guardian app |
| Career Services | Handshake | Jobs, internships |
| Athletics | SIDEARM Sports | Schedules, scores |

---

## Notes

- Student Association (sa.buffalo.edu) manages 150+ clubs but these overlap with CampusLabs data
- Library hours are CMS-based, not API-accessible
- Recreation uses variable scheduling due to D1 sports
- UB's GIS data was used to populate Google Maps campus data
- Eduroam Wi-Fi now available on UB shuttles (Dec 2025)

---

*Research conducted via public API probing, website analysis, and unofficial API documentation.*

**Sources:**
- [Passio GO Documentation](https://passiogo.readthedocs.io/)
- [GBFS Specification](https://gbfs.org/)
- [Modii UB Partnership](https://www.modii.co/insights/university-at-buffalo-transforms-campus-parking-with-modiis-digital-solutions)
- [UB Parking & Transportation](https://www.buffalo.edu/parking.html)
- [UB Dining](https://ubdining.com/)
- [UB Alert](https://emergency.buffalo.edu/)
