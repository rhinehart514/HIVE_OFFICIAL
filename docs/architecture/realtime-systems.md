# Real-Time Systems

## Overview

```mermaid
graph LR
    subgraph SSE["Server-Sent Events (SSE)"]
        ChatStream[Chat Stream<br/>/spaces/:id/chat/stream]
        ToolState[Tool State Stream<br/>/tools/:id/state/stream]
        NotifStream[Notification Stream<br/>/notifications/stream]
    end
    
    subgraph Push["Push Notifications"]
        FCM[Firebase Cloud Messaging<br/>18 notification types]
    end
    
    subgraph Polling["Polling"]
        Typing[Typing Indicators<br/>POST /spaces/:id/chat/typing]
        ReadReceipts[Read Receipts<br/>POST /spaces/:id/chat/read]
    end
    
    SSE --> Browser([Browser/PWA])
    Push --> PWA([PWA/Mobile])
    Polling --> Browser
```

## Chat Real-Time Flow

```mermaid
sequenceDiagram
    participant A as User A
    participant API as Chat API
    participant DB as Firestore
    participant SSE as SSE Stream
    participant B as User B

    Note over A,B: Both connected to /spaces/:id/chat/stream

    A->>API: POST /spaces/:id/chat (send message)
    API->>DB: Write message document
    API-->>A: 200 OK (optimistic UI already showed it)
    
    DB->>SSE: Firestore listener triggers
    SSE->>B: SSE event: new message
    B->>B: Render message in feed
    
    A->>API: POST /spaces/:id/chat/typing
    API->>SSE: Broadcast typing indicator
    SSE->>B: SSE event: user typing
    
    B->>API: POST /spaces/:id/chat/read {lastReadMessageId}
    API->>DB: Update read receipt
```

## Tool State Sync

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant Hook as use-tool-state-stream
    participant API as State API
    participant DB as Firestore
    participant SSE as SSE Stream
    participant U2 as User 2

    Note over U1,U2: Both viewing shared tool state

    U1->>Hook: Update state locally
    Hook->>Hook: Optimistic apply (instant UI)
    Hook->>Hook: Queue write, 300ms debounce
    
    Hook->>API: POST state update
    API->>DB: Write shared state doc
    
    DB->>SSE: State change event
    SSE->>U2: New state data
    U2->>U2: Merge with local state
    
    alt Conflict (server newer)
        Note over U2: Accept server state<br/>Last-write-wins by timestamp
    end
    
    alt Write fails
        Hook->>Hook: Rollback to pre-write state
        Hook->>U1: Show error
    end
```

### Reconnection Strategy

```mermaid
flowchart TD
    Connected([SSE Connected]) --> Disconnect{Connection lost?}
    Disconnect -->|Yes| Retry1[Wait 1 second]
    Retry1 --> Reconnect1{Reconnect?}
    Reconnect1 -->|Fail| Retry2[Wait 2 seconds]
    Retry2 --> Reconnect2{Reconnect?}
    Reconnect2 -->|Fail| Retry3[Wait 4 seconds]
    Retry3 --> RetryN["Continue doubling...<br/>Max 30 seconds"]
    
    Reconnect1 -->|Success| Connected
    Reconnect2 -->|Success| Connected
    RetryN -->|Success| Connected
```

## Notification System

### 18 Push Notification Types

```mermaid
graph TD
    subgraph Space["Space Notifications"]
        JoinReq[Join request received]
        JoinApproved[Join request approved]
        MemberJoined[New member joined]
        RoleChanged[Role changed]
        SpaceInvite[Space invitation]
    end
    
    subgraph Chat["Chat Notifications"]
        Mention[@mention in chat]
        Reply[Reply to your message]
        Pin[Your message pinned]
    end
    
    subgraph Tool["Tool Notifications"]
        ToolForked[Tool forked]
        ToolDeployed[Tool deployed to space]
        ToolMilestone[Tool hit milestone]
        ToolUpdated[Forked tool updated]
    end
    
    subgraph Event["Event Notifications"]
        EventCreated[New event in space]
        EventReminder[Event starting soon]
        RSVPUpdate[RSVP update]
    end
    
    subgraph System["System Notifications"]
        Welcome[Welcome message]
        Achievement[Achievement unlocked]
        SystemAlert[System alert]
    end
```

### Notification Delivery

```mermaid
flowchart TD
    Event([Something happens]) --> Create[Create notification document<br/>notification-service.ts]
    
    Create --> InApp[In-App Delivery]
    Create --> Push[Push Delivery]
    
    InApp --> SSE[SSE stream<br/>/notifications/stream]
    SSE --> Badge[Update badge count]
    SSE --> Toast[Show toast notification]
    
    Push --> FCM[Firebase Cloud Messaging]
    FCM --> PWA[PWA push notification]
    FCM --> Browser[Browser notification]
    
    subgraph Storage
        NotifDoc[Notification document<br/>id, type, title, body,<br/>toolId, actionUrl, timestamp,<br/>read: boolean]
    end
    
    Create --> Storage
    
    subgraph API["Notification API"]
        List[GET /notifications<br/>List notifications]
        MarkRead[PATCH /notifications<br/>Mark as read]
        Stream[GET /notifications/stream<br/>SSE for real-time]
    end
```

## Cron Jobs (Scheduled)

| Job | Route | Schedule | Purpose |
|-----|-------|----------|---------|
| Tool lifecycle | `/api/cron/tool-lifecycle` | Periodic | Clean up expired tools, update metrics |
| Tool automations | `/api/cron/tool-automations` | Periodic | Run scheduled tool actions |
| Event sync | `/api/cron/sync-events` | Periodic | Sync external calendar events |
| Setup orchestration | `/api/cron/setup-orchestration` | Periodic | Process setup queue |
| Automations | `/api/cron/automations` | Periodic | Run space automations |
