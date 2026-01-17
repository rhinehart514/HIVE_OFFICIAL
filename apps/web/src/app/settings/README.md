# Settings Page Refactoring

## Overview
Decomposed `/apps/web/src/app/settings/page.tsx` from **1,583 lines** to **331 lines** (79% reduction).

## File Structure

```
apps/web/src/app/settings/
├── page.tsx                              (331 lines) - Main orchestration
├── types.ts                              (77 lines)  - TypeScript interfaces
├── components/
│   ├── ui-primitives.tsx                 (234 lines) - Switch, SettingRow, ConfirmModal, CollapsibleSection
│   ├── profile-section.tsx               (102 lines) - Profile form
│   ├── notification-sections.tsx         (238 lines) - All notification settings
│   ├── privacy-section.tsx               (188 lines) - Privacy settings + Ghost Mode
│   └── account-section.tsx               (282 lines) - Calendar, preferences, data, sign out, delete
└── hooks/
    ├── use-settings-state.ts             (170 lines) - Notification, privacy, account, calendar state
    ├── use-profile-form.ts               (94 lines)  - Profile form state + save handler
    └── use-data-export.ts                (134 lines) - Data export logic
```

## What Was Extracted

### Types (`types.ts`)
- `NotificationSettings` - Email, push, in-app, quiet hours
- `PrivacySettings` - Visibility, ghost mode
- `AccountSettings` - Theme, email frequency, data retention
- `CalendarStatus`, `UserSpace`, `ExportProgress`

### UI Primitives (`components/ui-primitives.tsx`)
- `Switch` - Toggle component
- `SettingRow` - Label + description + switch
- `ConfirmModal` - Reusable confirmation dialog with optional typing confirmation
- `CollapsibleSection` - Expandable section with icon + badge

### Section Components
1. **ProfileSection** - Name, handle, email, bio form
2. **NotificationSections** - Email, push, in-app, quiet hours, per-space settings
3. **PrivacySection** - Visibility toggles + Ghost Mode integration
4. **AccountSection** - Calendar connection, preferences, data export, sign out, delete account

### Custom Hooks
1. **useSettingsState** - Manages notification/privacy/account settings state, debounced saves
2. **useProfileForm** - Profile form state, change tracking, save handler with sanitization
3. **useDataExport** - Data export logic with progress tracking and error handling

## Key Features Preserved

- All 4 tabs: Profile, Notifications, Privacy, Account
- Profile form with sanitization
- Debounced notification settings saves (500ms)
- Ghost Mode integration (feature-flagged)
- Calendar connection flow with OAuth callback handling
- Complete data export (6 data sources: profile, spaces, connections, tools, calendar, activity)
- Account deletion with typed confirmation ("DELETE")
- Privacy settings with 5 visibility toggles
- Quiet hours with time picker
- Per-space notification muting
- Auto-delete data retention settings

## Benefits

1. **Maintainability**: Each concern isolated into focused files
2. **Reusability**: UI primitives can be used elsewhere
3. **Testability**: Hooks and components can be tested independently
4. **Readability**: Main page.tsx now just orchestrates, no business logic
5. **Type Safety**: All interfaces defined in types.ts

## Usage

The page still works identically to before. All functionality preserved:

```tsx
import SettingsPage from './page';

// Renders the complete settings page with all tabs
<SettingsPage />
```

## Future Improvements

1. Replace mock `USER_SPACES` with real data fetching
2. Extract calendar logic into `use-calendar-connection.ts` hook
3. Create Storybook stories for all UI primitives
4. Add unit tests for hooks
5. Consider extracting feature flag logic into a custom hook
