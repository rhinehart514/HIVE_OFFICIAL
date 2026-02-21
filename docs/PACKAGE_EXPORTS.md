# Package Exports — HIVE

## @hive/core

```typescript
// Server-side (API routes only)
import { getServerSpaceRepository, getServerProfileRepository,
         getServerBoardRepository, getServerMessageRepository,
         getServerTemplateRepository, getServerUnitOfWork,
         createServerSpaceManagementService,
         createServerSpaceDeploymentService,
         createServerSpaceChatService,
         getDomainEventPublisher,
         getCategoryRules, canRequestLeadership } from '@hive/core/server';

// Client-safe types (components)
import { type ToolComposition } from '@hive/core/client';

// Domain types (shared)
import { PlacedToolDTO, SpaceDTO, ProfileDTO, TemplateDTO } from '@hive/core';
```

Package.json exports: `.`, `./server`, `./domain`, `./application`, `./infrastructure`, `./client`

## @hive/ui

```typescript
// Design system
import { Button, Input, Card, Badge, Avatar, Modal, Tabs } from '@hive/ui/design-system/primitives';
import { SpaceCard, ProfileCard, ChatMessage } from '@hive/ui/design-system/components';

// Motion
import { FadeIn, SlideUp, StaggerList, HoverLift } from '@hive/ui/motion';

// HiveLab
import { ToolCanvas, VisualToolComposer, HiveLabIDE } from '@hive/ui';
import { getQuickTemplate } from '@hive/ui'; // Quick templates

// Design tokens (also re-exported)
import { MOTION, LAYOUT } from '@hive/ui/tokens';
```

## @hive/tokens

```typescript
import { MONOCHROME, MOTION, LAYOUT, GLASS, ELEVATION, TYPOGRAPHY,
         CARD, BUTTON, BADGE, INPUT, IDE_TOKENS,
         SPACE_LAYOUT, SPACE_COLORS, SPACE_MOTION,
         hiveTailwindConfig } from '@hive/tokens';
```

## @hive/hooks

```typescript
import { useSpaces, useSpace, useProfile, useAnalytics,
         useHiveQuery, useHiveMutation, useOptimisticToggle,
         useStreamingGeneration, useToolExecution,
         useRealtimeCollection, useRealtimeDocument,
         useDebounce, useDebouncedCallback } from '@hive/hooks';
```

## @hive/firebase

```typescript
import { app, db, auth, storage, analytics } from '@hive/firebase';
// Server-side: use firebase-admin directly, not this package
```

## @hive/auth-logic

```typescript
import { useAuth } from '@hive/auth-logic';
// httpOnly JWT cookies, fetches from /api/auth/me
```

## @hive/validation

Zod schemas: `user`, `profile`, `feed`, `space`, `tool`, `chat`, `event`, `settings`, `waitlist`
