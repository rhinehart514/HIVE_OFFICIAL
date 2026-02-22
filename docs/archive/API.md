# API Reference

Complete reference for all API routes in the HIVE platform.

**Base URL:** `/api`
**Auth pattern:** Most routes use `withAuthAndErrors` middleware (JWT cookie-based). Public routes noted explicitly.
**Campus isolation:** All authenticated queries filter by `campusId` from session. Never accepted from client.

---

## Table of Contents

- [Auth](#auth)
- [Waitlist](#waitlist)
- [Profile](#profile)
- [Spaces](#spaces)
- [Space Detail (spaceId)](#space-detail)
- [Space Chat](#space-chat)
- [Space Posts](#space-posts)
- [Space Events](#space-events)
- [Space Members](#space-members)
- [Space Boards](#space-boards)
- [Space Resources](#space-resources)
- [Space Tabs](#space-tabs)
- [Space Automations](#space-automations)
- [Space Tools](#space-tools)
- [Space Webhooks & Widgets](#space-webhooks--widgets)
- [Space Components](#space-components)
- [Space Invites](#space-invites)
- [Events](#events)
- [Feed](#feed)
- [Posts](#posts)
- [Social](#social)
- [Comments](#comments)
- [Tools](#tools)
- [Tool Automations](#tool-automations)
- [Tool Versions & Connections](#tool-versions--connections)
- [Elements (HiveLab)](#elements)
- [Placements](#placements)
- [Templates](#templates)
- [Setups (Orchestration)](#setups)
- [Rituals](#rituals)
- [Calendar](#calendar)
- [Campus](#campus)
- [DMs (Direct Messages)](#dms)
- [Privacy](#privacy)
- [Content Moderation](#content-moderation)
- [Notifications](#notifications)
- [Search](#search)
- [Connections & Friends](#connections--friends)
- [Users](#users)
- [Analytics](#analytics)
- [Activity](#activity)
- [Admin](#admin)
- [System](#system)
- [Cron](#cron)

---

## Auth

### `POST /api/auth/send-code`
Send a 6-digit verification code to a campus email.

- **Auth:** Public
- **Rate limit:** Strict (auth)
- **Body:**
  ```ts
  { email: string, schoolId?: string }
  ```
- **Response:** `{ success: true, message: string }`
- **Notes:** Primary sign-in flow. Validates email domain against school config. Codes hashed with SHA256, TTL 10 minutes. Supports access gate mode.

### `POST /api/auth/verify-code`
Verify 6-digit code and create session.

- **Auth:** Public
- **Rate limit:** Strict (auth)
- **Body:**
  ```ts
  { email: string, code: string, schoolId: string }
  ```
- **Response:** `{ success: true, user: UserData }` + sets `hive_session` and `hive_refresh` cookies
- **Notes:** Max 5 attempts per code, 1-minute lockout after max. Creates JWT token pair on success.

### `POST /api/auth/verify-access-code`
Verify 6-digit entry code (admin-distributed access codes).

- **Auth:** Public
- **Rate limit:** 3 attempts per 5 minutes per IP
- **Body:**
  ```ts
  { code: string, schoolId?: string, campusId?: string }
  ```
- **Response:** `{ success: true }` + sets session cookie
- **Notes:** Multi-layer brute force protection: rate limiting, IP lockouts (15min escalating), hashed storage.

### `POST /api/auth/complete-entry`
Complete onboarding after email verification (The Threshold).

- **Auth:** Required
- **Body:**
  ```ts
  {
    firstName: string,
    lastName: string,
    handle?: string,      // Auto-generated from name if not provided
    role: 'student' | 'faculty' | 'alumni'
  }
  ```
- **Response:** `{ success: true, user: UserData }`
- **Notes:** Creates user profile, reserves handle, checks Gravatar, issues new token pair with complete profile data.

### `GET /api/auth/me`
Get current authenticated user from session cookie.

- **Auth:** Cookie-based (reads `hive_session`)
- **Response:**
  ```ts
  { authenticated: boolean, user: UserData | null, token?: { expiresAt, expiresIn } }
  ```
- **Notes:** Single source of truth for auth state. Returns 200 even when unauthenticated (client needs to know state).

### `POST /api/auth/refresh`
Refresh expired access token using refresh token.

- **Auth:** Cookie-based (reads `hive_refresh`)
- **Response:** `{ success: true }` + new token pair cookies
- **Notes:** One-time use refresh tokens. Validates user still exists and is active.

### `POST /api/auth/logout`
Revoke session and clear auth cookies.

- **Auth:** Optional (works even with expired tokens)
- **Response:** `{ success: true, data: { message: string } }`
- **Notes:** Revokes JWT session, clears cookies, best-effort Firebase refresh token revocation.

### `GET /api/auth/csrf`
Get CSRF token for admin sessions.

- **Auth:** Required
- **Response:** `{ success: true }` with `X-CSRF-Token` header (admin sessions only)

### `GET /api/auth/sessions`
List all active sessions for current user.

- **Auth:** Required
- **Response:** `{ sessions: SessionInfo[], currentSessionId: string }`

### `DELETE /api/auth/sessions`
Revoke all sessions (logout everywhere).

- **Auth:** Required
- **Response:** `{ message: string, revokedCount: number }`

### `DELETE /api/auth/sessions/[sessionId]`
Revoke a specific session.

- **Auth:** Required
- **Response:** `{ message: string }`
- **Notes:** Cannot revoke current session (use logout instead).

### `GET|POST /api/auth/check-handle`
Check if a handle is available.

- **Auth:** Public
- **Rate limit:** Strict (10/min to prevent enumeration)
- **Body (POST):** `{ handle: string }`
- **Query (GET):** `?handle=string`
- **Response:** `{ available: boolean, reason?: string, handle?: string }`

### `POST /api/auth/check-admin-grant`
Check and grant pending admin permissions (bootstrap only).

- **Auth:** Required
- **Response:** `{ granted: boolean, reason?: string, role?: string, permissions?: string[] }`
- **Notes:** Self-grant only allowed when no admins exist (bootstrap mode). Disabled in production unless `ALLOW_ADMIN_AUTO_GRANT=true`.

### `POST /api/auth/alumni-waitlist`
Capture alumni who want to rejoin old spaces.

- **Auth:** Required
- **Body:** `{ spaces: string }`
- **Response:** `{ success: true }`

### `GET /api/auth/health`
Auth service health check.

- **Auth:** Public
- **Response:** Service status for authentication, Firebase, email. Detailed config in development only.

### `GET /api/auth/session` *(deprecated)*
Validate Bearer token session. Use `/api/auth/me` instead.

### `POST /api/auth/request-signin-code` *(deprecated)*
Returns 410 Gone. Use `/api/auth/send-code`.

### `POST /api/auth/verify-signin-code` *(deprecated)*
Returns 410 Gone. Use `/api/auth/verify-code`.

---

## Waitlist

### `POST /api/waitlist/join`
Join the school waitlist.

- **Auth:** Public
- **Body:**
  ```ts
  { email: string, schoolId?: string, referralSource?: string }
  ```
- **Response:** `{ success: true, position?: number }`

### `GET /api/waitlist/check`
Check if email is already on waitlist.

- **Auth:** Public
- **Query:** `?email=string&schoolId=string`
- **Response:** `{ onWaitlist: boolean, joinedAt?: string }`

### `POST /api/waitlist/launch`
Admin: Launch a school from waitlist to active.

- **Auth:** Admin required
- **Body:** `{ schoolId: string }`
- **Response:** `{ success: true }`

### `POST /api/waitlist/school-notify`
Notify waitlist users that their school is now active.

- **Auth:** Admin required
- **Body:** `{ schoolId: string }`
- **Response:** `{ success: true, notified: number }`

---

## Profile

### `GET /api/profile`
Get current user's profile.

- **Auth:** Required
- **Response:** Full profile with handle change status, completion info

### `PATCH /api/profile`
Update current user's profile.

- **Auth:** Required
- **Body:**
  ```ts
  {
    handle?: string,
    firstName?: string,
    lastName?: string,
    fullName?: string,
    bio?: string,         // max 500
    major?: string,       // validated via Major value object
    graduationYear?: number,
    interests?: string[], // max 10
    avatarUrl?: string,
    socialLinks?: { twitter?, instagram?, linkedin?, github?, website? },
    visibility?: 'public' | 'campus' | 'connections'
  }
  ```

### `GET /api/profile/[userId]`
Get another user's public profile.

- **Auth:** Optional (privacy-filtered based on viewer)
- **Response:** Profile data filtered by privacy settings and Ghost Mode

### `GET /api/profile/[userId]/activity`
Get user's recent activity.

- **Auth:** Required
- **Response:** Activity items (posts, events, space joins)

### `GET /api/profile/[userId]/connections`
Get user's connections/friends.

- **Auth:** Required
- **Response:** `{ connections: ConnectionData[] }`

### `GET /api/profile/[userId]/connection-strength`
Get connection strength score between current user and target.

- **Auth:** Required
- **Response:** `{ strength: number, factors: StrengthFactors }`

### `GET /api/profile/[userId]/events`
Get user's events.

- **Auth:** Required
- **Response:** `{ events: EventData[] }`

### `POST /api/profile/[userId]/follow`
Follow/unfollow a user.

- **Auth:** Required
- **Response:** `{ following: boolean }`

### `GET /api/profile/completion`
Get profile completion percentage and missing fields.

- **Auth:** Required
- **Response:** `{ percentage: number, missing: string[], suggestions: string[] }`

### `GET /api/profile/dashboard`
Get dashboard data for current user.

- **Auth:** Required
- **Response:** Dashboard stats, upcoming events, recent activity

### `POST /api/profile/delete`
Delete user account.

- **Auth:** Required
- **Response:** `{ success: true }`
- **Notes:** Irreversible. Removes user data, memberships, content.

### `POST /api/profile/fcm-token`
Register FCM push notification token.

- **Auth:** Required
- **Body:** `{ token: string }`

### `GET /api/profile/handle/[handle]`
Look up user by handle.

- **Auth:** Required
- **Response:** User profile data

### `GET|PATCH /api/profile/identity`
Get or update identity fields (name, handle, role).

- **Auth:** Required

### `GET /api/profile/my-spaces`
Get spaces the current user is a member of.

- **Auth:** Required
- **Response:** `{ spaces: SpaceData[] }`

### `GET|PATCH /api/profile/notifications/preferences`
Get or update notification preferences.

- **Auth:** Required

### `POST /api/profile/notify`
Send a notification to the current user (internal use).

- **Auth:** Required

### `GET|PATCH /api/profile/privacy`
Get or update privacy settings.

- **Auth:** Required

### `GET /api/profile/spaces`
Get user's space memberships with details.

- **Auth:** Required

### `POST /api/profile/spaces/actions`
Perform space-related actions (join, leave, etc.) from profile context.

- **Auth:** Required

### `GET /api/profile/spaces/recommendations`
Get personalized space recommendations for user.

- **Auth:** Required

### `GET /api/profile/stats`
Get user stats (post count, spaces count, etc.).

- **Auth:** Required

### `GET /api/profile/tools`
Get tools created by current user.

- **Auth:** Required

### `POST /api/profile/upload-photo`
Upload profile photo.

- **Auth:** Required
- **Body:** FormData with photo file
- **Response:** `{ url: string }`

### `GET /api/profile/v2`
V2 profile endpoint with enhanced data.

- **Auth:** Required

### `GET /api/profile/calendar/events`
Get user's calendar events from spaces.

- **Auth:** Required

### `GET /api/profile/calendar/conflicts`
Detect calendar conflicts.

- **Auth:** Required

### `GET /api/profile-v2/[userId]`
V2 public profile endpoint.

- **Auth:** Optional

---

## Spaces

### `GET /api/spaces`
List spaces for current campus. Supports browse/discover mode.

- **Auth:** Required
- **Query:** `?limit=20&offset=0&category=string&search=string`
- **Response:** `{ spaces: SpaceBrowseDTO[] }`

### `POST /api/spaces`
Create a new space.

- **Auth:** Required
- **Body:**
  ```ts
  {
    name: string,           // max 100, XSS-scanned
    description: string,    // max 500, XSS-scanned
    category: 'student_organizations' | 'university_organizations' | 'greek_life' | 'campus_living' | 'hive_exclusive',
    visibility?: 'public' | 'private',
    templateId?: string,
    settings?: { allowMemberPosts?, requireApproval?, allowGuestView?, maxMembers? }
  }
  ```

### `GET /api/spaces/browse`
Browse all campus spaces with filtering.

- **Auth:** Required
- **Query:** `?category=string&sort=string&limit=20`

### `GET /api/spaces/browse-v2`
V2 browse with enhanced ranking and metadata.

- **Auth:** Required

### `GET /api/spaces/search`
Search spaces by name/description.

- **Auth:** Required
- **Query:** `?q=string&limit=20`

### `GET /api/spaces/mine`
Get spaces where current user is a member.

- **Auth:** Required

### `GET /api/spaces/my`
Alias for `/api/spaces/mine`.

- **Auth:** Required

### `GET /api/spaces/recommended`
Get personalized space recommendations.

- **Auth:** Required

### `GET /api/spaces/live`
Get currently active/live spaces.

- **Auth:** Required

### `POST /api/spaces/claim`
Claim an unclaimed (imported) space as leader.

- **Auth:** Required
- **Body:** `{ spaceId: string }`

### `POST /api/spaces/seed`
Seed spaces from external data (CampusLabs, etc.).

- **Auth:** Admin required

### `POST /api/spaces/leave`
Leave a space.

- **Auth:** Required
- **Body:** `{ spaceId: string }`

### `POST /api/spaces/request`
Request to create a new space (when creation requires approval).

- **Auth:** Required

### `POST /api/spaces/transfer`
Transfer space ownership.

- **Auth:** Required (owner only)
- **Body:** `{ spaceId: string, newOwnerId: string }`

### `GET /api/spaces/templates`
Get available space templates.

- **Auth:** Required

### `POST /api/spaces/waitlist`
Join a space waitlist (for private/restricted spaces).

- **Auth:** Required

### `GET /api/spaces/identity`
Get space identity/branding info.

- **Auth:** Required

### `GET /api/spaces/attention`
Get spaces that need user attention (unread, pending, etc.).

- **Auth:** Required

### `GET /api/spaces/residential`
Get residential/housing spaces.

- **Auth:** Required

### `POST /api/spaces/check-handle`
Check space handle availability.

- **Auth:** Required
- **Body:** `{ handle: string }`

### `GET /api/spaces/check-create-permission`
Check if current user can create spaces.

- **Auth:** Required

### `POST /api/spaces/join-v2`
V2 space join with enhanced validation.

- **Auth:** Required
- **Body:** `{ spaceId: string }`

### `POST /api/spaces/request-to-lead`
Request to become a space leader.

- **Auth:** Required

### `GET /api/spaces/resolve-slug/[slug]`
Resolve a space slug to space data.

- **Auth:** Required

### `GET /api/spaces/activity/recent`
Get recent activity across all user's spaces.

- **Auth:** Required

---

## Space Detail

### `GET /api/spaces/[spaceId]`
Get full space details.

- **Auth:** Required
- **Response:** `SpaceDetailDTO` with tools, members count, user membership status

### `PATCH /api/spaces/[spaceId]`
Update space settings.

- **Auth:** Required (leader/admin)
- **Body:**
  ```ts
  {
    name?: string,
    description?: string,
    category?: string,
    visibility?: 'public' | 'private',
    settings?: { allowMemberPosts?, requireApproval?, allowGuestView?, allowRSS?, maxMembers? },
    socialLinks?: { website?, instagram?, twitter?, facebook?, linkedin?, youtube? },
    email?: string,
    contactName?: string
  }
  ```

### `DELETE /api/spaces/[spaceId]`
Delete a space (soft delete).

- **Auth:** Required (owner/admin)

### `GET /api/spaces/[spaceId]/feed`
Get space activity feed.

- **Auth:** Required (member or public space)

### `GET /api/spaces/[spaceId]/activity`
Get space activity log.

- **Auth:** Required (member)

### `GET /api/spaces/[spaceId]/analytics`
Get space analytics (views, engagement, growth).

- **Auth:** Required (leader/admin)

### `GET /api/spaces/[spaceId]/sidebar`
Get sidebar configuration for space.

- **Auth:** Required

### `POST /api/spaces/[spaceId]/invite`
Generate invite link for space.

- **Auth:** Required (leader/admin)

### `POST /api/spaces/[spaceId]/go-live`
Publish a space (transition from draft to live).

- **Auth:** Required (leader)

### `POST /api/spaces/[spaceId]/upload-avatar`
Upload space avatar image.

- **Auth:** Required (leader/admin)
- **Body:** FormData

### `POST /api/spaces/[spaceId]/upload-banner`
Upload space banner image.

- **Auth:** Required (leader/admin)
- **Body:** FormData

### `POST /api/spaces/[spaceId]/upload`
General file upload for space.

- **Auth:** Required (member)
- **Body:** FormData

### `POST /api/spaces/[spaceId]/seed-rss`
Import content from RSS feed into space.

- **Auth:** Required (leader)

### `POST /api/spaces/[spaceId]/promote-post`
Promote a post within space (pin, highlight).

- **Auth:** Required (leader)

### `GET /api/spaces/[spaceId]/moderation`
Get moderation queue for space.

- **Auth:** Required (leader/admin)

### `POST /api/spaces/[spaceId]/join-request`
Submit a join request for private space.

- **Auth:** Required

### `GET /api/spaces/[spaceId]/join-requests`
List pending join requests.

- **Auth:** Required (leader)

### `GET /api/spaces/[spaceId]/preview`
Get public preview of space (for non-members).

- **Auth:** Optional

### `GET /api/spaces/[spaceId]/data`
Get raw space data.

- **Auth:** Required (leader)

### `GET /api/spaces/[spaceId]/structure`
Get space structure (tabs, boards, components).

- **Auth:** Required

### `GET /api/spaces/[spaceId]/availability`
Check space availability status.

- **Auth:** Required

### `POST /api/spaces/[spaceId]/apply-template`
Apply a template to space.

- **Auth:** Required (leader)

### `POST /api/spaces/[spaceId]/transfer-ownership`
Transfer space ownership to another member.

- **Auth:** Required (owner)

### `GET /api/spaces/[spaceId]/builder-permission`
Check if user has builder permissions.

- **Auth:** Required

### `GET /api/spaces/[spaceId]/builder-status`
Get builder mode status.

- **Auth:** Required

---

## Space Chat

### `GET /api/spaces/[spaceId]/chat`
Get chat messages for a space board.

- **Auth:** Required (member)
- **Query:** `?boardId=string&limit=50&before=cursor`

### `POST /api/spaces/[spaceId]/chat`
Send a chat message.

- **Auth:** Required (member)
- **Body:** `{ content: string, boardId: string, replyTo?: string }`

### `GET /api/spaces/[spaceId]/chat/stream`
SSE stream for real-time chat messages.

- **Auth:** Required (member)

### `POST /api/spaces/[spaceId]/chat/read`
Mark messages as read.

- **Auth:** Required (member)
- **Body:** `{ boardId: string, lastReadMessageId: string }`

### `POST /api/spaces/[spaceId]/chat/typing`
Send typing indicator.

- **Auth:** Required (member)
- **Body:** `{ boardId: string, isTyping: boolean }`

### `POST /api/spaces/[spaceId]/chat/intent`
Signal chat intent (user about to type).

- **Auth:** Required (member)

### `GET /api/spaces/[spaceId]/chat/search`
Search chat messages.

- **Auth:** Required (member)
- **Query:** `?q=string&boardId=string`

### `GET /api/spaces/[spaceId]/chat/pinned`
Get pinned messages.

- **Auth:** Required (member)

### `GET /api/spaces/[spaceId]/chat/[messageId]`
Get single message details.

- **Auth:** Required (member)

### `PATCH /api/spaces/[spaceId]/chat/[messageId]`
Edit a message (author only).

- **Auth:** Required (author)
- **Body:** `{ content: string, boardId: string }`

### `DELETE /api/spaces/[spaceId]/chat/[messageId]`
Delete a message (author or leader).

- **Auth:** Required (author/leader)

### `POST /api/spaces/[spaceId]/chat/[messageId]/pin`
Pin/unpin a message.

- **Auth:** Required (leader)

### `POST /api/spaces/[spaceId]/chat/[messageId]/react`
Add/remove reaction on a message.

- **Auth:** Required (member)
- **Body:** `{ emoji: string }`

### `GET /api/spaces/[spaceId]/chat/[messageId]/replies`
Get thread replies for a message.

- **Auth:** Required (member)

---

## Space Posts

### `GET /api/spaces/[spaceId]/posts`
List posts in a space.

- **Auth:** Required (member or public space)
- **Query:** `?limit=20&offset=0&type=string`

### `POST /api/spaces/[spaceId]/posts`
Create a post in a space.

- **Auth:** Required (member, if `allowMemberPosts`)
- **Body:** `{ content: string, type?: string, attachments?: any[] }`

### `GET /api/spaces/[spaceId]/posts/[postId]`
Get single post.

- **Auth:** Required (member)

### `PATCH /api/spaces/[spaceId]/posts/[postId]`
Update a post (author or leader).

- **Auth:** Required (author/leader)

### `DELETE /api/spaces/[spaceId]/posts/[postId]`
Delete a post.

- **Auth:** Required (author/leader)

### `GET|POST /api/spaces/[spaceId]/posts/[postId]/comments`
Get or add comments on a space post.

- **Auth:** Required (member)

### `POST /api/spaces/[spaceId]/posts/[postId]/reactions`
React to a space post.

- **Auth:** Required (member)
- **Body:** `{ emoji: string }`

---

## Space Events

### `GET /api/spaces/[spaceId]/events`
List events for a space.

- **Auth:** Required (member or public space)

### `POST /api/spaces/[spaceId]/events`
Create an event in a space.

- **Auth:** Required (leader)

### `GET /api/spaces/[spaceId]/events/[eventId]`
Get event details.

- **Auth:** Required

### `PATCH /api/spaces/[spaceId]/events/[eventId]`
Update event.

- **Auth:** Required (leader)

### `DELETE /api/spaces/[spaceId]/events/[eventId]`
Delete event.

- **Auth:** Required (leader)

### `POST /api/spaces/[spaceId]/events/[eventId]/rsvp`
RSVP to a space event.

- **Auth:** Required (member)
- **Body:** `{ status: 'going' | 'interested' | 'not_going' }`

---

## Space Members

### `GET /api/spaces/[spaceId]/members`
List space members.

- **Auth:** Required (member)
- **Query:** `?limit=50&offset=0&role=string`

### `POST /api/spaces/[spaceId]/members`
Add a member to space.

- **Auth:** Required (leader/admin)

### `GET /api/spaces/[spaceId]/members/[memberId]`
Get member details.

- **Auth:** Required (leader)

### `PATCH /api/spaces/[spaceId]/members/[memberId]`
Update member role.

- **Auth:** Required (leader)
- **Body:** `{ role: 'member' | 'moderator' | 'admin' }`

### `DELETE /api/spaces/[spaceId]/members/[memberId]`
Remove a member from space.

- **Auth:** Required (leader)

### `POST /api/spaces/[spaceId]/members/batch`
Batch member operations.

- **Auth:** Required (leader)

### `GET /api/spaces/[spaceId]/membership`
Get membership info for current user.

- **Auth:** Required

### `POST /api/spaces/[spaceId]/membership`
Join a space.

- **Auth:** Required

### `DELETE /api/spaces/[spaceId]/membership`
Leave a space.

- **Auth:** Required

### `GET /api/spaces/[spaceId]/membership/me`
Get current user's membership status.

- **Auth:** Required

---

## Space Boards

### `GET /api/spaces/[spaceId]/boards`
List boards in a space (chat channels).

- **Auth:** Required (member)

### `POST /api/spaces/[spaceId]/boards`
Create a new board.

- **Auth:** Required (leader)

### `GET /api/spaces/[spaceId]/boards/[boardId]`
Get board details.

- **Auth:** Required (member)

### `PATCH /api/spaces/[spaceId]/boards/[boardId]`
Update board.

- **Auth:** Required (leader)

### `DELETE /api/spaces/[spaceId]/boards/[boardId]`
Delete board.

- **Auth:** Required (leader)

### `PUT /api/spaces/[spaceId]/boards/reorder`
Reorder boards.

- **Auth:** Required (leader)
- **Body:** `{ boardIds: string[] }`

---

## Space Resources

### `GET /api/spaces/[spaceId]/resources`
List space resources (files, links, docs).

- **Auth:** Required (member)

### `POST /api/spaces/[spaceId]/resources`
Add a resource.

- **Auth:** Required (member, if allowed)

### `GET /api/spaces/[spaceId]/resources/[resourceId]`
Get resource details.

- **Auth:** Required (member)

### `PATCH /api/spaces/[spaceId]/resources/[resourceId]`
Update resource.

- **Auth:** Required (author/leader)

### `DELETE /api/spaces/[spaceId]/resources/[resourceId]`
Delete resource.

- **Auth:** Required (author/leader)

---

## Space Tabs

### `GET /api/spaces/[spaceId]/tabs`
List space tabs.

- **Auth:** Required (member)

### `POST /api/spaces/[spaceId]/tabs`
Create a new tab.

- **Auth:** Required (leader)

### `GET /api/spaces/[spaceId]/tabs/[tabId]`
Get tab details.

- **Auth:** Required (member)

### `PATCH /api/spaces/[spaceId]/tabs/[tabId]`
Update tab.

- **Auth:** Required (leader)

### `DELETE /api/spaces/[spaceId]/tabs/[tabId]`
Delete tab.

- **Auth:** Required (leader)

---

## Space Automations

### `GET /api/spaces/[spaceId]/automations`
List automations for a space.

- **Auth:** Required (leader)

### `POST /api/spaces/[spaceId]/automations`
Create an automation.

- **Auth:** Required (leader)

### `GET /api/spaces/[spaceId]/automations/[automationId]`
Get automation details.

- **Auth:** Required (leader)

### `PATCH /api/spaces/[spaceId]/automations/[automationId]`
Update automation.

- **Auth:** Required (leader)

### `DELETE /api/spaces/[spaceId]/automations/[automationId]`
Delete automation.

- **Auth:** Required (leader)

### `POST /api/spaces/[spaceId]/automations/[automationId]/toggle`
Enable/disable automation.

- **Auth:** Required (leader)

### `POST /api/spaces/[spaceId]/automations/from-template`
Create automation from template.

- **Auth:** Required (leader)

### `POST /api/spaces/[spaceId]/automations/trigger`
Manually trigger an automation.

- **Auth:** Required (leader)

---

## Space Tools

### `GET /api/spaces/[spaceId]/tools`
List deployed tools in a space.

- **Auth:** Required (member)
- **Query:**
  ```ts
  {
    limit?: number,       // 1-50, default 20
    offset?: number,
    category?: 'productivity' | 'academic' | 'social' | 'utility' | 'entertainment' | 'other',
    status?: 'active' | 'inactive' | 'all',
    placement?: 'sidebar' | 'inline' | 'modal' | 'tab' | 'all',
    sortBy?: 'order' | 'deployments' | 'rating' | 'recent' | 'alphabetical'
  }
  ```

### `POST /api/spaces/[spaceId]/tools`
Deploy a tool to a space.

- **Auth:** Required (leader)

### `POST /api/spaces/[spaceId]/tools/feature`
Feature/unfeature a tool in the space.

- **Auth:** Required (leader)

### `GET /api/spaces/[spaceId]/tool-connections`
List tool connections for space.

- **Auth:** Required (leader)

### `POST /api/spaces/[spaceId]/tool-connections`
Create a tool connection.

- **Auth:** Required (leader)

### `DELETE /api/spaces/[spaceId]/tool-connections/[connectionId]`
Remove a tool connection.

- **Auth:** Required (leader)

### `GET /api/spaces/[spaceId]/apps/[deploymentId]`
Get deployed app instance.

- **Auth:** Required (member)

---

## Space Webhooks & Widgets

### `GET /api/spaces/[spaceId]/webhooks`
List webhooks for a space.

- **Auth:** Required (leader)

### `POST /api/spaces/[spaceId]/webhooks`
Create a webhook.

- **Auth:** Required (leader)

### `GET /api/spaces/[spaceId]/webhooks/[webhookId]`
Get webhook details.

- **Auth:** Required (leader)

### `PATCH /api/spaces/[spaceId]/webhooks/[webhookId]`
Update webhook.

- **Auth:** Required (leader)

### `DELETE /api/spaces/[spaceId]/webhooks/[webhookId]`
Delete webhook.

- **Auth:** Required (leader)

### `GET /api/spaces/[spaceId]/widgets`
List widgets in a space.

- **Auth:** Required (member)

### `POST /api/spaces/[spaceId]/widgets`
Add a widget.

- **Auth:** Required (leader)

### `GET /api/spaces/[spaceId]/widgets/[widgetId]`
Get widget details.

- **Auth:** Required (member)

### `PATCH /api/spaces/[spaceId]/widgets/[widgetId]`
Update widget.

- **Auth:** Required (leader)

### `DELETE /api/spaces/[spaceId]/widgets/[widgetId]`
Delete widget.

- **Auth:** Required (leader)

---

## Space Components

### `GET /api/spaces/[spaceId]/components`
List components in a space.

- **Auth:** Required (member)

### `POST /api/spaces/[spaceId]/components`
Add a component.

- **Auth:** Required (leader)

### `GET /api/spaces/[spaceId]/components/[componentId]`
Get component details.

- **Auth:** Required (member)

### `PATCH /api/spaces/[spaceId]/components/[componentId]`
Update component.

- **Auth:** Required (leader)

### `DELETE /api/spaces/[spaceId]/components/[componentId]`
Delete component.

- **Auth:** Required (leader)

### `POST /api/spaces/[spaceId]/components/[componentId]/participate`
Participate in an interactive component (poll, RSVP, etc.).

- **Auth:** Required (member)

---

## Space Invites

### `GET /api/spaces/invite/[code]/validate`
Validate an invite code and get space preview.

- **Auth:** Optional
- **Response:** `{ success: true, space: SpacePreview, invite: InviteData }`

### `POST /api/spaces/invite/[code]/redeem`
Redeem invite code to join a space.

- **Auth:** Required
- **Response:** `{ success: true, spaceId: string }`
- **Notes:** Validates campus match, checks expiration, enforces max uses.

---

## Events

### `GET /api/events`
Get campus-wide events (all public events regardless of space membership).

- **Auth:** Optional (defaults to public campus)
- **Query:**
  ```ts
  {
    limit?: number,    // 1-100, default 50
    offset?: number,
    type?: 'academic' | 'social' | 'professional' | 'recreational' | 'official' | 'meeting' | 'virtual',
    upcoming?: boolean,
    myEvents?: boolean,
    spaceId?: string,
    campusWide?: boolean,
    search?: string,
    from?: string,     // ISO date
    to?: string        // ISO date
  }
  ```

### `GET /api/events/personalized`
Get events ranked by relevance to user.

- **Auth:** Required
- **Query:**
  ```ts
  {
    timeRange?: 'tonight' | 'today' | 'this-week' | 'this-month',
    maxItems?: number,  // 1-50, default 10
    eventTypes?: string[],
    excludeRsvped?: boolean
  }
  ```
- **Notes:** 8-factor ranking: interest match, social context, space membership, time proximity, etc.

---

## Feed

### `GET /api/feed`
Get personalized feed with 8-factor ranking algorithm.

- **Auth:** Required
- **Query:**
  ```ts
  {
    limit?: number,     // 1-50, default 20
    offset?: number,
    cursor?: string,
    type?: 'all' | 'spaces' | 'events' | 'posts' | 'tools',
    spaceId?: string,
    sortBy?: 'algorithm' | 'recent' | 'engagement'
  }
  ```
- **Notes:** Ranking factors: Space Engagement (25%), Content Quality (20%), Recency (15%), Tool Interaction (15%), Social Signals (10%), Creator Influence (5%), Diversity (5%), Temporal Relevance (5%). Respects Ghost Mode privacy.

### `POST /api/feed/search`
Search feed content.

- **Auth:** Required
- **Body:**
  ```ts
  {
    query: string,       // 1-100 chars
    limit?: number,      // 1-50
    type?: 'post' | 'event' | 'tool' | 'space_update' | 'announcement',
    spaceId?: string,
    timeRange?: 'day' | 'week' | 'month' | 'all',
    sortBy?: 'relevance' | 'recent' | 'engagement'
  }
  ```

### `GET /api/feed/updates`
Check for new feed items since last view.

- **Auth:** Required
- **Response:** `{ hasNewPosts: boolean, newPostCount: number, lastPostAt: string }`

---

## Posts

### `POST /api/posts`
Create a new post.

- **Auth:** Required
- **Body:**
  ```ts
  {
    content: string,    // 1-5000 chars
    contentType?: 'user_post' | 'builder_announcement',
    spaceId?: string,
    visibility?: 'public' | 'private' | 'members_only'
  }
  ```

### `POST /api/posts/[postId]/like`
Toggle like on a post.

- **Auth:** Required

### `POST /api/posts/[postId]/bookmark`
Toggle bookmark on a post.

- **Auth:** Required

### `GET|POST /api/posts/[postId]/comments`
Get or add comments on a post.

- **Auth:** GET: Optional, POST: Required
- **Body (POST):** `{ content: string }`

---

## Social

### `POST /api/social/interactions`
Create social interactions (like, comment, share, bookmark).

- **Auth:** Required
- **Body:**
  ```ts
  {
    postId: string,
    action: 'like' | 'unlike' | 'comment' | 'share' | 'bookmark' | 'unbookmark',
    content?: string,    // For comments
    metadata?: Record<string, any>
  }
  ```

### `POST /api/social/posts`
Create social post (V2 with richer content types).

- **Auth:** Required
- **Body:**
  ```ts
  {
    content: string,      // 1-500
    type: 'text' | 'image' | 'video' | 'link' | 'poll' | 'event' | 'tool' | 'announcement',
    visibility?: 'public' | 'space' | 'private',
    spaceId?: string,
    attachments?: Attachment[],
    tags?: string[],
    mentions?: string[],
    poll?: { question, options, allowMultiple?, expiresAt? },
    event?: { title, description, startTime, endTime?, location? }
  }
  ```

---

## Comments

### `POST /api/comments/[commentId]/like`
Toggle like on a comment.

- **Auth:** Required
- **Body:** `{ postId?: string }`

---

## Tools

### `GET /api/tools`
List tools (created by user or campus tools).

- **Auth:** Required

### `POST /api/tools`
Create a new tool.

- **Auth:** Required
- **Rate limit:** 10 creations per hour
- **Body:**
  ```ts
  {
    name: string,        // 1-100
    description?: string, // max 500
    category?: string,
    type?: 'template' | 'visual' | 'code' | 'wizard',
    status?: 'draft' | 'preview' | 'published',
    config?: unknown
  }
  ```

### `GET /api/tools/[toolId]`
Get tool details.

- **Auth:** Required

### `PATCH /api/tools/[toolId]`
Update a tool.

- **Auth:** Required (owner)

### `DELETE /api/tools/[toolId]`
Delete a tool.

- **Auth:** Required (owner)

### `POST /api/tools/[toolId]/deploy`
Deploy a tool to a space.

- **Auth:** Required

### `GET /api/tools/[toolId]/analytics`
Get tool usage analytics.

- **Auth:** Required (owner)

### `GET|POST /api/tools/[toolId]/reviews`
Get or submit tool reviews.

- **Auth:** Required

### `POST /api/tools/[toolId]/share`
Share tool with others.

- **Auth:** Required (owner)

### `POST /api/tools/[toolId]/publish-template`
Publish tool as reusable template.

- **Auth:** Required (owner)

### `POST /api/tools/[toolId]/upload-asset`
Upload asset for tool.

- **Auth:** Required (owner)
- **Body:** FormData

### `GET /api/tools/[toolId]/with-state`
Get tool with current state.

- **Auth:** Required

### `GET /api/tools/[toolId]/audit`
Get tool audit log.

- **Auth:** Required (owner/admin)

### `GET /api/tools/[toolId]/runs`
Get tool execution runs.

- **Auth:** Required (owner)

### `GET|PUT /api/tools/[toolId]/state`
Get or update tool state.

- **Auth:** Required

### `GET /api/tools/browse`
Browse public tools marketplace.

- **Auth:** Required

### `POST /api/tools/install`
Install a tool from marketplace.

- **Auth:** Required

### `GET /api/tools/capabilities`
List available tool capabilities.

- **Auth:** Required

### `POST /api/tools/capabilities/validate`
Validate tool capabilities configuration.

- **Auth:** Required

### `POST /api/tools/event-system`
Tool event system interactions.

- **Auth:** Required

### `POST /api/tools/deploy`
Deploy a tool (general endpoint).

- **Auth:** Required

### `GET /api/tools/deploy/[deploymentId]`
Get deployment status.

- **Auth:** Required

### `GET /api/tools/usage-stats`
Get tool usage statistics.

- **Auth:** Required

### `GET /api/tools/state/[deploymentId]`
Get deployed tool state.

- **Auth:** Required

### `GET /api/tools/recommendations`
Get tool recommendations for user.

- **Auth:** Required

### `GET /api/tools/search`
Search tools.

- **Auth:** Required
- **Query:** `?q=string`

### `POST /api/tools/publish`
Publish a tool to marketplace.

- **Auth:** Required (owner)

### `POST /api/tools/migrate`
Migrate tool data/format.

- **Auth:** Required (owner)

### `POST /api/tools/review`
Submit a tool review.

- **Auth:** Required

### `POST /api/tools/generate`
Generate a tool using AI/templates.

- **Auth:** Required

### `POST /api/tools/feed-integration`
Integrate tool with feed.

- **Auth:** Required

### `POST /api/tools/execute`
Execute a tool action.

- **Auth:** Required

### `GET /api/tools/personal`
Get user's personal/private tools.

- **Auth:** Required

### `GET /api/tools/updates`
Get tool update notifications.

- **Auth:** Required

---

## Tool Versions & Connections

### `GET /api/tools/[toolId]/versions`
List tool versions.

- **Auth:** Required

### `GET /api/tools/[toolId]/versions/[version]`
Get specific version.

- **Auth:** Required

### `POST /api/tools/[toolId]/versions/[version]/restore`
Restore a previous version.

- **Auth:** Required (owner)

### `GET /api/tools/[toolId]/connections`
List tool connections (data sources, APIs).

- **Auth:** Required

### `POST /api/tools/[toolId]/connections`
Create a connection.

- **Auth:** Required

### `DELETE /api/tools/[toolId]/connections/[connectionId]`
Remove a connection.

- **Auth:** Required

---

## Tool Automations

### `GET /api/tools/[toolId]/automations`
List automations for a tool.

- **Auth:** Required

### `POST /api/tools/[toolId]/automations`
Create a tool automation.

- **Auth:** Required

### `GET /api/tools/[toolId]/automations/[automationId]`
Get automation details.

- **Auth:** Required

### `PATCH /api/tools/[toolId]/automations/[automationId]`
Update automation.

- **Auth:** Required

### `DELETE /api/tools/[toolId]/automations/[automationId]`
Delete automation.

- **Auth:** Required

### `POST /api/tools/[toolId]/automations/[automationId]/test`
Test an automation.

- **Auth:** Required

### `POST /api/tools/[toolId]/automations/[automationId]/trigger`
Manually trigger an automation.

- **Auth:** Required

### `GET /api/tools/[toolId]/automations/[automationId]/runs`
Get automation run history.

- **Auth:** Required

---

## Elements

HiveLab element specifications (the building blocks for visual tool builder).

### `GET /api/elements`
List all available element types.

- **Auth:** Public
- **Query:** `?category=string&tier=string&search=string&stateful=bool&realtime=bool`
- **Response:** Element specs with schemas, categories, tiers
- **Cache:** 1 hour, stale-while-revalidate 24h

### `GET /api/elements/[elementId]`
Get full element specification.

- **Auth:** Public
- **Cache:** 1 hour

### `POST /api/elements/validate`
Validate element configuration.

- **Auth:** Required

---

## Placements

Tool placement management (where tools appear in the UI).

### `GET /api/placements`
List placements.

- **Auth:** Required

### `POST /api/placements`
Create a placement.

- **Auth:** Required

### `GET /api/placements/[placementId]`
Get placement details.

- **Auth:** Required

### `PATCH /api/placements/[placementId]`
Update placement.

- **Auth:** Required

### `DELETE /api/placements/[placementId]`
Delete placement.

- **Auth:** Required

---

## Templates

### `GET /api/templates`
List available templates (space and tool templates).

- **Auth:** Required

### `GET /api/templates/[templateId]`
Get template details.

- **Auth:** Required

### `POST /api/templates/[templateId]/use`
Use a template to create a tool/space.

- **Auth:** Required

### `GET /api/automations/templates`
List automation templates.

- **Auth:** Required

---

## Setups

Setup orchestration system for deploying configurations.

### `POST /api/setups/deploy`
Deploy a setup configuration.

- **Auth:** Required

### `GET /api/setups/deployments`
List setup deployments.

- **Auth:** Required

### `GET /api/setups/deployments/[id]`
Get deployment details.

- **Auth:** Required

### `POST /api/setups/orchestration/data-change`
Handle data change orchestration event.

- **Auth:** Required

### `POST /api/setups/orchestration/event`
Handle orchestration event.

- **Auth:** Required

### `POST /api/setups/orchestration/manual/[ruleId]`
Manually trigger an orchestration rule.

- **Auth:** Required

### `GET /api/setups/templates`
List setup templates.

- **Auth:** Required

### `GET /api/setups/templates/[id]`
Get setup template details.

- **Auth:** Required

---

## Rituals

Recurring group activities (challenges, streaks, competitions).

### `GET /api/rituals`
List available rituals.

- **Auth:** Required

### `POST /api/rituals`
Create a ritual.

- **Auth:** Required (leader)

### `GET /api/rituals/active`
Get currently active rituals.

- **Auth:** Required

### `GET /api/rituals/my-participations`
Get current user's ritual participations.

- **Auth:** Required

### `GET /api/rituals/slug/[slug]`
Look up ritual by slug.

- **Auth:** Required

### `GET /api/rituals/[ritualId]`
Get ritual details.

- **Auth:** Required

### `PATCH /api/rituals/[ritualId]`
Update ritual.

- **Auth:** Required (creator/leader)

### `POST /api/rituals/[ritualId]/join`
Join a ritual.

- **Auth:** Required

### `POST /api/rituals/[ritualId]/leave`
Leave a ritual.

- **Auth:** Required

### `POST /api/rituals/[ritualId]/participate`
Record participation/check-in.

- **Auth:** Required

### `POST /api/rituals/[ritualId]/phase`
Advance ritual phase.

- **Auth:** Required (creator/leader)

### `GET /api/rituals/[ritualId]/leaderboard`
Get ritual leaderboard.

- **Auth:** Required

---

## Calendar

### `GET /api/calendar`
Get user's calendar events from space memberships.

- **Auth:** Required
- **Notes:** Read-only. Includes conflict detection (overlap, adjacent, close proximity).

### `GET /api/calendar/[eventId]`
Get calendar event details.

- **Auth:** Required

### `PATCH /api/calendar/[eventId]`
Update a calendar event.

- **Auth:** Required (creator/leader)

### `DELETE /api/calendar/[eventId]`
Delete a calendar event.

- **Auth:** Required (creator/leader)

### `GET /api/calendar/status`
Get calendar integration status.

- **Auth:** Required

### `POST /api/calendar/connect`
Connect external calendar (Google Calendar OAuth).

- **Auth:** Required

### `GET /api/calendar/callback`
OAuth callback for calendar connection.

- **Auth:** Required

### `GET /api/calendar/conflicts`
Detect scheduling conflicts.

- **Auth:** Required

### `GET /api/calendar/free-time`
Find free time slots.

- **Auth:** Required

---

## Campus

### `GET /api/campus/detect`
Detect campus from email domain.

- **Auth:** Public
- **Query:** `?email=string`

### `GET /api/campus/buildings`
List campus buildings.

- **Auth:** Required

### `GET /api/campus/buildings/study-spots`
Get study spots in campus buildings.

- **Auth:** Required

### `GET /api/campus/dining`
List campus dining options.

- **Auth:** Required

### `GET /api/campus/dining/[id]`
Get dining location details.

- **Auth:** Required

### `GET /api/campus/dining/recommend`
Get dining recommendations.

- **Auth:** Required

---

## DMs

Direct messaging (feature-flagged).

### `GET /api/dm/conversations`
List user's DM conversations.

- **Auth:** Required

### `POST /api/dm/conversations`
Create a new conversation.

- **Auth:** Required
- **Body:** `{ participantIds: string[] }`

### `GET /api/dm/conversations/[conversationId]`
Get conversation details.

- **Auth:** Required (participant)

### `PATCH /api/dm/conversations/[conversationId]`
Update conversation settings.

- **Auth:** Required (participant)

### `GET /api/dm/conversations/[conversationId]/messages`
Get messages in a conversation.

- **Auth:** Required (participant)

### `POST /api/dm/conversations/[conversationId]/messages`
Send a message.

- **Auth:** Required (participant)

### `GET /api/dm/conversations/[conversationId]/stream`
SSE stream for real-time messages.

- **Auth:** Required (participant)

---

## Privacy

### `GET /api/privacy`
Get current privacy settings.

- **Auth:** Required

### `PATCH /api/privacy`
Update privacy settings.

- **Auth:** Required

### `GET|PATCH /api/privacy/visibility`
Get or update profile visibility level.

- **Auth:** Required

### `POST /api/privacy/ghost-mode`
Toggle Ghost Mode (hide online status, activity).

- **Auth:** Required
- **Body:** `{ enabled: boolean }`

---

## Content Moderation

### `POST /api/content/check`
Check text content for policy violations.

- **Auth:** Required
- **Body:** `{ content: string, context?: string }`

### `POST /api/content/check-image`
Check image for policy violations.

- **Auth:** Required
- **Body:** FormData with image

### `POST /api/content/reports`
Submit a content report.

- **Auth:** Required
- **Body:** `{ contentId: string, contentType: string, reason: string, details?: string }`

---

## Notifications

### `GET /api/notifications`
Get user's notifications.

- **Auth:** Required
- **Query:** `?limit=20&offset=0&unreadOnly=boolean`

### `PATCH /api/notifications`
Mark notifications as read.

- **Auth:** Required
- **Body:** `{ notificationIds: string[] }`

### `GET /api/notifications/stream`
SSE stream for real-time notifications.

- **Auth:** Required

---

## Search

### `GET /api/search`
Universal search across spaces, users, events, posts.

- **Auth:** Required
- **Query:** `?q=string&type=string&limit=20`

### `GET /api/search/v2`
V2 search with enhanced ranking and facets.

- **Auth:** Required

---

## Connections & Friends

### `GET /api/connections`
Get user's connections.

- **Auth:** Required

### `POST /api/connections`
Send connection request.

- **Auth:** Required

### `GET /api/friends`
Get user's friends list.

- **Auth:** Required

---

## Users

### `GET /api/users/search`
Search for users.

- **Auth:** Required
- **Query:** `?q=string&limit=20`

### `GET /api/users/suggestions`
Get user suggestions (people you may know).

- **Auth:** Required

### `POST /api/users/fcm-token`
Register FCM push notification token.

- **Auth:** Required
- **Body:** `{ token: string }`

---

## Analytics

### `GET /api/analytics/metrics`
Get platform metrics.

- **Auth:** Required

### `POST /api/analytics/track`
Track an analytics event.

- **Auth:** Required
- **Body:** `{ event: string, properties?: Record<string, any> }`

---

## Activity

### `GET /api/activity`
Get current user's activity.

- **Auth:** Required

### `GET /api/activity-feed`
Get activity feed (cross-space).

- **Auth:** Required

---

## Admin

All admin routes require admin authentication (`withAdminAuthAndErrors` or admin check).

### Schools

#### `GET /api/admin/schools`
List all schools.

#### `POST /api/admin/schools`
Create a new school.
- **Body:**
  ```ts
  {
    id: string,           // lowercase alphanumeric with hyphens
    name: string,
    shortName?: string,
    domain: string,
    emailDomains: { student: string[], faculty?: string[], staff?: string[], alumni?: string[] },
    location: { city: string, state: string, country?: string },
    eventSources?: EventSourceConfig[],
    status?: 'waitlist' | 'beta' | 'active' | 'suspended'
  }
  ```

#### `GET /api/admin/schools/[schoolId]`
Get school details.

#### `PATCH /api/admin/schools/[schoolId]`
Update school.

#### `DELETE /api/admin/schools/[schoolId]`
Soft-delete school.

#### `POST /api/admin/schools/[schoolId]/notify-waitlist`
Notify school's waitlist users.

### Users

#### `GET /api/admin/users`
List users with filtering.

#### `GET /api/admin/users/[userId]`
Get user details.

#### `PATCH /api/admin/users/[userId]`
Update user.

#### `DELETE /api/admin/users/[userId]`
Remove user.

#### `POST /api/admin/users/[userId]/suspend`
Suspend a user.

#### `POST /api/admin/users/[userId]/unsuspend`
Unsuspend a user.

#### `POST /api/admin/users/bulk`
Bulk user operations.

#### `GET /api/admin/users/export`
Export users as CSV/JSON.

### Spaces

#### `GET /api/admin/spaces`
List all spaces.

#### `GET /api/admin/spaces/[spaceId]`
Get space details.

#### `PATCH /api/admin/spaces/[spaceId]`
Update space.

#### `DELETE /api/admin/spaces/[spaceId]`
Delete space.

#### `GET /api/admin/spaces/[spaceId]/members`
List space members.

#### `GET /api/admin/spaces/[spaceId]/activity`
Get space activity log.

#### `POST /api/admin/spaces/[spaceId]/feature`
Feature/unfeature a space.

#### `GET /api/admin/spaces/[spaceId]/moderation`
Get moderation queue for space.

#### `GET /api/admin/spaces/health`
Get health status of all spaces.

#### `GET /api/admin/spaces/analytics`
Get aggregate space analytics.

### Feature Flags

#### `GET /api/admin/feature-flags`
List all feature flags.

#### `POST /api/admin/feature-flags`
Create a feature flag.

#### `GET /api/admin/feature-flags/[flagId]`
Get flag details.

#### `PATCH /api/admin/feature-flags/[flagId]`
Update flag.

#### `DELETE /api/admin/feature-flags/[flagId]`
Delete flag.

### School Admins

#### `GET /api/admin/school-admins`
List school administrators.

#### `POST /api/admin/school-admins`
Add a school admin.

#### `GET /api/admin/school-admins/[adminId]`
Get admin details.

#### `PATCH /api/admin/school-admins/[adminId]`
Update admin.

#### `DELETE /api/admin/school-admins/[adminId]`
Remove admin.

#### `POST /api/admin/school-admins/invite`
Invite a new school admin.

### Analytics

#### `GET /api/admin/analytics/comprehensive`
Comprehensive platform analytics.

#### `GET /api/admin/analytics/growth`
Growth metrics over time.

#### `GET /api/admin/analytics/onboarding-funnel`
Onboarding conversion funnel.

#### `GET /api/admin/analytics/realtime`
Real-time platform metrics.

#### `GET /api/admin/analytics/retention`
User retention metrics.

### Moderation

#### `GET /api/admin/moderation/queue`
Get moderation queue.

#### `GET /api/admin/moderation/reports`
List content reports.

#### `POST /api/admin/moderation/reports/[reportId]/resolve`
Resolve a content report.

#### `GET /api/admin/moderation/appeals`
List moderation appeals.

#### `GET /api/admin/moderation/feedback`
Get moderation feedback.

#### `GET /api/admin/moderation/violations`
List user violations.

### Activity Logs

#### `GET /api/admin/activity-logs`
Get admin activity logs.
- **Query:**
  ```ts
  {
    limit?: number,
    offset?: number,
    action?: string,
    adminId?: string,
    severity?: 'info' | 'warning' | 'error' | 'critical',
    dateFrom?: string,
    dateTo?: string,
    success?: boolean
  }
  ```

#### `GET /api/admin/activity-logs/export`
Export activity logs as CSV/JSON.

### Command Center

#### `GET /api/admin/command/health`
Platform health dashboard.

#### `GET /api/admin/command/impact`
Impact metrics.

#### `GET /api/admin/command/momentum`
Momentum/growth indicators.

#### `GET /api/admin/command/pulse`
Real-time pulse metrics.

#### `GET /api/admin/command/territory`
Territory/campus coverage data.

### Tools Administration

#### `GET /api/admin/tools/pending`
List tools pending review.

#### `GET /api/admin/tools/review-stats`
Get tool review statistics.

#### `POST /api/admin/tools/[toolId]/approve`
Approve a tool for marketplace.

#### `POST /api/admin/tools/[toolId]/reject`
Reject a tool submission.

### AI Quality

#### `GET /api/admin/ai-quality/metrics`
AI quality metrics dashboard.

#### `GET /api/admin/ai-quality/generations`
List AI generations.

#### `GET /api/admin/ai-quality/failures`
List AI failures.

#### `GET /api/admin/ai-quality/edits`
List AI-suggested edits.

### Other Admin Routes

#### `GET /api/admin/announcements`
List platform announcements.

#### `POST /api/admin/announcements`
Create an announcement.

#### `GET /api/admin/builder-requests`
List builder access requests.

#### `GET /api/admin/claims`
List space claims.

#### `GET /api/admin/content-moderation`
Content moderation dashboard.

#### `GET /api/admin/leaders/health`
Leader health metrics.

#### `GET /api/admin/logs`
System logs.

#### `GET /api/admin/alerts`
List active alerts.

#### `POST /api/admin/alerts/acknowledge`
Acknowledge an alert.

#### `GET /api/admin/realtime/stream`
SSE stream for real-time admin events.

#### `POST /api/admin/seed-school`
Seed a school with initial data.

#### `GET /api/admin/system/health`
System-wide health check.

---

## System

### `GET /api/health`
Platform health check.

- **Auth:** Public
- **Response:** `{ status: 'ok', timestamp: string }`

### `GET /api/schools`
List available schools.

- **Auth:** Public

### `GET /api/stats`
Get public platform statistics.

- **Auth:** Public

### `GET /api/feature-flags`
Get feature flags for current user.

- **Auth:** Required

### `POST /api/feedback`
Submit user feedback.

- **Auth:** Required

### `POST /api/errors/report`
Report a client-side error.

- **Auth:** Optional

### `GET /api/onboarding/catalog`
Get onboarding catalog (spaces, interests, etc.).

- **Auth:** Required

---

## Cron

Internal cron job endpoints (called by Vercel cron).

### `POST /api/cron/automations`
Process pending automations.

### `POST /api/cron/setup-orchestration`
Run setup orchestration tasks.

### `POST /api/cron/tool-automations`
Process tool automations.

---

## Auth Middleware Reference

| Wrapper | Description |
|---------|-------------|
| `withAuthAndErrors` | Requires valid session, handles errors |
| `withAuthValidationAndErrors` | Auth + Zod body validation |
| `withAdminAuthAndErrors` | Requires admin session |
| `withOptionalAuth` | Auth optional, provides user if available |
| `withErrors` | Error handling only, no auth |
| `withValidation` | Body validation, no auth |
| `withSecureAuth` | Firebase token-based auth |
| `withAuth` | Simple auth context wrapper |

## Rate Limit Presets

| Preset | Limit |
|--------|-------|
| `auth` | Strict (sign-in/code flows) |
| `strict` | 10 requests/minute |
| `standard` | 60 requests/minute |
| `apiGeneral` | 100 requests/minute |
| `authLoose` | Permissive (checks, health) |
