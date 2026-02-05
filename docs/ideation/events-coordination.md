# Events & Coordination

> **Dimension:** How things get organized on campus
> **Decision Filter:** Does this help a student find their people, join something real, and come back tomorrow?
> **North Star:** Weekly Active Spaces
> **Date:** February 5, 2026

---

## Current State

Events live inside Spaces as a subcollection. The infrastructure is more mature than you'd expect for a platform that hasn't launched:

**What exists:**

- **Event CRUD** (`/api/spaces/[spaceId]/events/route.ts`) -- Create events with title, description, type (academic/social/recreational/cultural/meeting/virtual), start/end dates, location, virtual link, max attendees, RSVP deadline, recurring flag, tags, image, cost. Admin-only creation. XSS scanning on all text fields. Campus-isolated.
- **RSVP system** (`/api/spaces/[spaceId]/events/[eventId]/rsvp/route.ts`) -- going/maybe/not_going statuses. Capacity enforcement. Deadline enforcement. Deterministic doc IDs (`eventId_userId`) to prevent duplicates. Notifications to organizer and confirmation to attendee.
- **Personalized events** (`/api/events/personalized/route.ts`) -- Relevance scoring based on interest match, friends attending, space membership, time proximity, popularity. Powers "Event for Me Tonight" feature.
- **Calendar** (`/me/calendar`) -- Read-only calendar with day/week/month views. Event type filtering. Conflict detection (overlap, adjacent, close proximity). Keyboard navigation. No creation from calendar view.
- **Event-board auto-linking** -- Creating an event automatically creates a chat board for that event's discussion.
- **Flat collection architecture** -- Events stored in `/events` collection (not space subcollection) with `spaceId` field, enabling cross-space calendar queries.
- **Calendar API infrastructure** -- Routes exist for conflicts, free-time, status, connect (Google OAuth stubbed), and per-event operations.
- **Home page integration** -- "Up Next" section shows next event within 24 hours with inline RSVP.

**What's missing:**

- No recurring event generation (flag exists, no scheduler)
- No attendance tracking (RSVP != showed up)
- No post-event anything (recaps, photos, feedback)
- No event reminders beyond notification on creation
- No location intelligence (room names, maps, campus context)
- No event discovery outside your spaces
- No coordination tools for organizers (check-in, supplies, volunteers)
- No event templates or cloning
- No waitlist when capacity is reached
- No co-hosting across spaces
- Calendar is read-only -- no event creation from calendar view
- Google Calendar sync is stubbed (returns 503)
- `isRecurring` and `recurrenceRule` fields exist in schema but nothing processes them

**Data model (current):**

```typescript
// /events/{eventId}
{
  title, description, type, startDate, endDate,
  location, virtualLink, maxAttendees, rsvpDeadline,
  isRecurring, recurrenceRule, tags, imageUrl,
  isFeatured, isPrivate, requiredRSVP, cost, currency,
  spaceId, organizerId, campusId,
  status: 'scheduled', isHidden: false,
  createdAt, updatedAt
}

// /rsvps/{eventId_userId}
{
  userId, eventId, spaceId, status: 'going' | 'maybe' | 'not_going',
  campusId, createdAt, updatedAt
}
```

---

## The Opportunity

Events are where HIVE stops being an app and starts being real life.

Every other feature on HIVE is digital -- chat, profiles, discovery. Events are the bridge to physical presence. A student who RSVPs on HIVE and walks into a room full of people they recognize from the app has just experienced something no amount of chat messages can replicate. That moment -- "oh, I know you from HIVE" -- is the belonging moment.

**Why events are the heartbeat:**

1. **Events create the RSVP-to-attendance pipeline.** This is the highest-intent action on campus. A student who says "going" and shows up has crossed from passive browsing to active participation. That's the conversion that matters.

2. **Recurring events are retention anchors.** "Every Tuesday at 7pm" is more powerful than any push notification. Weekly meetings, practice sessions, study groups -- these create rhythm. A student with 3 recurring events on HIVE checks HIVE 3x/week minimum.

3. **Events are the natural entry point to spaces.** "There's a hackathon this weekend" is a better pitch than "join our CS club." Events have urgency, specificity, and a clear value proposition. They're the wedge into community membership.

4. **Post-event content creates community memory.** Photos from the spring formal, notes from the speaker series, results from the tournament -- this content is what makes a space feel alive even between events. It's the connective tissue of belonging.

5. **The coordination tax on leaders is enormous.** Right now, an org president creates events on CampusGroups, posts about them on Instagram, sends reminders via GroupMe, tracks attendance on a Google Sheet, and submits reports to Student Affairs. HIVE can collapse that into one workflow.

6. **Campus-specific context is a structural advantage.** Google Calendar doesn't know what "Baldy Hall 200" means. HIVE can. Campus building names, room capacities, food ordering integrations, university approval workflows -- this is context that general-purpose tools can never match.

**The RSVP-to-Attendance Gap:**

At UB, typical campus org event attendance runs 30-50% of RSVPs. That gap is where value leaks. Every student who RSVPs and doesn't show up is a failed belonging moment. Closing that gap -- through better reminders, social pressure, post-event FOMO, and lower friction -- is worth more than adding 10 new features.

**Connection to North Star:**

