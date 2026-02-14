# Auth & Identity

## Entry Flow

```mermaid
flowchart TD
    Land([User hits landing page]) --> Enter[/enter page]
    Enter --> Email[Enter email address]
    Email --> EduCheck{Is .edu email?}
    
    EduCheck -->|Yes| SchoolDetect[Detect school from domain<br/>e.g. buffalo.edu → UB]
    EduCheck -->|No| Waitlist[Alumni/Non-.edu Waitlist<br/>POST /api/auth/alumni-waitlist]
    
    SchoolDetect --> SendOTP[Send 6-digit OTP<br/>POST /api/auth/send-code<br/>via Resend email]
    
    SendOTP --> RateCheck{Rate limited?}
    RateCheck -->|Yes| TooMany[429: Too many attempts]
    RateCheck -->|No| OTPSent[Code sent to email]
    
    OTPSent --> VerifyOTP[Enter code<br/>POST /api/auth/verify-code]
    VerifyOTP --> ValidCheck{Code valid?}
    
    ValidCheck -->|No| Retry[Try again<br/>Max 5 attempts]
    ValidCheck -->|Yes| AccountCheck{Account exists?}
    
    AccountCheck -->|Yes| Login[Login → JWT session]
    AccountCheck -->|No| CreateAccount[Create account<br/>POST /api/auth/complete-entry]
    CreateAccount --> Onboard[Onboarding flow<br/>Interests, major, year, housing]
    Onboard --> Login
    
    Login --> Shell[App Shell<br/>Campus-aware navigation]
    
    style Waitlist fill:#f90,color:#fff
    style TooMany fill:#f66,color:#fff
```

## Session Management

```mermaid
flowchart LR
    Login([Login]) --> JWT[JWT Token Created]
    JWT --> Cookie[Set HTTP-only cookie]
    JWT --> Firestore[Session stored in Firestore]
    
    Cookie --> Request[API Request]
    Request --> Validate[Validate JWT<br/>withAuthAndErrors middleware]
    Validate --> CSRF[Check CSRF token<br/>/api/auth/csrf]
    
    Firestore --> Sessions[/api/auth/sessions<br/>View active sessions]
    Sessions --> Revoke[Revoke session<br/>DELETE /api/auth/sessions/:id]
    
    JWT --> Refresh[Auto-refresh<br/>POST /api/auth/refresh]
```

## Auth Routes (17)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/send-code` | POST | Send OTP to .edu email |
| `/api/auth/verify-code` | POST | Verify OTP, create session |
| `/api/auth/complete-entry` | POST | Create account after first verify |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/refresh` | POST | Refresh JWT token |
| `/api/auth/logout` | POST | End session |
| `/api/auth/sessions` | GET | List active sessions |
| `/api/auth/sessions/[id]` | DELETE | Revoke specific session |
| `/api/auth/csrf` | GET | Get CSRF token |
| `/api/auth/check-handle` | GET | Check handle availability |
| `/api/auth/check-admin-grant` | GET | Check if user has admin grant |
| `/api/auth/health` | GET | Auth system health check |
| `/api/auth/alumni-waitlist` | POST | Join non-.edu waitlist |
| `/api/auth/verify-access-code` | POST | Verify special access codes |
| ~~`/api/auth/request-signin-code`~~ | — | *Deprecated (410)* |
| ~~`/api/auth/verify-signin-code`~~ | — | *Deprecated (410)* |
| ~~`/api/auth/session`~~ | — | *Deprecated (410)* |

## Campus Detection

```mermaid
flowchart TD
    Email[user@buffalo.edu] --> Extract[Extract domain: buffalo.edu]
    Extract --> Lookup[Look up school by domain<br/>/api/campus/detect]
    Lookup --> Found{School found?}
    
    Found -->|Yes| SetCampus[Set campusId on user profile<br/>All queries scoped to campus]
    Found -->|No| Generic[Generic experience<br/>No campus-specific data]
    
    SetCampus --> Scoped[Campus-Scoped Experience]
    Scoped --> Spaces[See UB spaces only]
    Scoped --> Events[See UB events only]
    Scoped --> Dining[UB dining data]
    Scoped --> Buildings[UB study spots]
```

## Security Layers

| Layer | Implementation | Coverage |
|-------|---------------|----------|
| **Auth middleware** | `withAuthAndErrors` / `withAuthValidationAndErrors` | 495 route handlers |
| **CSRF protection** | Token-based, `/api/auth/csrf` | All state-changing requests |
| **Rate limiting** | `enforceRateLimit()` — IP + user based | Auth routes, AI generation |
| **Input validation** | Zod schemas + `SecurityScanner` | All POST/PATCH routes |
| **Origin validation** | `validateOrigin()` | Auth routes |
| **.edu gating** | Domain check on email | Account creation |
| **Dev auth bypass** | Triple-guarded: env check + flag + function | Dev only, never production |
