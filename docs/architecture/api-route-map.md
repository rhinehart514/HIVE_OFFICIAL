# API Route Map

311 routes across 30+ domains. All routes use `firebase-admin` server SDK.

## Route Index

### Auth (17 routes, 3.5K lines)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/auth/send-code` | POST | Send OTP to .edu email |
| `/api/auth/verify-code` | POST | Verify OTP, create session |
| `/api/auth/complete-entry` | POST | Complete account creation |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/refresh` | POST | Refresh JWT |
| `/api/auth/logout` | POST | End session |
| `/api/auth/sessions` | GET | List active sessions |
| `/api/auth/sessions/[sessionId]` | DELETE | Revoke session |
| `/api/auth/csrf` | GET | CSRF token |
| `/api/auth/check-handle` | GET | Handle availability |
| `/api/auth/check-admin-grant` | GET | Admin grant check |
| `/api/auth/health` | GET | Auth health check |
| `/api/auth/alumni-waitlist` | POST | Non-.edu waitlist |
| `/api/auth/verify-access-code` | POST | Special access codes |
| ~~`/api/auth/request-signin-code`~~ | — | *Deprecated* |
| ~~`/api/auth/verify-signin-code`~~ | — | *Deprecated* |
| ~~`/api/auth/session`~~ | — | *Deprecated* |

### Spaces (92 routes, 27K lines)

#### Space CRUD & Discovery
| Route | Methods | Lines | Purpose |
|-------|---------|-------|---------|
| `/api/spaces` | GET, POST | 584 | List/create spaces |
| `/api/spaces/[spaceId]` | GET, PATCH, DELETE | 403 | Space CRUD |
| `/api/spaces/browse-v2` | GET | 390 | Browse with filters |
| `/api/spaces/recommended` | GET | 484 | Personalized recommendations |
| `/api/spaces/search` | GET | 271 | Search spaces |
| `/api/spaces/mine` | GET | 71 | User's spaces |
| `/api/spaces/live` | GET | 217 | Live/active spaces |
| `/api/spaces/attention` | GET | 183 | Attention-worthy spaces |
| `/api/spaces/identity` | GET | 332 | Space identity info |
| `/api/spaces/check-handle` | GET | 78 | Handle availability |
| `/api/spaces/check-create-permission` | GET | 113 | Permission to create |
| `/api/spaces/residential` | GET | 95 | Residential spaces |
| `/api/spaces/templates` | GET | 97 | Space templates |

#### Membership
| Route | Methods | Lines | Purpose |
|-------|---------|-------|---------|
| `/api/spaces/join-v2` | POST | 628 | Join a space |
| `/api/spaces/leave` | POST | 177 | Leave a space |
| `/api/spaces/claim` | POST | 349 | Claim unclaimed space |
| `/api/spaces/transfer` | POST | 530 | Transfer ownership |
| `/api/spaces/request-to-lead` | POST | 280 | Request leadership |
| `/api/spaces/waitlist` | POST | 226 | Join waitlist |
| `/api/spaces/[spaceId]/members` | GET, POST, PATCH, DELETE | 909 | Member CRUD |
| `/api/spaces/[spaceId]/members/batch` | POST | 564 | Batch operations |
| `/api/spaces/[spaceId]/members/[memberId]` | GET, PATCH, DELETE | 216 | Individual member |
| `/api/spaces/[spaceId]/join-requests` | GET, POST | 614 | Join request management |
| `/api/spaces/[spaceId]/invite` | GET, POST | — | Invite links |

#### Chat
| Route | Methods | Lines | Purpose |
|-------|---------|-------|---------|
| `/api/spaces/[spaceId]/chat` | GET, POST | 647 | Messages CRUD |
| `/api/spaces/[spaceId]/chat/stream` | GET | — | SSE real-time |
| `/api/spaces/[spaceId]/chat/search` | GET | — | Search messages |
| `/api/spaces/[spaceId]/chat/typing` | POST | — | Typing indicator |
| `/api/spaces/[spaceId]/chat/read` | POST | — | Read receipts |
| `/api/spaces/[spaceId]/chat/intent` | POST | — | Intent detection |
| `/api/spaces/[spaceId]/chat/pinned` | GET | — | Pinned messages |
| `/api/spaces/[spaceId]/chat/[messageId]` | PATCH, DELETE | — | Edit/delete message |
| `/api/spaces/[spaceId]/chat/[messageId]/react` | POST | — | Reactions |
| `/api/spaces/[spaceId]/chat/[messageId]/replies` | GET, POST | — | Threads |
| `/api/spaces/[spaceId]/chat/[messageId]/pin` | POST | — | Pin/unpin |

#### Structure
| Route | Methods | Lines | Purpose |
|-------|---------|-------|---------|
| `/api/spaces/[spaceId]/boards` | GET, POST | 280 | Chat channels |
| `/api/spaces/[spaceId]/boards/reorder` | PATCH | — | Reorder channels |
| `/api/spaces/[spaceId]/boards/[boardId]` | PATCH, DELETE | — | Channel CRUD |
| `/api/spaces/[spaceId]/tabs` | GET, POST, PATCH | 243 | Tab management |
| `/api/spaces/[spaceId]/tabs/[tabId]` | PATCH, DELETE | 236 | Tab CRUD |
| `/api/spaces/[spaceId]/sidebar` | GET | — | Sidebar data |

#### Content
| Route | Methods | Lines | Purpose |
|-------|---------|-------|---------|
| `/api/spaces/[spaceId]/posts` | GET, POST | 294 | Post CRUD |
| `/api/spaces/[spaceId]/posts/[postId]` | PATCH, DELETE | — | Post edit/delete |
| `/api/spaces/[spaceId]/posts/[postId]/comments` | GET, POST | — | Comments |
| `/api/spaces/[spaceId]/posts/[postId]/reactions` | POST | — | Post reactions |
| `/api/spaces/[spaceId]/promote-post` | POST | — | Promote post |
| `/api/spaces/[spaceId]/feed` | GET | 466 | Space feed |
| `/api/spaces/[spaceId]/resources` | GET, POST | 276 | Resource CRUD |
| `/api/spaces/[spaceId]/resources/[resourceId]` | PATCH, DELETE | — | Resource edit |
| `/api/spaces/[spaceId]/components` | GET, POST | 261 | Inline components |
| `/api/spaces/[spaceId]/components/[componentId]` | PATCH | — | Component update |
| `/api/spaces/[spaceId]/components/[componentId]/participate` | POST | — | Participate in component |

#### Events
| Route | Methods | Lines | Purpose |
|-------|---------|-------|---------|
| `/api/spaces/[spaceId]/events` | GET, POST | 543 | Space events |
| `/api/spaces/[spaceId]/events/[eventId]` | GET, PATCH, DELETE | 379 | Event CRUD |
| `/api/spaces/[spaceId]/events/[eventId]/rsvp` | POST | 294 | RSVP |

#### Tools in Spaces
| Route | Methods | Lines | Purpose |
|-------|---------|-------|---------|
| `/api/spaces/[spaceId]/tools` | GET, POST | 715 | Deployed tools |
| `/api/spaces/[spaceId]/tools/feature` | POST | — | Feature a tool |
| `/api/spaces/[spaceId]/tool-connections` | GET, POST | — | Tool connections |
| `/api/spaces/[spaceId]/tool-connections/[connectionId]` | DELETE | — | Remove connection |
| `/api/spaces/[spaceId]/builder-permission` | GET | — | Builder permissions |
| `/api/spaces/[spaceId]/builder-status` | GET | — | Builder status |

#### Admin & Meta
| Route | Methods | Lines | Purpose |
|-------|---------|-------|---------|
| `/api/spaces/[spaceId]/analytics` | GET | 523 | Space analytics |
| `/api/spaces/[spaceId]/automations` | GET, POST | 321 | Automations |
| `/api/spaces/[spaceId]/automations/trigger` | POST | 532 | Trigger automation |
| `/api/spaces/[spaceId]/automations/[id]/toggle` | PATCH | 72 | Enable/disable |
| `/api/spaces/[spaceId]/activity` | GET | — | Activity log |
| `/api/spaces/[spaceId]/upload-avatar` | POST | — | Upload avatar |
| `/api/spaces/[spaceId]/upload-banner` | POST | — | Upload banner |
| `/api/spaces/[spaceId]/go-live` | POST | — | Publish space |
| `/api/spaces/[spaceId]/transfer-ownership` | POST | — | Transfer (alternate) |
| `/api/spaces/[spaceId]/availability` | GET | — | Availability check |
| `/api/spaces/[spaceId]/preview` | GET | — | Public preview |

### Tools / HiveLab (50 routes, 20K lines)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/tools/create-from-intent` | POST | Intent → tool (3-tier resolution) |
| `/api/tools/create-custom-block` | POST | Custom block generation (Groq) |
| `/api/tools/discover` | GET | Cross-space discovery with filters |
| `/api/tools/deploy` | POST | Deploy tool to space |
| `/api/tools/[toolId]` | GET, PATCH, DELETE | Tool CRUD |
| `/api/tools/[toolId]/clone` | POST | Fork/remix (provenance tracking) |
| `/api/tools/[toolId]/state/stream` | GET | SSE state sync |
| `/api/tools/[toolId]/with-state` | GET | Tool + current state |
| ~~`/api/tools/execute`~~ | — | *Deprecated* |