Events drive Weekly Active Spaces directly. A space with a weekly event has a built-in reason to be active. A space without events is just a group chat that will eventually go quiet. Events are the forcing function for space health.

---

## Feature Ideas

### 1. Event Reminders & Countdown

**Problem:** Students RSVP and forget. The RSVP-to-attendance gap is ~50%. Currently, the only notification is when the event is created. No reminders before the event starts.

**Shape:**
- Configurable reminders when RSVPing: 1 day before, 2 hours before, 30 minutes before
- Default: 2 hours before for in-person, 10 minutes before for virtual
- "Starting now" push notification when event begins
- Countdown timer on event card when < 24 hours away
- "Leave in 15 minutes to get there on time" if location is on campus (distance-aware)
- Morning digest: "You have 2 events today"

**Wedge:** This is table-stakes for any calendar product, and HIVE doesn't have it. Students currently rely on their own memory or manual Google Calendar entries. Adding reminders immediately makes HIVE more useful than the org's GroupMe.

**Impact:** High. Directly closes the RSVP-to-attendance gap. Every student who shows up because of a reminder is a belonging moment that wouldn't have happened.

**Effort:** Low-Medium. Cloud Function that runs every minute, queries upcoming events with RSVPs, creates notifications for due reminders. Reminder preferences stored on the RSVP document. Push notification infrastructure already partially exists.

**Tradeoffs:**
- Running a function every minute costs money at scale. Could batch to every 5 minutes and accept slight delay.
- Over-notification risk. Students who get reminded about 5 events today may mute everything. Need intelligent batching.
- "Leave in 15 minutes" requires location data quality that may not exist yet. Could ship without distance-awareness initially.

---

### 2. Recurring Event Engine

**Problem:** The `isRecurring` and `recurrenceRule` fields exist in the event schema but nothing processes them. Leaders manually recreate "Weekly Meeting" every week. This is the #1 coordination tax for active orgs.

**Shape:**
- Recurrence options: Daily, Weekly, Biweekly, Monthly, Custom (RRULE)
- Auto-generate instances 4 weeks ahead via Cloud Function
- Edit options: "This event only" / "This and all future" / "All events in series"
- Cancel single occurrence without affecting series
- RSVPs do NOT carry over between instances (prevents phantom attendees)
- "RSVP for next week?" notification after each instance
- Series overview: see all upcoming instances, bulk edit
- End conditions: after N occurrences, on specific date, never (with annual review prompt)

**Wedge:** This is the "time collapse" opportunity. A leader who sets up "E-Board Meeting: Every Tuesday 7pm, Baldy 101" once and never touches it again has just saved 30 minutes/week of event creation labor. That's 15 hours/semester.

**Impact:** Very High. Recurring events are the single strongest retention mechanism. A student with 3 recurring events on HIVE has a reason to check HIVE 3x/week. This directly drives Weekly Active Spaces.

**Effort:** Medium-High. Need Cloud Function for instance generation, RRULE parsing, series-level editing logic, UI for recurrence picker. The data model needs a `seriesId` field linking instances.

**Tradeoffs:**
- Generating instances too far ahead creates noise. 4 weeks is the sweet spot -- far enough for planning, close enough to be real.
- RRULE is complex. Could start with just Weekly/Biweekly/Monthly presets and add custom later.
- Series editing is UX-complex. Google Calendar's "This event / This and following / All events" pattern is well-understood but requires careful state management.
- What happens when a recurring event's space goes inactive? Need auto-pause logic.

---

### 3. Event Discovery Feed

**Problem:** Students only see events from spaces they've already joined. No way to discover events across campus. This limits events' power as an entry point to new communities.

**Shape:**
- `/explore/events` -- campus-wide event feed, sorted by relevance
- Relevance scoring (already partially built in personalized events API): interest match, friends attending, time proximity, popularity
- Filters: This week / This weekend / Tonight / By type / Free only
- "Friends going" social proof badges on event cards
- "From a space you might like" cross-sell to space membership
- RSVP directly from discovery feed (creates a "following" relationship with the space, not full membership)
- Featured events section (admin-curated or algorithmically surfaced)
- Map view: see events plotted on campus map

**Wedge:** "What's happening on campus tonight?" is a question every student asks, especially freshmen. No existing tool answers it well. CampusGroups has events but no personalization, no social proof, no mobile-first design. Instagram stories are ephemeral and unsearchable.

**Impact:** Very High. Events as discovery engine for spaces. A student who finds a hackathon through event discovery, attends, and then joins the CS Club space has gone from stranger to member through a single event. This is the highest-quality acquisition channel.

**Effort:** Medium. The personalized events API already exists. Need a dedicated page, filter UI, and the "RSVP without joining" flow. Map view is high effort and could be Phase 2.

**Tradeoffs:**
- Showing events from spaces you haven't joined raises privacy questions for private spaces. Only show events from public spaces and spaces with `isPrivate: false` on the event.
- "RSVP without joining" creates a new relationship type (event attendee vs. space member). Need to decide if attending an event auto-suggests space membership afterward.
- Personalization requires interest data. New users with no interests set get a generic feed. Cold start problem.
- Map view depends on having structured location data (lat/lng), which most events won't have initially.

---

### 4. Post-Event Recap & Photos

