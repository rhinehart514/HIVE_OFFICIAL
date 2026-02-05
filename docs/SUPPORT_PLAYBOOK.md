# HIVE Support Playbook

**Audience:** Support operators, founding team, anyone handling user-facing issues during UB launch.
**Last updated:** 2026-02-04
**Platform:** hive.college | UB Buffalo campus

---

## Table of Contents

1. [User-Facing FAQ](#1-user-facing-faq)
2. [Operational Runbooks](#2-operational-runbooks)
3. [Error Message Guide](#3-error-message-guide)
4. [Escalation Matrix](#4-escalation-matrix)

---

## 1. User-Facing FAQ

### Getting Started

**Q: What is HIVE?**
HIVE is a campus platform where students find their people, join real communities (called Spaces), and do things together. It is not a social feed -- it is a place to join clubs, project teams, study groups, and campus organizations.

**Q: Who can join HIVE?**
HIVE is currently available to students at the University at Buffalo. You must have a valid `@buffalo.edu` or `@ub.edu` email address to sign up. Other schools will be added over time.

**Q: My school isn't on HIVE yet. Can I still join?**
Not yet, but you can join the waitlist. When you enter your school email during sign-up, HIVE will detect your school and offer a waitlist option. You will be notified when your campus goes live.

**Q: How do I sign up?**
1. Go to hive.college
2. Enter your `@buffalo.edu` email
3. Check your email for a 6-digit verification code
4. Enter the code
5. Set your name (your handle is generated automatically)
6. Select your graduation year
7. Optionally add your major
8. Pick 2-5 interests
9. You are in -- HIVE recommends Spaces based on your interests and auto-joins you

### Verification & Login

**Q: I didn't get my verification code.**
Check these in order:
1. **Spam/Junk folder** -- the email comes from `hello@hive.college` with subject "Your HIVE verification code"
2. **Correct email** -- make sure you entered your `@buffalo.edu` address, not a personal email
3. **Wait 2 minutes** -- email delivery can sometimes take a moment
4. **Tap "Resend code"** -- this generates a fresh code and invalidates the old one
5. **Rate limit** -- if you requested too many codes (more than 5 in 5 minutes), wait 5 minutes before trying again

If none of these work, contact support. The code expires after 10 minutes.

**Q: My verification code isn't working.**
- Make sure you are entering all 6 digits with no spaces
- The code expires after **10 minutes** -- request a new one if it has been longer
- You get **5 attempts** per code. After 5 wrong entries, the code is burned and you must request a new one
- After too many failed attempts, you are locked out for **60 seconds**. Wait, then request a fresh code
- If you requested a new code, the old one no longer works. Use the most recent code only

**Q: I keep getting "Too many attempts" when trying to log in.**
HIVE has rate limiting to protect accounts. If you hit a limit:
- **Code requests:** Max 5 per 5-minute window. Wait 5 minutes.
- **Code verification:** Max 5 wrong entries per code. Request a new code.
- **Lockout:** After too many failed verifications, you are locked out for 60 seconds.
- **Global rate limit:** If you see "Rate limit exceeded," wait a few minutes and try again.

**Q: I'm getting "Your session expired" -- what do I do?**
Your login session lasts up to 30 days. If it expires or is revoked:
1. You will be redirected to the sign-in screen
2. Enter your email and verify with a new code
3. All your Spaces, messages, and data are still there -- you just need to re-authenticate

**Q: Can I use a personal email (Gmail, iCloud, etc.)?**
No. HIVE requires a campus email (`@buffalo.edu` or `@ub.edu`) to verify you are a real student. This is how HIVE keeps the community authentic.

### Handles & Identity

**Q: How is my handle created?**
Your handle is auto-generated from your first and last name (e.g., "Jane Doe" becomes `janedoe`). During sign-up, HIVE checks if this handle is available. If it is taken, the system generates up to 8 alternative suggestions (adding numbers or abbreviations).

**Q: Someone took the handle I wanted.**
Handles are first-come, first-served and must be unique across HIVE. During sign-up, if your preferred handle is taken, you will see suggested alternatives. Pick one that works for you. You can change your handle once for free after sign-up.

**Q: Can I change my handle after signing up?**
Yes. Your first handle change is free. After that, you can change it once every 6 months. Go to your profile settings to make the change.

**Q: What are the rules for handles?**
- 3 to 20 characters
- Letters, numbers, periods, underscores, and hyphens only
- Cannot start or end with a special character (`.`, `_`, `-`)
- No consecutive special characters (`..`, `__`, `--`)
- Cannot use reserved words (`admin`, `support`, `hive`, `test`, etc.)

**Q: Can I change my display name?**
Your display name (first and last name) is set during sign-up. Contact support if you need to update it.

### Spaces

**Q: Why can't I see Spaces from other schools?**
HIVE enforces **campus isolation**. You can only see, join, and interact with Spaces at your own campus (UB Buffalo). This is a core privacy and community design decision, not a bug. When HIVE expands to more campuses, each campus remains its own world.

**Q: How do I join a Space?**
- **Public Spaces:** Tap "Join" on the Space card from Explore or Home. You are in immediately.
- **Private Spaces:** Tap "Request to Join." The Space leader reviews and approves or denies your request.

**Q: My join request is stuck / hasn't been answered.**
Private Space join requests are reviewed by Space leaders (not HIVE staff). If your request has been pending for a while:
1. The Space leader may not have seen it yet
2. Check if the Space is still active (look for recent activity)
3. Try reaching out to the Space leader through another Space you share

**Q: I can't send messages in a Space.**
Check these:
- Are you a member? Non-members cannot chat. Join the Space first.
- Is your session active? If you see errors, try refreshing or signing in again.
- Is the Space set to a mode where only leaders can post? Some Spaces restrict who can send messages.
- Check your internet connection -- messages require an active connection (there is no offline message queue yet).

**Q: My messages aren't appearing / seem stuck.**
- **Refresh the page** -- the message may have sent but the UI did not update
- **Check your connection** -- messages require internet. If you lose connection mid-send, the message may not have been delivered (offline retry is not yet implemented)
- **Duplicate messages** -- if you tapped send multiple times quickly, you may see duplicates. This is a known issue being addressed

### Notifications

**Q: I'm not getting notifications.**
Check your notification preferences:
1. Go to Settings
2. Ensure notifications are **globally enabled**
3. Check that the specific category is enabled (Social, Spaces, Events, etc.)
4. Check **Quiet Hours** -- if you set quiet hours (e.g., 10 PM - 8 AM), notifications are silenced during that window
5. Check if you muted the specific Space -- muted Spaces suppress all notifications

**Q: How do I mute a Space?**
Open the Space, go to its settings, and toggle "Mute notifications." You can set a duration or mute indefinitely. You will still see messages when you visit the Space, but you will not receive push or in-app notifications.

**Q: My notification badge shows the wrong count.**
This is a known issue. Unread counts are recomputed on each page load and may temporarily show incorrect numbers, especially across multiple browser tabs. Refreshing the page will update the count.

### Profile & Account

**Q: How do I delete my account?**
Account deletion is permanent and cannot be undone.
1. Go to Settings
2. Initiate account deletion (a confirmation token is generated, valid for 15 minutes)
3. Type "DELETE MY ACCOUNT" exactly as shown
4. Confirm with the token

This deletes your profile, privacy settings, notification preferences, presence data, FCM tokens, and Space memberships. Your posts are anonymized (attributed to "deleted_user") rather than removed, to preserve conversation context. Your Firebase Auth account is also deleted.

**Q: What happens to my data when I delete my account?**
- **Deleted permanently:** Profile, privacy settings, notification preferences, presence data, push notification tokens, Space memberships
- **Anonymized:** Posts and messages you wrote remain visible but are attributed to "deleted_user" with no link back to you
- **Not reversible:** Once confirmed, deletion cannot be undone

**Q: What is Ghost Mode?**
Ghost Mode hides your online status and activity from other users. You can toggle it in Settings. Note: Ghost Mode currently persists the toggle but real-time privacy enforcement is still being completed.

**Q: Why do I see "Spaces" recommended to me?**
After you complete sign-up, HIVE recommends Spaces based on your selected interests and major. The algorithm scores Spaces by relevance to your profile. You are auto-joined to the top matches to give you an immediate starting point.

### HiveLab & Tools

**Q: What is HiveLab?**
HiveLab is where builders create interactive tools for Spaces -- polls, sign-ups, trackers, and more. Tools are built from 27 composable elements and can be deployed to any Space.

**Q: I deployed a tool but it doesn't seem to do anything.**
If your tool uses automations (triggers, scheduled actions), be aware that automation execution is not yet live. The tool stores the automation rules, but they do not fire automatically. This feature is in development.

---

## 2. Operational Runbooks

---

### Incident: User can't log in

**Symptoms:** User reports being unable to sign in. May see "Authentication required," "Invalid or expired token," or a blank screen after entering email.

**Diagnosis Steps:**
1. Ask: Are they using their `@buffalo.edu` email? Personal emails will be rejected with `UNSUPPORTED_DOMAIN`.
2. Ask: Are they an existing user or signing up for the first time?
3. Check: Is the user hitting a rate limit? (5 code requests per 5 minutes, 5 verification attempts per code)
4. Check: Has the user been locked out? (60-second lockout after 5 failed code entries)
5. Check: Is the session cookie (`hive_session`) being set? Browser privacy settings or extensions can block cookies.
6. Check Vercel logs for `verify-code` or `send-code` errors.

**Resolution:**
- **Wrong email domain:** Instruct user to use `@buffalo.edu` or `@ub.edu`.
- **Rate limited:** Tell user to wait 5 minutes, then try again.
- **Locked out:** Tell user to wait 60 seconds, then request a new code.
- **Cookie blocked:** Instruct user to disable ad blockers or privacy extensions for hive.college.
- **Session expired:** Instruct user to sign in again with a fresh code.

**Escalation:** If Vercel logs show `SERVICE_UNAVAILABLE` (Firebase down), `email_send_failed` (Resend/SendGrid both failing), or persistent `INTERNAL_ERROR` on verify-code -- escalate to engineering.

---

### Incident: OTP code not received

**Symptoms:** User enters email, taps send, sees success message ("Code sent"), but never receives the email.

**Diagnosis Steps:**
1. Confirm user checked spam/junk folder.
2. Confirm email address is correct and is `@buffalo.edu`.
3. Check Vercel function logs for `/api/auth/send-code`:
   - Look for `Resend API response` log entry -- does it show `hasData: true`?
   - Look for `Resend email failed` or `SendGrid email failed` entries.
   - Look for `email_rate_limit` -- user may have exceeded 10 codes/hour per email.
4. Check Resend dashboard (resend.com) for delivery status of the specific email.
5. Check if `ACCESS_GATE_ENABLED` is true and the user's email is not on the whitelist (`access_whitelist` collection in Firestore).

**Resolution:**
- **Spam folder:** User marks `hello@hive.college` as safe and requests a new code.
- **Email provider issue:** Check Resend dashboard for bounces or delivery failures. If Resend is down, the system falls back to SendGrid automatically.
- **Rate limited (per-email):** User must wait for the hourly window to reset (up to 60 minutes).
- **Access gate blocking:** If `ACCESS_GATE_ENABLED` is true, add the user's email to the `access_whitelist` Firestore collection with `active: true`.
- **Domain not verified in Resend:** If logs show "verify a domain" error, verify `hive.college` domain in Resend dashboard.

**Escalation:** If both Resend and SendGrid are failing simultaneously, or if the `RESEND_API_KEY` / `SENDGRID_API_KEY` environment variables are missing in Vercel -- escalate to engineering immediately.

---

### Incident: Handle collision during sign-up

**Symptoms:** User completes naming step, reaches interests selection, taps "Enter HIVE," and sees "That handle was just taken. Pick one of these:" with a list of alternatives.

**Diagnosis Steps:**
1. This is expected behavior, not a bug. Another user claimed the same handle between the availability check and the completion attempt.
2. Verify the user sees suggested alternatives (up to 8 options).
3. If no suggestions appear, check Vercel logs for `complete-entry` errors.

**Resolution:**
- **Normal flow:** User taps one of the suggested handles and completes entry.
- **User refuses all suggestions:** They can go back to the naming step, change their name slightly, and try again.
- **No suggestions appear:** Check if the handle service (`/api/auth/check-handle`) is returning errors. Escalate if Firestore is unreachable.

**Escalation:** Only if the `complete-entry` API is returning `INTERNAL_ERROR` or if the Firestore transaction is consistently failing.

---

### Incident: User stuck in entry flow

**Symptoms:** User reports being unable to advance past a specific step in sign-up (gate, naming, field, or crossing phase).

**Diagnosis Steps:**
1. Identify which phase they are stuck on:
   - **Gate (email):** Cannot send code -- check email validation and domain support.
   - **Gate (code):** Cannot verify -- check code expiry (10 min), attempt count (max 5), lockout (60s).
   - **Gate (waitlist):** School not active -- this is correct behavior for non-UB emails.
   - **Naming:** Cannot advance -- first and last name are both required. Handle check must finish (not still "checking...").
   - **Field (year):** Graduation year is required.
   - **Field (major):** Major is optional -- user should be able to skip.
   - **Crossing (interests):** Must select 2-5 interests. Fewer than 2 blocks advancement.
2. Check browser console for JavaScript errors.
3. Check if the user's browser supports modern JavaScript (HIVE requires a modern browser).

**Resolution:**
- **Validation errors:** Guide user through the requirements for the current step.
- **Naming phase stuck on "Checking handle...":** The handle availability API may be slow or timing out. User can wait or refresh.
- **API error on completion:** Check Vercel logs for `complete-entry`. If Firestore transaction failed, user can retry.
- **Browser issue:** Recommend Chrome, Safari, or Firefox. Disable extensions that might interfere.

**Escalation:** If the `complete-entry` API consistently returns errors or if the entry flow is broken for all users -- escalate immediately.

---

### Incident: Can't join a Space

**Symptoms:** User taps "Join" on a Space but nothing happens, or they receive an error.

**Diagnosis Steps:**
1. Is the Space public or private?
   - **Public:** Join should be instant. If it fails, check API logs for `join-request` errors.
   - **Private:** A join request is created. The user must wait for leader approval.
2. Check if the user is already a member (UI should reflect this).
3. Check if the user already has a pending join request (duplicate requests can occur due to a known race condition on double-click).
4. Check if the Space belongs to the user's campus (`campusId` mismatch will return `CAMPUS_MISMATCH` / 403).

**Resolution:**
- **Already a member:** Refresh the page -- the UI may not have updated.
- **Pending request exists:** Inform user their request is pending leader review.
- **Campus mismatch:** This should not happen in normal flow. If it does, escalate.
- **API error:** Check logs. If `join-request` is failing, it may be a Firestore issue.

**Escalation:** If join requests are consistently failing or if duplicate join requests are causing issues -- escalate to engineering (known race condition in `join-request/route.ts`).

---

### Incident: Messages not appearing in Space chat

**Symptoms:** User sends a message but it does not appear in the chat feed. Or messages from others are not showing up.

**Diagnosis Steps:**
1. Is the user a member of the Space? Non-members cannot see or send messages.
2. Is the user's session still active? Check for `UNAUTHORIZED` errors in network tab.
3. Is the user's internet connection stable? Messages require an active connection.
4. Check if the message was sent (look for POST to `/api/spaces/[spaceId]/chat`).
5. Check if the message appears on refresh (could be a real-time sync issue).

**Resolution:**
- **Session expired:** User signs in again.
- **Connection issue:** User checks internet and retries.
- **Message sent but not visible:** Refresh the page. The real-time listener may have disconnected.
- **Duplicate messages:** If user tapped send multiple times, duplicates may appear. This is a known issue (no message idempotency keys yet).

**Escalation:** If chat is globally broken (no messages sending for any user), check Firestore status and Vercel function health. Escalate immediately.

---

### Incident: Notifications not received

**Symptoms:** User reports not getting notifications for Space activity, mentions, event reminders, etc.

**Diagnosis Steps:**
1. Check global notification preference: Settings > Notifications > Enabled.
2. Check category-specific preference (Social, Spaces, Events, etc.).
3. Check quiet hours setting -- notifications are suppressed during quiet hours.
4. Check if the specific Space is muted.
5. Check if the notification was created in Firestore (`notifications` collection).
6. Check if notification delivery succeeded (logs for `notification-delivery-service`).
7. Check for duplicate prevention -- HIVE suppresses duplicate notifications of the same type from the same actor within 1 hour.
8. Self-action suppression: Users do not receive notifications for their own actions.

**Resolution:**
- **Preferences disabled:** Guide user to enable the relevant notification category.
- **Quiet hours active:** Inform user about their quiet hours window.
- **Space muted:** Guide user to unmute the Space.
- **Notification created but not delivered:** Delivery service has no retry logic (known gap). The notification exists in Firestore but push/email delivery failed silently.
- **Duplicate suppression:** Expected behavior. The user will not get two identical notifications within an hour.

**Escalation:** If notifications are not being created at all (no documents in `notifications` collection), or if the delivery service is consistently failing -- escalate to engineering.

---

### Incident: Account deletion not working

**Symptoms:** User tries to delete their account but the process fails or the confirmation does not work.

**Diagnosis Steps:**
1. Did the user initiate deletion first? (POST to `/api/profile/delete` creates a confirmation token).
2. Is the confirmation token still valid? Tokens expire after **15 minutes**.
3. Did the user type "DELETE MY ACCOUNT" exactly (case-sensitive, no extra spaces)?
4. Check Vercel logs for `profile/delete` errors.

**Resolution:**
- **Token expired:** User must start the process over (POST again to get a new token).
- **Wrong confirmation text:** Must be exactly `DELETE MY ACCOUNT`.
- **API error:** Check Firestore access. The deletion involves multiple batch writes across collections.

**Escalation:** If the deletion batch write fails partway through (some data deleted, some not), escalate immediately -- this requires manual cleanup to complete the deletion.

---

### Incident: User is rate limited

**Symptoms:** User sees "Too many attempts" or "Rate limit exceeded" message.

**Diagnosis Steps:**
1. Identify which rate limit they hit:
   - **signinCode:** 5 code requests per 5 minutes
   - **signinVerify:** 5 verification attempts per 5 minutes
   - **Per-email:** 10 codes per email per hour
   - **Per-code:** 5 wrong entries per code
   - **Lockout:** 60-second lockout after burning a code
   - **API general:** 100 requests per minute per IP
   - **Chat:** 20 messages per minute per user
   - **Edge global:** 300 requests per minute, 30 per minute for sensitive endpoints

**Resolution:**
- Inform the user of the specific wait time.
- For code-related limits: wait 5 minutes and request a fresh code.
- For lockout: wait 60 seconds.
- For API general: wait 1 minute.
- If a legitimate user is repeatedly hitting rate limits, check if their IP is shared (campus WiFi can cause many students to share an IP). This is a known limitation of IP-based rate limiting.

**Escalation:** If rate limits are too aggressive for normal usage patterns at scale (e.g., entire dorm floor getting rate-limited from shared IP), escalate to engineering to adjust thresholds.

---

### Incident: Session expired unexpectedly

**Symptoms:** User was signed in, then suddenly gets redirected to sign-in or sees "Authentication required."

**Diagnosis Steps:**
1. Check how long the user has been signed in. Sessions last up to 30 days.
2. Check if the user cleared cookies or is using a privacy-focused browser.
3. Check if the session was revoked by an admin.
4. Check for clock skew on the user's device (JWT verification is time-sensitive).
5. Known gap: `MAX_REVOCATION_AGE` is 8 days but session max is 30 days. A session revoked after 8 days may not be caught for the remaining 22 days.

**Resolution:**
- **Normal expiry:** User signs in again.
- **Cookies cleared:** User signs in again.
- **Admin revocation:** Confirm with admin team. User signs in again.
- **Clock skew:** User should check their device's date/time settings.

**Escalation:** If sessions are expiring much sooner than 30 days for multiple users, or if token refresh is failing -- escalate to engineering.

---

## 3. Error Message Guide

### Authentication & Session Errors

| Error Code | HTTP Status | User-Facing Message |
|---|---|---|
| `UNAUTHORIZED` | 401 | "Your session has expired. Please sign in again." |
| `FORBIDDEN` | 403 | "You don't have permission to do this." |
| `CAMPUS_MISMATCH` | 403 | "This content belongs to a different campus. You can only access your own campus." |
| `CAMPUS_REQUIRED` | 403 | "We couldn't identify your campus. Make sure you signed in with your school email." |
| `TOKEN_INVALID` | 401 | "Your session is no longer valid. Please sign in again." |
| `TOKEN_EXPIRED` | 401 | "Your session has expired. Please sign in again." |
| `ACCESS_RESTRICTED` | 403 | "HIVE is currently in limited access. We're opening to student leaders first. Check back soon!" |

### Verification & OTP Errors

| Error Code | HTTP Status | User-Facing Message |
|---|---|---|
| `INVALID_CODE` | 400 | "That code isn't right. Check your email and try again. You have X attempts remaining." |
| `CODE_EXPIRED` | 400 | "Your code has expired. Tap 'Resend code' to get a new one. Codes are valid for 10 minutes." |
| `MAX_ATTEMPTS` | 429 | "Too many incorrect attempts. Please request a new code." |
| `RATE_LIMITED` | 429 | "Too many attempts. Please wait a few minutes before trying again." |
| `UNSUPPORTED_DOMAIN` | 403 | "This email isn't from a supported school. HIVE requires your campus email (e.g., @buffalo.edu)." |
| `SCHOOL_NOT_ACTIVE` | 403 | "Your school isn't on HIVE yet. Join the waitlist and we'll let you know when it launches!" |
| `INVALID_INPUT` | 400 | "Something doesn't look right. Please check your information and try again." |

### Handle Errors

| Error Code / Condition | User-Facing Message |
|---|---|
| Handle too short (< 3 chars) | "Your handle must be at least 3 characters." |
| Handle too long (> 20 chars) | "Your handle can't be more than 20 characters." |
| Invalid characters | "Handles can only contain letters, numbers, periods, underscores, and hyphens." |
| Starts/ends with special char | "Your handle can't start or end with a period, underscore, or hyphen." |
| Consecutive special chars | "Your handle can't have two special characters in a row." |
| Reserved word | "That handle is reserved and can't be used. Try something else." |
| Already taken | "That handle is taken. Here are some alternatives:" |
| `HANDLE_COLLISION` | "That handle was just taken by someone else. Pick one of these instead:" |
| Handle change cooldown | "You can change your handle once every 6 months. Next change available on [date]." |

### Space Errors

| Error Code | HTTP Status | User-Facing Message |
|---|---|---|
| `RESOURCE_NOT_FOUND` | 404 | "This Space doesn't exist or may have been removed." |
| `FORBIDDEN` (not a member) | 403 | "You need to join this Space first." |
| `RESOURCE_CONFLICT` | 409 | "You already have a pending request to join this Space." |

### Account Deletion Errors

| Error Code | HTTP Status | User-Facing Message |
|---|---|---|
| `NOT_FOUND` | 404 | "No pending deletion request found. Please start the process from Settings." |
| `INVALID_TOKEN` | 403 | "The confirmation link is invalid. Please start the deletion process again." |
| `EXPIRED` | 410 | "Your deletion request has expired (15-minute window). Please start again from Settings." |
| Confirmation text wrong | 422 | 'Please type "DELETE MY ACCOUNT" exactly as shown to confirm.' |

### System Errors

| Error Code | HTTP Status | User-Facing Message |
|---|---|---|
| `INTERNAL_ERROR` | 500 | "Something went wrong on our end. Please try again in a moment. If this keeps happening, let us know." |
| `SERVICE_UNAVAILABLE` | 503 | "HIVE is temporarily down for maintenance. We'll be back shortly." |
| `VALIDATION_ERROR` | 422 | "Some of the information you entered isn't quite right. Please check and try again." |
| `RESOURCE_LIMIT_EXCEEDED` | 429 | "You've reached a limit. Please wait before trying again." |

---

## 4. Escalation Matrix

### When does a support issue become an engineering issue?

| Severity | Criteria | Response Time | Who |
|---|---|---|---|
| **P0 -- Platform Down** | Login broken for all users. Chat not working for anyone. Firestore outage. Vercel functions returning 500 globally. | Immediate (< 15 min) | Engineering lead, on-call |
| **P1 -- Feature Broken** | OTP emails not sending (both Resend + SendGrid failing). Entry flow broken for new users. Session creation failing. Account deletion partially completing. | < 1 hour | Engineering |
| **P2 -- Degraded Experience** | Notifications not delivering (but created in Firestore). Chat messages occasionally duplicating. Rate limits too aggressive for campus WiFi. Unread counts drifting. | < 4 hours | Engineering |
| **P3 -- Edge Case / Polish** | Handle collision showing too many suggestions. Ghost mode not enforcing privacy. Stale presence data. Individual user cannot change handle. | Next business day | Engineering backlog |

### Escalation Decision Tree

```
User reports issue
  |
  +-- Can you resolve with FAQ / standard runbook?
  |     YES --> Resolve and close
  |     NO  --> Continue
  |
  +-- Is the issue affecting multiple users?
  |     YES --> P0 or P1, escalate immediately
  |     NO  --> Continue
  |
  +-- Is data integrity at risk? (partial deletion, orphaned records, etc.)
  |     YES --> P1, escalate immediately
  |     NO  --> Continue
  |
  +-- Is the issue a known limitation? (documented in TODO.md)
  |     YES --> Inform user, log as signal, P3
  |     NO  --> Continue
  |
  +-- Does the issue require database access or code changes?
        YES --> P2 or P3, file engineering ticket with:
                - User ID (if available)
                - Exact error message or code
                - Timestamp of the issue
                - Steps to reproduce
                - Vercel function logs (if accessible)
        NO  --> Re-evaluate -- may be a misunderstanding or UX issue
```

### Known Limitations to Communicate (Not Bugs)

These are documented system limitations. Inform the user and log as a signal if the issue is frequent:

| Limitation | Status | User-Facing Explanation |
|---|---|---|
| No offline message sending | P2 backlog | "Messages require an internet connection. If your connection drops, the message may not send. We're working on offline support." |
| Duplicate messages on double-tap | P1 backlog | "If you tapped send multiple times quickly, you may see duplicates. We're adding protection against this." |
| Unread count drift across tabs | P2 backlog | "Unread counts may not sync perfectly across browser tabs. Refresh to get the latest count." |
| No email notifications/digests | P3 backlog | "Email digests are not yet available. All notifications appear in the bell icon within HIVE." |
| Ghost mode toggle without enforcement | Debt | "Ghost mode saves your preference, but full privacy enforcement is still in development." |
| Automation triggers don't fire | P4 backlog | "Tool automations are stored but do not execute automatically yet. This feature is in development." |
| Join request race condition | P1 backlog | "In rare cases, a double-tap on 'Request to Join' can create duplicate requests. We're fixing this." |
| Cross-tab unread sync missing | P2 backlog | "Marking notifications as read in one tab may not immediately update other tabs." |

### Contact Channels

| Channel | Use For |
|---|---|
| In-app feedback | Feature requests, general feedback, non-urgent issues |
| Email (support@hive.college) | Account issues, deletion requests, urgent problems |
| Engineering Slack (#hive-support) | Escalated issues, P0/P1 incidents |
| Engineering Slack (#hive-alerts) | Automated alerts, Vercel errors, Firestore quotas |

---

## Appendix: Quick Reference

### Key Firestore Collections

| Collection | Purpose |
|---|---|
| `users` | User profiles, handles, campus membership |
| `handles` | Handle reservations (uniqueness enforcement) |
| `verification_codes` | OTP codes (hashed), pending/verified/burned status |
| `verification_lockouts` | Lockout tracking after failed attempts |
| `access_whitelist` | Gated launch email whitelist |
| `notifications` | All notification documents |
| `notificationPreferences` | Per-user notification settings |
| `deletion_requests` | Pending account deletion tokens |
| `spaceMemberships` | User-Space membership records |
| `schools` | Campus registry (domain, name, active status) |

### Key Environment Variables (for diagnosing email issues)

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Primary email provider for OTP codes |
| `SENDGRID_API_KEY` | Fallback email provider |
| `RESEND_FROM_EMAIL` | Sender address (default: `hello@hive.college`) |
| `NEXT_PUBLIC_ACCESS_GATE_ENABLED` | When `true`, only whitelisted emails can enter |

### Rate Limit Quick Reference

| Preset | Limit | Window |
|---|---|---|
| `signinCode` | 5 requests | 5 minutes |
| `signinVerify` | 5 requests | 5 minutes |
| `per-email codes` | 10 codes | 1 hour |
| `per-code attempts` | 5 wrong entries | per code |
| `lockout` | 60 seconds | after burning a code |
| `api (general)` | 100 requests | 1 minute |
| `chat` | 20 messages | 1 minute |
| `search` | 30 requests | 1 minute |
| `edge (global)` | 300 requests | 1 minute |
| `edge (sensitive)` | 30 requests | 1 minute |
