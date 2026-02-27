# Environment Variables — Launch Checklist

Everything that must be set before real users can use HIVE.

## Critical (blocks core functionality)

| Variable | Purpose | Required |
|----------|---------|----------|
| `SESSION_SECRET` | JWT signing (≥32 chars) | Yes |
| `RESEND_API_KEY` or `SENDGRID_API_KEY` | Email delivery (OTP codes + notification emails) | Yes — one of these |
| `GROQ_API_KEY` | AI code generation (HiveLab) | Yes |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client SDK config (apiKey, authDomain, projectId, etc.) | Yes |
| `FIREBASE_SERVICE_ACCOUNT` or `GOOGLE_APPLICATION_CREDENTIALS` | Firebase Admin SDK | Yes |

## Deployment Prerequisites

| Action | Purpose |
|--------|---------|
| `firebase deploy --only firestore:indexes` | Composite indexes — without these, queries fail and signups are blocked |
| `firebase deploy --only firestore:rules` | Security rules for production |
| Verify `HIVE_DEV_BYPASS` is NOT set in production | Dev bypass skips auth — must be off |

## Optional (enhances functionality)

| Variable | Purpose |
|----------|---------|
| `FCM_SERVER_KEY` or `FIREBASE_MESSAGING_*` | Push notifications via FCM |
| `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` | Background job processing (notification delivery, automations) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics |
| `SENTRY_DSN` | Error tracking |

## Verify After Deploy

1. Sign up with a real `@buffalo.edu` email — OTP should arrive
2. Create an app in HiveLab — AI generation should work
3. Follow a user — notification should appear in their notification list
4. Check Firestore console for `notifications` collection activity