**Problem:** Events end and nothing happens. The shared experience evaporates. There's no community memory. Leaders can't demonstrate impact to Student Affairs. Attendees have no artifact to share.

**Shape:**
- After event ends, organizer gets prompted: "How'd it go?"
- Quick recap form: attendance count, highlight moment (text), photos (up to 10)
- Attendees get "Share your photos" prompt with upload flow
- Recap appears as a special message in the space feed -- rich card with photos, attendance, highlights
- Recap is browsable: space has a "Past Events" tab showing all recaps
- Photo albums persist in space -- "Spring 2026 Events" collection
- Shareable recap card (branded, designed for Instagram stories)
- Metrics for leaders: attendance vs. RSVP comparison, trending events

**Wedge:** This is content that only exists because the event happened on HIVE. It's un-copyable community memory. Every photo album, every recap card, every attendance record deepens the switching cost. And the shareable recap card puts HIVE's brand in front of non-users on Instagram.

**Impact:** High. Creates content that keeps spaces alive between events. Creates distribution artifacts (shareable cards). Creates data that leaders need (attendance reports). Creates emotional anchors (memories).

**Effort:** Medium. Photo upload infrastructure needed (Firebase Storage exists). Recap form is simple. Rich card rendering is moderate. Instagram-ready export is a nice-to-have that can come later.

**Tradeoffs:**
- Photo moderation is a real concern. Need content scanning before photos are visible. Firebase ML Kit or a third-party service.
- Storage costs scale with photos. Need size limits and quality compression.
- The recap prompt timing matters. Too soon after the event and people are still socializing. Too late and they've moved on. 2 hours post-event is probably right.
- Some events don't warrant recaps (small study sessions). Should be optional, not forced.

---

### 5. Quick Event Creation (30-Second Events)

**Problem:** The current event creation form has 15+ fields. This is appropriate for formal events but overkill for "Hey, we're studying at Lockwood at 3pm, who's coming?" Casual coordination is where most campus life happens, and HIVE makes it too formal.

**Shape:**
- "Quick Event" button in space chat -- inline event creation
- Three fields only: What (title), When (smart date picker), Where (location autocomplete)
- Smart defaults: 1 hour duration, no max attendees, no RSVP deadline
- Creates event card in chat feed, members can tap to RSVP
- Optional expansion: add description, image, type, capacity after creation
- Location autocomplete with campus buildings and popular spots
- Natural language input: "Pizza at SU tomorrow 6pm" parses into structured event

**Wedge:** Discord and GroupMe handle casual coordination through messages ("who's free tonight?"). Those messages get buried. A quick event is a structured coordination moment that doesn't get lost in chat. It's the formalization of casual plans without the overhead of formal event creation.

**Impact:** High. Unlocks a category of events that currently doesn't exist on HIVE: casual, spontaneous, low-stakes. These are the events that happen 10x more frequently than formal org events. Every "quick event" is an activation moment.

**Effort:** Low-Medium. The event creation API already supports all needed fields. Need a simplified creation UI embedded in chat, smart date parsing, and a compact event card component.

**Tradeoffs:**
- Two creation paths (quick vs. full) could confuse users. Need clear differentiation -- quick is in-chat, full is in settings/events tab.
- Natural language parsing is unreliable. Start with structured fields and add NLP later.
- Quick events might not have enough metadata for the calendar view. Accept that quick events are "lighter" and show differently on calendar.
- Spam risk: easy creation means easy abuse. Rate limit to 5 quick events per user per day per space.

---

### 6. Attendance Check-In

**Problem:** RSVPs measure intent, not reality. Leaders need actual attendance for: funding requests to Student Affairs, measuring event success, identifying their most engaged members, and space reporting. Currently there's no way to track who actually showed up.