### Profile (26 routes, 7.4K lines)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/profile` | GET, PATCH | Profile CRUD |
| `/api/profile/v2` | — | *Deprecated* |
| `/api/profile/upload-photo` | POST | Avatar upload |
| `/api/profile/identity` | GET, PATCH | Identity settings |
| `/api/profile/privacy` | GET, PATCH | Privacy settings |
| `/api/profile/completion` | GET | Profile completion % |
| `/api/profile/dashboard` | GET | Profile dashboard data |
| `/api/profile/delete` | DELETE | Delete account |
| `/api/profile/tools` | GET | User's tools |
| `/api/profile/spaces` | GET | User's spaces |
| `/api/profile/spaces/recommendations` | GET | Space recommendations |
| `/api/profile/spaces/actions` | POST | Space actions |
| `/api/profile/my-spaces` | GET | Joined spaces |
| `/api/profile/notify` | POST | Notification preferences |
| `/api/profile/calendar/events` | GET | Calendar events |
| `/api/profile/calendar/conflicts` | GET | Schedule conflicts |
| `/api/profile/[userId]/activity` | GET | User activity |
| `/api/profile/[userId]/follow` | POST, DELETE | Follow/unfollow |
| `/api/profile/[userId]/connection-strength` | GET | Connection strength |
| `/api/profile/handle/[handle]` | — | *Deprecated* |

