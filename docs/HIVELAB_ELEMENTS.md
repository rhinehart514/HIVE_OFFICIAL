# HiveLab Element Status

Registry: `packages/ui/src/components/hivelab/elements/registry.tsx`
Execute handlers: `/api/tools/execute/route.ts`

## Interactive Elements (have execute handlers)

| Element | Type | Notes |
|---------|------|-------|
| `poll-element` | Interactive | Vote recording, anonymous mode |
| `counter` | Interactive | Inc/dec/reset with bounds |
| `rsvp-button` | Interactive | Capacity + waitlist |
| `timer` | Interactive | Start/stop/lap tracking |
| `leaderboard` | Interactive | Score updates, reset |
| `checklist-tracker` | Interactive | Per-user completion |
| `signup-sheet` | Interactive | Slot capacity enforced |
| `form-builder` | Interactive | Multi-submit, validation |
| `progress-indicator` | Display | Set/increment/reset |
| `announcement` | Space | Leader-only pin/unpin |

## Display-Only Elements (no execute handler)

| Element | Type |
|---------|------|
| `countdown-timer` | Display |
| `event-picker` | Connected |
| `personalized-event-feed` | Connected |
| `dining-picker` | Connected |
| `study-spot-finder` | Connected |
| `member-list` | Space |
| `space-events` | Space |
| `space-feed` | Space |
| `space-stats` | Space |
| `connection-list` | Connected |
| `custom-block` | Sandbox (only element with connection input support) |
| `search-input` | Input |
| `date-picker` | Input |
| `user-selector` | Input |
| `filter-selector` | Filter |
| `result-list` | Display |
| `chart-display` | Display |
| `tag-cloud` | Display |
| `map-view` | Display |
| `photo-gallery` | Display |
| `directory-list` | Display |
| `qr-code-generator` | Display |
| `notification-center` | Display |

**Aliases:** `counter-element` -> `counter`, `notification-display` -> `notification-center`