**Shape:**
- Organizer generates a 4-digit check-in code 30 minutes before event starts
- Attendees enter code on event page or scan QR (displayed on organizer's phone/laptop)
- Check-in window: event start time +/- 30 minutes (configurable)
- Check-in appears on attendee's profile: "Attended 12 events this semester"
- Leader dashboard shows attendance vs. RSVP comparison per event
- Export attendance list as CSV for Student Affairs reporting
- Geofence option (Phase 2): auto-check-in if within 100m of event location
- Streak tracking: "You've attended 4 consecutive weekly meetings!"

**Wedge:** Student Affairs at UB requires attendance documentation for funding. Leaders currently do this with paper sign-in sheets or Google Forms. Check-in on HIVE replaces both and gives leaders data they can actually use. This is the "must use today" entry point for org leadership.

**Impact:** High. Creates data that only exists on HIVE (attendance records). Creates a compliance workflow that locks in leaders. Creates engagement data that makes the platform smarter. Streaks create retention hooks.

**Effort:** Medium. QR code generation is trivial. Check-in logic needs a time-windowed validation system. Attendance data model needs a new `/attendance` collection. CSV export is simple.

**Tradeoffs:**
- Check-in codes can be shared by non-attendees. The honor system works for most campus contexts, but some leaders will care. Geofencing solves this but raises privacy concerns.
- QR scanning requires camera access. Some students resist. Always offer code entry as fallback.
- Attendance tracking feels surveillance-y if positioned wrong. Frame it as a benefit ("track your involvement") not a requirement.
- Adding attendance to profiles creates a "resume" dynamic that could feel competitive. Make it private by default, opt-in to display.

---

### 7. Event Templates & Cloning

**Problem:** Leaders create similar events repeatedly. The CS Club's "Weekly Workshop" has the same description, location, type, and tags every time. Only the date and specific topic change. This is wasted effort.

**Shape:**
- "Save as template" on any existing event
- Template library per space: "Weekly Workshop," "Study Session," "Social Night"
- Clone any past event: pre-fills all fields, just change date/topic
- Campus-wide template gallery: templates shared across spaces (opt-in)
- Template categories: Academic, Social, Meeting, Workshop, Sports, Fundraiser
- Template includes: description skeleton, default location, type, tags, capacity, recurring settings
- Smart suggestions: "You created 4 similar events. Save as template?"

**Wedge:** Time collapse for leaders. Setting up a template once saves 5 minutes per event creation. For an org that runs 3 events/week, that's 15 minutes/week, 10+ hours/semester. Small individually, massive in aggregate.

**Impact:** Medium. Reduces friction for power users (leaders). Doesn't directly affect regular members, but indirectly benefits them through more events being created.

**Effort:** Low. Template is just a stored event document without a date. Clone is a copy operation. Template gallery is a collection query. Smart suggestion requires tracking event similarity, which is higher effort.

**Tradeoffs:**
- Templates per space vs. per user vs. campus-wide. Start with per-space, expand to campus-wide if there's demand.
- Too many templates create clutter. Limit to 10 per space, allow archiving.
- Campus-wide templates need curation to avoid low-quality entries. Admin approval or quality threshold.

---

### 8. Waitlist & Capacity Management

**Problem:** When an event hits max capacity, students get a dead-end "Event is full" message. No way to express interest, no notification if a spot opens. Leaders don't know how much unmet demand exists.

**Shape:**
- When event is full, "Join Waitlist" replaces "RSVP Going"
- Waitlist position shown: "You're #3 on the waitlist"
- Auto-promote from waitlist when someone cancels RSVP (with notification)
- Promotion window: waitlisted student has 2 hours to confirm, then next person gets the spot
- Leader sees waitlist count: "12 going / 5 waitlisted" -- signal to book a bigger room or add another session
- Waitlist data informs future event planning: "Your last workshop had 15 people on the waitlist. Consider a larger venue."
- Capacity warnings: "Only 3 spots left!" on event card when near capacity

**Wedge:** Waitlists create urgency ("only 3 spots left") and reduce the pain of being turned away. A student on a waitlist is more engaged than one who never tried -- they've expressed intent and have a reason to check back. Waitlist-to-admission is a small belonging moment.

**Impact:** Medium. Only matters for events that hit capacity, which is a subset. But for those events, it's the difference between a frustrated student and an engaged one. Waitlist data is valuable signal for leaders.

**Effort:** Low. Waitlist is an additional RSVP status (`waitlisted`). Auto-promotion requires a trigger when an RSVP changes from `going` to `not_going`. Confirmation window needs a scheduled check.

**Tradeoffs:**
- Auto-promotion at 2am is useless. Need time-of-day awareness for promotion notifications.
- Confirmation window length is a tradeoff: too short and people miss it, too long and the spot sits empty. 2 hours during waking hours, extend overnight.
- Multiple concurrent cancellations could cause race conditions in promotion. Need transaction-based promotion logic.
- Showing "only 3 spots left" could feel manipulative. Only show when genuinely near capacity (>80% full).

---

### 9. Event Location Intelligence

**Problem:** Event locations are free-text strings. "Baldy 200" means nothing to a freshman. No maps, no directions, no context about the building. Students get lost, show up late, or don't show up at all.

**Shape:**
- Campus building database: name, address, coordinates, photo, accessibility info
- Location autocomplete when creating events: type "Bal" and see "Baldy Hall"
- Event detail page shows mini-map with building pin
- "Get Directions" button opens campus map or Google Maps
- Room-level detail: "Baldy Hall, Room 200 (2nd floor, turn left from elevator)"
- Walking time estimate from user's current location (or from campus center)
- Indoor photos of common event rooms
- Accessibility badges: "wheelchair accessible," "elevator available"

**Wedge:** This is campus-specific context that Google Calendar, Eventbrite, and every general-purpose tool structurally cannot provide. A platform that knows "Baldy 200 is in the Math building, 2nd floor, 7 minute walk from the Student Union" has utility that no competitor can match without campus-by-campus data collection.

**Impact:** Medium-High. Reduces the "I couldn't find the room" attendance drop-off. Creates platform value that's impossible to replicate quickly. Improves accessibility for students with disabilities.

**Effort:** High. Requires building a campus building database (could seed from university data), geocoding, map integration, and ongoing maintenance. Walking time estimation adds complexity.

**Tradeoffs:**
- Building data collection is a one-time high effort per campus. Could crowdsource from users ("Is this location correct?") or partner with UB facilities.
- Indoor navigation is very hard. Start with building-level, add room-level as data improves.
- Map integration requires a mapping provider (Mapbox, Google Maps). Costs scale with usage.
- Stale data risk: rooms get renamed, buildings get renovated. Need a refresh mechanism.

---

### 10. Co-Hosted Events

**Problem:** Campus events are often collaborations between multiple orgs. "CS Club x Engineering Society Hackathon" currently has to be posted in one space only, missing half the potential audience.

**Shape:**
- When creating an event, "Add co-host" option to invite another space
- Co-host admin receives request, approves or declines
- Approved event appears in both spaces' event lists
- Combined RSVP count with per-space breakdown: "45 going (28 from CS Club, 17 from Engineering Society)"
- Both spaces can send reminders and post recaps
- Event card shows both space logos/names
- Co-host permissions: edit event, view RSVPs, send reminders. Cannot delete event or remove primary host.
- Discovery: co-hosted events rank higher in event discovery (more social proof)

**Wedge:** Cross-space events create network effects. A member of CS Club who attends a co-hosted event meets Engineering Society members, potentially joining that space too. This turns events from single-space engagement into cross-pollination moments. No existing campus tool facilitates this -- orgs coordinate via email and post separately.

**Impact:** High. Creates cross-space connections that strengthen the overall network. Increases event visibility by 2x. Demonstrates platform value that single-org tools can't provide.

**Effort:** Medium-High. Need event references in multiple spaces, merged RSVP views, co-host permission model, and cross-space notification logic. The flat `/events` collection helps (event exists once, multiple spaces reference it).

**Tradeoffs:**
- Co-host approval flow adds latency. The requesting space creates the event, but it doesn't appear in the co-host space until approved. Could show "pending co-host" status.
- Attribution disputes: whose event is it? Primary host has ultimate control, co-hosts have edit access. Clear hierarchy prevents conflicts.
- Notification duplication: a student in both spaces shouldn't get notified twice. Need deduplication logic.
- If co-hosting is too easy, every event becomes a 5-space co-host. Limit to 3 co-hosts per event.

---

### 11. Event Feedback & Ratings

**Problem:** Leaders have no signal on event quality. Attendance tells you who showed up, not whether they had a good time. No mechanism to improve events over time based on participant feedback.

**Shape:**
- 30 minutes after event ends, attendees get a feedback prompt
- Quick feedback: 1-5 star rating + optional one-line comment
- Sentiment options: "Loved it" / "It was good" / "Could be better" / "Not for me"
- "What would make this better?" free-text (optional, max 200 chars)
- Leaders see aggregate scores per event: avg rating, sentiment breakdown, comments
- Trend over time: "Your events are trending up in satisfaction"
- Low-score alerts: "Your last event scored 2.1/5. Here are some ideas to improve."
- Feedback is anonymous by default (leader sees aggregate, not individual responses)

**Wedge:** Feedback loops are how events get better. A leader who sees "3.2/5, most common feedback: 'started late'" can fix that next time. This is the data flywheel -- more events create more feedback, more feedback creates better events, better events create more attendance.

**Impact:** Medium. Doesn't directly drive attendance but improves event quality over time, which indirectly drives retention. Creates data that leaders genuinely want.

**Effort:** Low-Medium. Feedback form is simple. Aggregate scoring is a Cloud Function. Trend calculation requires historical data. Alert logic is straightforward.

**Tradeoffs:**
- Anonymous feedback can be mean. Consider sentiment filtering or flagging hostile comments.
- Low response rates are common for feedback. Make it frictionless -- a single tap for star rating, everything else optional.
- Feedback on bad events might discourage leaders. Frame it as growth, not criticism. "Your events are improving" narrative.
- Some events don't warrant feedback (casual hangouts). Only prompt for events with 5+ attendees.

---

### 12. Event Announcements & Updates

**Problem:** Event details change -- venue moves, time shifts, event gets cancelled. Currently, the only way to communicate changes is editing the event and hoping people check. No proactive notification to RSVPed attendees.

**Shape:**
- "Send Update" button on event management page
- Update types: Venue change, Time change, Cancellation, General update
- All RSVPed users (going + maybe) receive push notification with change details
- Cancelled events show clear "CANCELLED" badge, don't disappear
- Venue/time changes show diff: "Changed from Baldy 200 to Baldy 101"
- Update history visible on event detail page
- "Important update" flag for critical changes (venue/time/cancellation) vs. general updates
- Leader can send a message to all attendees without editing the event itself

**Wedge:** This is a communication channel that only works because HIVE knows who RSVPed. GroupMe can broadcast, but it broadcasts to everyone, not just attendees. HIVE can target "people who said they're going to Friday's event" specifically. That precision is new.

**Impact:** High. Directly prevents the worst event experience: showing up to a cancelled event or going to the wrong room. Trust in the platform increases when it proactively communicates changes.

**Effort:** Low. The notification infrastructure exists. Need a UI for composing updates and a filter for "all RSVPed users." Event edit history is a simple changelog.

**Tradeoffs:**
- Over-communication risk. Leaders who send 5 updates about their bake sale create notification fatigue. Limit to 3 updates per event, or require escalating confirmation for >3.
- Cancellation handling is tricky -- should cancelled events free up the calendar slot immediately? Should waitlisted events from the same time get promoted? Lots of edge cases.
- "Send message to attendees" is powerful but could be abused (spam). Rate limit and require admin role.

---

### 13. Calendar Event Creation

**Problem:** The calendar page is read-only. Students can see their events but can't create events from the calendar view. This is unintuitive -- clicking an empty time slot should let you create an event.

**Shape:**
- Click/tap empty time slot on calendar to start event creation
- Pre-fills date and time from the clicked slot
- Space picker: "Which space is this for?" (list user's spaces where they have admin role)
- Quick creation for casual events (title + time + space only)
- Full creation for formal events (all fields)
- Drag to set duration on week/day view
- "Block personal time" feature (not an event -- just a calendar block visible only to user)
- Visual distinction: HIVE events (colored by space) vs. personal blocks (gray)

**Wedge:** Calendar-first event creation is how people think about scheduling. "I have a free slot Tuesday 3-5pm, let me create a study session" is a natural workflow. Forcing users to navigate to a space, then to events, then create -- that's a tool-centric flow. Calendar creation is a user-centric flow.

**Impact:** Medium. Quality-of-life improvement for leaders who create events frequently. Doesn't drive new user acquisition but improves daily utility for existing users.

**Effort:** Medium. The event creation API exists. Need to embed the creation flow in the calendar UI, add space picker, and handle the interaction design for click-to-create on mobile vs. desktop.

**Tradeoffs:**
- "Which space?" picker adds friction. Could default to the user's most active space, or skip it for personal blocks.
- Mobile calendar creation is hard -- small tap targets, no drag. Consider a "+" button that opens a bottom sheet instead of click-on-slot.
- Personal time blocks are scope creep for an event-focused feature. Could defer to "calendar intelligence" track.

---

### 14. Social RSVP Visibility

**Problem:** Students don't know if their friends are going to an event. RSVP decisions are made in isolation. Social proof -- "3 of your friends are going" -- is the strongest driver of attendance, and HIVE doesn't surface it.

**Shape:**
- Event card shows friend avatars: "[Photo] [Photo] [Photo] and 5 others going"
- "See who's going" expands to full attendee list (respecting ghost mode)
- "Invite a friend" -- share event with a specific connection: "Come with me to this!"
- RSVP visibility settings per user: "Show my RSVPs to: Everyone / Friends only / No one"
- "Your friend [Name] just RSVPed to [Event]" notification (opt-in)
- Explore page: "Popular with your friends" events section
- Group RSVP: "Going with [friend name]" -- creates a social commitment

**Wedge:** Social proof drives attendance more than event descriptions. "Sarah and Mike are going" converts a "maybe" to "going" faster than any amount of event marketing. This is the network effect applied to events. GroupMe can't do this because it doesn't know your social graph. Instagram can't do this because it doesn't have structured event data.

**Impact:** Very High. Directly increases attendance. Creates viral loops (friend RSVPs trigger friend notifications). Makes RSVP data more valuable by making it visible.

**Effort:** Medium. Friend graph exists (connections collection). Need to join RSVP data with connection data. Privacy controls add complexity. "Invite a friend" is a notification + deeplink.

**Tradeoffs:**
- Privacy is the biggest risk. Some students don't want others to know their plans. Default RSVP visibility to "Friends only" and make it easy to change.
- "Your friend just RSVPed" notifications could feel stalky. Make this opt-in, never opt-out.
- Ghost mode users must be invisible in attendee lists. Need to filter ghost mode users consistently.
- Group RSVP ("going with [friend]") creates dependency -- what if the friend cancels? The student should be notified and asked to re-confirm.

---

### 15. Leader Coordination Dashboard

**Problem:** Event organizers coordinate logistics through a patchwork of tools: Google Sheets for task lists, Venmo for collecting money, GroupMe for volunteer coordination, email for room booking. HIVE could own the organizer workflow.

**Shape:**
- Pre-event checklist: customizable task list per event (book room, order food, set up, etc.)
- Assign tasks to other admins/moderators within the space
- Volunteer sign-up: "We need 3 people to help set up at 5pm"
- Budget tracker: expected costs, actual costs, who paid what
- Day-of timeline: hour-by-hour run of show
- Supply checklist: "Bring: projector, name tags, snacks"
- Post-event debrief: what went well, what to improve, action items for next time
- Templates for common event types: "Hackathon needs: judges, prizes, food, rooms, wifi, power strips"

**Wedge:** This targets the org president/VP -- the person who does the most work and gets the least help. If HIVE makes their job easier, they become HIVE evangelists who bring their entire org. This is the "B2B" play in a B2C platform: sell to the leader, get the members for free.

**Impact:** Medium-High. Creates workflow lock-in for leaders. Once your event checklists, budgets, and debriefs are in HIVE, switching platforms means losing operational history. Directly serves the "coordination tax" problem.

**Effort:** High. This is essentially a lightweight project management tool within the events system. Task assignment, budget tracking, and volunteer management are each non-trivial features. Could ship incrementally.

**Tradeoffs:**
- Feature bloat risk. This could turn the events tab into a full project management suite. Need ruthless scoping -- start with checklist + volunteer sign-up only.
- Budget tracking involves money, which involves trust and potentially legal complexity. Could be as simple as a shared expense list (no actual payments).
- Volunteer sign-up could cannibalize the chat use case ("who can help set up?" is currently asked in chat). But structured sign-up is better than chat messages that get buried.
- This is the feature most likely to be "nice to have" rather than "must have." Ship the checklist, measure usage, then decide on budget/volunteer features.

---

## Quick Wins (Ship in Days)

**1. Event Reminders (Core)**
Add a Cloud Function that queries upcoming events, finds users who RSVPed "going" or "maybe," and creates reminder notifications 2 hours before and at event start time. Store `reminderSent` flag on RSVP doc to prevent duplicates. The notification service and push infrastructure already exist.

**2. Event Update Notifications**
When an organizer edits an event's time, location, or status (cancelled), automatically notify all RSVPed users. This is a Firestore trigger on the events collection + a batch notification. No new UI needed -- the notification appears in the existing notification bell.

**3. Waitlist When Full**
Add a `waitlisted` status to the existing RSVP route. When `maxAttendees` is reached and someone tries to RSVP "going," offer "Join Waitlist" instead of "Event is full." When someone cancels, promote the first waitlisted user. Simple state machine on top of existing RSVP logic.

**4. Clone Event**
"Create similar event" button on past events. Pre-fills all fields from the source event, clears the date. This is a client-side copy operation -- no API changes needed, just a UI button that opens the creation form with pre-populated data.

**5. Cancelled Event Badge**
When an event status changes to "cancelled," show a clear red "CANCELLED" badge. Don't remove the event from feeds -- removing it causes confusion ("was there an event? I thought there was"). Keep it visible with the badge.

---

## Medium Bets (Ship in Weeks)

**1. Recurring Event Engine**
RRULE-based recurrence with instance generation. Weekly/biweekly/monthly presets first, custom RRULE later. Cloud Function generates instances 4 weeks ahead. Series editing UI. This unlocks the single strongest retention loop: predictable, rhythm-based engagement.

**2. Event Discovery Feed**
Dedicated `/explore/events` page using the existing personalized events API. Filter by time range, type, free/paid. Social proof badges ("3 friends going"). RSVP directly from the feed. Cross-sells to space membership.

**3. Post-Event Recaps**
Post-event prompt to organizer. Quick recap form (attendance, highlight, photos). Recap card in space feed. Photo albums in space media section. Shareable recap card for Instagram distribution.

**4. Attendance Check-In**
QR code / 4-digit code check-in system. Time-windowed validation. Attendance vs. RSVP dashboard for leaders. CSV export for Student Affairs. Streak tracking for attendees.

**5. Quick Event Creation**
Simplified in-chat event creation. Three fields (what, when, where). Event card in chat feed with inline RSVP. Smart defaults. Location autocomplete with campus buildings.

---

## Moonshots (Ship in Months+)

**1. Campus Building Intelligence**
Full campus building database with geocoding, room-level data, indoor photos, accessibility info, walking time estimates, and crowd-sourced corrections. This is a data moat that takes months to build but becomes an unfair advantage once established.

**2. Smart Event Scheduling**
AI-powered scheduling that considers: when your members are typically active, competing events on campus, room availability (university integration), weather for outdoor events, academic calendar (don't schedule during finals). "Best time to host" recommendations for leaders.

**3. Event Sponsorship & Ticketing**
Paid events with Stripe integration. Sponsorship marketplace where local businesses sponsor events (pizza for study sessions, prizes for hackathons). Revenue share model. This turns HIVE from a cost center into a revenue generator for student orgs.

**4. University Integration Layer**
Direct integration with UB's room booking system, event approval workflow, Student Affairs reporting, and dining services ordering. This is the ultimate lock-in: when HIVE IS the official event platform, not just a parallel one.

**5. Cross-Campus Events**
Events shared across HIVE campuses. "Intercollegiate Hackathon" visible to students at UB, RIT, Syracuse. This creates cross-campus network effects and is a growth mechanism for expanding to new universities.

---

## Competitive Analysis

### Google Calendar
**Strengths:** Universal, syncs everywhere, smart scheduling, natural language input, reminders.
**Structural weakness:** No social graph. Google Calendar doesn't know who your friends are, what spaces you belong to, or what your campus interests are. It can't show "3 friends going." It can't recommend events. It's a personal tool, not a community tool. Also: no campus building intelligence, no attendance tracking, no RSVP management.
**What they'd have to change to compete:** Build a social layer + campus-specific context. This is incompatible with their "universal tool" positioning.

### When2Meet
**Strengths:** Dead simple for finding mutual availability. Well-known on campuses.
**Structural weakness:** Terminates at scheduling. When2Meet finds a time, then you go somewhere else to create the event, send the invite, track RSVPs, and do everything else. It's a point solution for one step of the coordination workflow. No community context, no recurring events, no attendance, no discovery.
**What they'd have to change to compete:** Become a full event platform. That's a different product entirely.

### Eventbrite
**Strengths:** Ticketing, discovery, marketing tools, analytics.
**Structural weakness:** Designed for public events with ticket sales. Campus events are mostly free, membership-based, and recurring. Eventbrite's business model (fees on ticket sales) doesn't align with free student events. No campus context, no space/community layer, no social graph. The overhead of creating an Eventbrite event is enormous for a weekly club meeting.
**What they'd have to change to compete:** Build a free tier for recurring community events + campus-specific features. Their investors would hate the margin compression.

### Facebook Events
**Strengths:** Social proof (friends going), discovery, reminders, massive user base.
**Structural weakness:** Students don't use Facebook. Gen Z engagement on Facebook is cratering. The Events feature is strong but lives in a platform students have abandoned. Facebook Events also lacks campus context, attendance tracking, org management, and recurring event automation.
**What they'd have to change to compete:** They tried with Facebook Campus (2020) and shut it down. They can't compete on campus because students don't want to be on Facebook.

### CampusGroups / Engage / Presence (University Platforms)
**Strengths:** Official university integration, mandatory for recognized orgs, room booking, funding requests, Student Affairs reporting.
**Structural weakness:** Designed for university administrators, not students. The UX is institutional -- form-heavy, bureaucratic, slow. No social features, no chat, no discovery feed, no mobile-first design. Students use them because they have to, not because they want to. These platforms optimize for compliance, not engagement.
**What they'd have to change to compete:** Rebuild from scratch as a student-first product. Their buyers (university administrators) don't want that -- they want compliance tools.

**HIVE's unique position:** The only tool that combines community (Spaces + chat), events (creation + RSVP + discovery), social (friends going + interest matching), and campus context (building intelligence + academic calendar) in one platform that students actually want to use. The competitive gap is integration, not any single feature.

---

## Wedge Opportunities

### Wedge 1: "What's Happening Tonight?"
**Entry point:** A student downloads HIVE to find out what's happening on campus tonight.
**First value:** Personalized event feed shows 3 events matching their interests, with social proof.
**Hook:** RSVP to one event, get a reminder, show up, meet people.
**Expansion:** Join the space that hosted the event. Discover more spaces. Create your own events.
**Why it works:** Urgency (tonight), specificity (personalized), low commitment (just show up).

### Wedge 2: "Make My Org's Events Actually Work"
**Entry point:** An org president is frustrated that nobody shows up to events despite posting on Instagram.
**First value:** Event creation with RSVP tracking, reminders, and attendance check-in.
**Hook:** See that 40% more people attend when they get reminders. Get attendance data for Student Affairs.
**Expansion:** Use chat, boards, automations. Bring entire e-board onto HIVE.
**Why it works:** Targets the person with the most pain (leader), solves their #1 problem (attendance), gives them data they need (Student Affairs reporting).

### Wedge 3: "Never Miss Your Weekly Meeting Again"
**Entry point:** A student joins 3 spaces with weekly recurring events.
**First value:** All recurring events automatically on their HIVE calendar with reminders.
**Hook:** HIVE becomes their "campus schedule" alongside their class schedule.
**Expansion:** Discover events from other spaces. Use calendar for personal time blocking. Check HIVE daily.
**Why it works:** Recurring events create habit. Habit creates retention. Retention creates Weekly Active Spaces.

---

## Open Questions

**1. Should events exist independent of spaces?**
Currently, every event belongs to a space. But what about campus-wide events (orientation, career fairs, basketball games) that aren't tied to a student org? Options: create a "Campus Events" official space, allow admin-created campus-wide events, or keep events strictly space-bound and let university admins create official spaces.

**2. Who can create events -- admins only or all members?**
Currently admin-only. But study groups, casual hangouts, and pickup games are organized by regular members. Options: all members can create quick events, only admins can create formal events. Or: permission setting per space ("Who can create events: Admins / Members / Everyone").

**3. How does Google Calendar sync work in practice?**
The OAuth routes exist but return 503. Questions: one-way (HIVE -> Google) or two-way? What about students who use Apple Calendar? Should HIVE events automatically appear in external calendars via .ics subscription link? An .ics feed URL per user is lower effort than full OAuth sync and works with every calendar app.

**4. What's the privacy model for event attendance data?**
Attendance records are valuable for leaders and Student Affairs. But do students consent to their attendance being tracked and reported? Need clear consent at check-in, data retention policy, and transparency about who sees attendance data. FERPA may apply.

**5. How do we handle event spam?**
If every member can create quick events, a bad actor could flood a space with fake events. Rate limiting (5 events/day/user/space) is necessary. Moderation tools for leaders to remove events. Report mechanism for members.

**6. Should RSVP decisions be public by default?**
Social proof ("3 friends going") requires RSVP visibility. But some students prefer privacy. The default setting matters enormously -- public-default drives attendance but may deter RSVPs from privacy-conscious students. Friends-only-default is the safest middle ground.

**7. What happens to event data when a space is archived?**
Events are in a flat collection with `spaceId` reference. If a space is archived, should its events: disappear from calendars? Become read-only? Transfer to a campus archive? This affects the "community memory" story.

**8. Is there a market for "event as a service" for university admin?**
If HIVE becomes the de facto event platform, the university itself might want to use it for official events (orientation, commencement, career fairs). This changes the business model and the user base. Worth exploring, but not before the student use case is rock solid.

**9. How do we measure the RSVP-to-attendance gap?**
This is the core metric for event health, but measuring it requires both RSVP data (digital) and attendance data (physical). Without check-in, we can't measure it. Check-in adoption is therefore a prerequisite for understanding event effectiveness. How do we incentivize check-in without making it mandatory?

**10. What's the minimum event infrastructure for launch?**
The current event system (CRUD + RSVP + calendar + personalized feed) is functional. Is it enough for launch, or do we need reminders + recurring as table stakes? The answer depends on whether events are a primary launch feature or a supporting feature behind Spaces and Chat.
