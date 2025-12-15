# University at Buffalo Launch Guide

This document outlines the complete launch procedure for HIVE at UB Buffalo.

## Campus Configuration

| Setting | Value |
|---------|-------|
| Campus ID | `ub-buffalo` |
| School Name | University at Buffalo |
| Email Domain | `buffalo.edu` |
| CampusLabs URL | `https://buffalo.campuslabs.com` |
| Student Population | ~32,000 |
| Pre-seeded Organizations | 400+ |

## Pre-Launch Checklist

### 1. Environment Setup
- [ ] Firebase project configured (`hive-9265c`)
- [ ] `apps/web/.env.local` contains `FIREBASE_SERVICE_ACCOUNT_KEY`
- [ ] Vercel environment variables set
- [ ] Domain configured (if custom)

### 2. Data Seeding
```bash
# Full production seed (spaces + events + tools)
pnpm launch:ub

# Or step by step:
pnpm seed:campuslabs        # Import 400+ CampusLabs organizations
pnpm seed:events:sync       # Sync events from CampusLabs RSS
pnpm seed:events            # Add demo events
pnpm seed:tools             # Add HiveLab templates
```

### 3. Verification
```bash
# Run launch verification
pnpm launch:verify
```

Expected output:
- ✅ School Configuration - PASS
- ✅ Space Count (300+) - PASS
- ✅ Live Spaces - PASS
- ✅ CampusLabs Import - PASS
- ✅ Event Count (10+) - PASS
- ✅ Tool Templates (3+) - PASS
- ✅ Campus Isolation - PASS

## Seeding Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION SEED                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. seed-school.mjs                                             │
│     └── Creates schools/ub-buffalo document                     │
│         • name, emailDomain, features                           │
│                                                                  │
│  2. import-campuslabs.mjs                                       │
│     └── Fetches from CampusLabs API                             │
│         • 400+ organizations                                    │
│         • Maps categories (student_org, greek_life, etc)        │
│         • Creates spaces with source.platform: 'campuslabs'     │
│         • Sets publishStatus: 'live', claimStatus: 'unclaimed'  │
│                                                                  │
│  3. sync-campuslabs-events.mjs                                  │
│     └── Fetches from RSS feed                                   │
│         • Links events to spaces by host name                   │
│         • Creates events collection                             │
│                                                                  │
│  4. seed-demo-events.mjs                                        │
│     └── Generates additional events                             │
│         • Realistic titles and descriptions                     │
│         • Distributed across spaces                             │
│         • Next 60 days                                          │
│                                                                  │
│  5. seed-tool-templates.mjs                                     │
│     └── Creates HiveLab templates                               │
│         • Weekly Poll, Event RSVP, etc                          │
│         • Marked as featured                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Space Categories

| Category | CampusLabs Branch | Description |
|----------|------------------|-------------|
| `student_org` | 1419 | Student clubs and organizations |
| `university_org` | 360210 | Official university services |
| `greek_life` | 360211 | Fraternities and sororities |
| `residential` | 360212 | Residence halls and housing |

## Key Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `schools` | Campus config | `id`, `name`, `emailDomain`, `features` |
| `spaces` | Communities | `campusId`, `category`, `publishStatus`, `source` |
| `events` | Events | `campusId`, `spaceId`, `startDate`, `endDate` |
| `tools` | HiveLab tools | `campusId`, `isPublic`, `isFeatured` |
| `profiles` | User profiles | `campusId`, `handle`, `displayName` |
| `spaceMembers` | Memberships | `spaceId_userId` composite key |

## Campus Isolation

All queries enforce campus isolation via `campusId`:

```typescript
// Server-side (apps/web/src/lib/secure-firebase-queries.ts)
export const CURRENT_CAMPUS_ID = getDefaultCampusId(); // Returns 'ub-buffalo'

// Every query includes:
.where('campusId', '==', campusId)
```

## API Endpoints

### Browse Spaces
```
GET /api/spaces/browse-v2?category=all&sort=trending&limit=20
```

### Search
```
GET /api/search?q=computer+science&category=spaces
```

### Events (per space)
```
GET /api/spaces/{spaceId}/events?upcoming=true&limit=20
```

## Deployment

```bash
# Build and deploy to Vercel
vercel --prod

# Or via git
git push origin main  # Triggers Vercel deployment
```

## Post-Launch Tasks

1. **Monitor Analytics**
   - Check `/api/admin/analytics` for platform metrics
   - Monitor Firebase console for errors

2. **Event Sync Cron**
   - Set up periodic event sync from CampusLabs RSS
   - Recommended: Daily at 6 AM

3. **Admin Setup**
   - Add admin users to `admins` collection
   - Configure moderation settings

4. **Community Outreach**
   - Notify student org leaders about claiming spaces
   - Provide onboarding documentation

## Troubleshooting

### No Spaces Showing
```bash
# Check if spaces exist and have correct publishStatus
node scripts/list-spaces-summary.mjs
```

### Events Not Loading
- Verify events have `startDate` field (not just `startAt`)
- Check `campusId` matches `ub-buffalo`

### Authentication Issues
- Ensure email domain is `buffalo.edu`
- Check Firebase Auth console for blocked users

## Support Commands

```bash
# List spaces summary
node scripts/list-spaces-summary.mjs

# Show specific space
node scripts/show-space.mjs <spaceId>

# Audit spaces
node scripts/audit-spaces.mjs

# Check for duplicate spaces
node scripts/find-duplicate-spaces.mjs
```

---

**Campus ID**: `ub-buffalo`
**Target Launch**: Winter 2025
**Documentation Last Updated**: December 2024