### Events (2 routes, 990 lines)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/events` | GET | Campus-wide events |
| `/api/events/personalized` | GET | Personalized event feed |

### Campus (7 routes, 1.1K lines)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/campus/detect` | GET | Detect campus from email |
| `/api/campus/buildings` | GET | Building list |
| `/api/campus/buildings/study-spots` | GET | Study spot finder |
| `/api/campus/dining` | GET | Dining options |
| `/api/campus/dining/[id]` | GET | Dining detail |
| `/api/campus/dining/recommend` | GET | Dining recommendations |
| `/api/campus/catalogs` | GET | Course catalogs |

### Admin (61 routes, 12.5K lines)

22 sub-domains: activity-logs, ai-quality, alerts, analytics, announcements, builder-requests, claims, command, content-moderation, feature-flags, leaders, logs, moderation, realtime, school-admins, schools, seed-school, spaces, system, toolbar, tools, users

### Other

| Area | Routes | Lines | Purpose |
|------|--------|-------|---------|
| Notifications | 2 | 515 | CRUD + SSE stream |
| Search | 2 | 1,081 | Full-text search (v1 + v2 stub) |
| Cron | 5 | 2,230 | Scheduled jobs |
| Setups | 8 | 1,994 | Tool setup presets |
| Calendar | 7 | 1,251 | Calendar integration |
| Privacy | 3 | 1,027 | Privacy controls |
| Users | 3 | 752 | User management |
| Content | 3 | 526 | Content moderation checks |
| Templates | 3 | 474 | Tool templates |
| Elements | 3 | 466 | Element registry |
| Placements | 2 | 682 | Tool placements |
| Analytics | 2 | 649 | Platform analytics |
| Onboarding | 2 | 137 | Onboarding flow |
| Feature flags | 1 | 453 | Feature flag management |
| Activity | 1 | 351 | Activity feed |
| Health | 1 | 298 | System health |
| Errors | 1 | 220 | Error reporting |
| Verify | 1 | 203 | Verification |
| Comments | 1 | 103 | Top-level comments |
| Automations | 1 | 58 | Top-level automations |
| Feedback | 1 | 56 | User feedback |
| Schools | 1 | 55 | School data |
| QR | 1 | 38 | QR code generation |

## Middleware Coverage

| Middleware | Usage Count | Purpose |
|-----------|-------------|---------|
| `withAuthAndErrors` | ~250 | Auth + error handling |
| `withAuthValidationAndErrors` | ~245 | Auth + Zod validation + error handling |
| `checkSpacePermission` | 140 | Space role-based access |
| `withCache` | — | Response caching headers |
| `enforceRateLimit` | — | Rate limiting (auth, AI) |
| `validateOrigin` | — | Origin checking |
| `SecurityScanner` | — | Input sanitization |
