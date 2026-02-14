# Content Flow

## Content Types

```mermaid
graph LR
    subgraph Content["Content in HIVE"]
        Messages[💬 Chat Messages<br/>Real-time, ephemeral]
        Posts[📝 Posts<br/>Feed content, persistent]
        Events[📅 Events<br/>Time-bound, RSVP-able]
        Tools[🔧 Tools<br/>Interactive, stateful]
    end
```

## Chat Message Lifecycle

```mermaid
flowchart TD
    Compose([User types message]) --> SlashCheck{Starts with /?}
    
    SlashCheck -->|Yes| SlashParse[Parse slash command<br/>slash-command-parser.ts]
    SlashParse --> IntentDetect[Detect intent<br/>intent-to-component.ts]
    IntentDetect --> InlineComp[Create inline component<br/>Tool embedded in message]
    
    SlashCheck -->|No| RegularMsg[Regular text message]
    
    RegularMsg --> Send[POST /api/spaces/:id/chat]
    InlineComp --> Send
    
    Send --> AuthCheck{Authenticated?<br/>Member?}
    AuthCheck -->|No| Denied[403 Forbidden]
    AuthCheck -->|Yes| PermCheck{Has message<br/>permissions?}
    PermCheck -->|No| Denied
    PermCheck -->|Yes| Store[Store in Firestore<br/>Board → Messages subcollection]
    
    Store --> SSE[Push via SSE stream<br/>/api/spaces/:id/chat/stream]
    Store --> Notify[Trigger notifications<br/>@mentions, replies]
    
    SSE --> Render[Render in chat feed<br/>message-item.tsx]
    
    subgraph Actions["Message Actions"]
        React[React 👍<br/>POST .../react]
        Reply[Reply in thread<br/>POST .../replies]
        Pin[Pin message 📌<br/>POST .../pin]
        Edit[Edit message ✏️<br/>PATCH .../messageId]
        Delete[Delete message 🗑️<br/>DELETE .../messageId]
    end
    
    Render --> Actions
```

### Message Permission Matrix

| Action | Owner | Admin | Moderator | Member | Guest |
|--------|-------|-------|-----------|--------|-------|
| Send message | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit own message | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit any message | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete own message | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete any message | ✅ | ✅ | ✅ | ❌ | ❌ |
| Pin/unpin | ✅ | ✅ | ✅ | ❌ | ❌ |
| React | ✅ | ✅ | ✅ | ✅ | ❌ |
| Reply in thread | ✅ | ✅ | ✅ | ✅ | ❌ |

## Post Lifecycle

```mermaid
flowchart TD
    Create([Create post]) --> PostAPI[POST /api/spaces/:id/posts]
    PostAPI --> Validate[Validate content<br/>Zod schema + SecurityScanner]
    Validate --> Moderate{Content moderation<br/>check?}
    
    Moderate -->|Flagged| Review[Queued for review<br/>content-moderation pipeline]
    Moderate -->|Clean| Publish[Published to space feed]
    
    Publish --> VisCheck{Visibility rules<br/>per space type}
    VisCheck -->|"Campus visible<br/>(student org, university, hive)"| CampusFeed[Visible in campus feed]
    VisCheck -->|"Members only<br/>(greek life)"| MembersOnly[Only space members see it]
    VisCheck -->|"Space only<br/>(campus living)"| SpaceOnly[Only within space context]
    
    subgraph PostActions["Post Actions"]
        Comment[Comment<br/>POST .../comments]
        Reaction[React<br/>POST .../reactions]
        Promote[Promote post<br/>POST .../promote-post]
        EditPost[Edit<br/>PATCH .../postId]
        DeletePost[Delete<br/>DELETE .../postId]
    end
    
    Publish --> PostActions
```

## Event Lifecycle

```mermaid
flowchart TD
    Create([Create event]) --> SpaceEvent{Context?}
    
    SpaceEvent -->|Space event| SpaceAPI[POST /api/spaces/:id/events]
    SpaceEvent -->|Campus event| EventAPI[POST /api/events]
    
    SpaceAPI --> EventDoc[Event stored with spaceId]
    EventAPI --> EventDoc
    
    EventDoc --> RSVP[RSVP system<br/>POST .../events/:id/rsvp]
    RSVP --> Going[Going ✅]
    RSVP --> Maybe[Maybe 🤔]
    RSVP --> NotGoing[Not going ❌]
    
    EventDoc --> Personalized[Personalized feed<br/>GET /api/events/personalized]
    
    Personalized --> Score[Score events for user]
    Score --> Interests[Match user interests]
    Score --> Spaces[Boost joined space events]
    Score --> Proximity[Time proximity bonus]
    Score --> Social[Friends attending bonus]
    
    Score --> Ranked[Ranked event feed]

    subgraph Visibility["Event Visibility by Space Type"]
        Public["Public calendar<br/>Student org, University, HIVE"]
        Invite["Invitation controlled<br/>Greek life"]
        Private["Members only<br/>Campus living"]
    end
    
    EventDoc --> Visibility
```

## Content Moderation Pipeline

```mermaid
flowchart TD
    Content([Any content created]) --> AutoMod{Auto-moderation<br/>ContentModerationService}
    
    AutoMod -->|Clean| Published[Published normally]
    AutoMod -->|Flagged| Queue[Moderation queue<br/>admin/content-moderation dashboard]
    AutoMod -->|Severe| AutoRemove[Auto-removed<br/>User notified]
    
    Queue --> Review{Admin reviews}
    Review -->|Approve| Published
    Review -->|Remove| Removed[Content removed<br/>User warned]
    Review -->|Escalate| Escalated[Escalated to<br/>higher admin]
    
    subgraph Signals["Moderation Signals"]
        Text[Text analysis]
        Reports[User reports<br/>POST /api/content/reports]
        Pattern[Behavioral patterns]
        Image[Image check<br/>POST /api/content/check-image]
    end
    
    Signals --> AutoMod
```

## Content in Spaces: The 5-Tab Model

```mermaid
graph TD
    Space[Space View] --> Chat[💬 Chat Tab<br/>Real-time messaging<br/>Boards/channels<br/>Inline tools]
    Space --> Creations[🔧 Creations Tab<br/>Deployed HiveLab tools<br/>Tool gallery<br/>Create new tools]
    Space --> Events[📅 Events Tab<br/>Space events<br/>RSVP<br/>Calendar view]
    Space --> Market[🏪 Market Tab<br/>Future: tool exchange<br/>Future: marketplace]
    Space --> Members[👥 Members Tab<br/>Member list<br/>Roles<br/>Invite/manage]
    
    style Market fill:#888,color:#fff
```

## Chat Features

| Feature | Route | Status |
|---------|-------|--------|
| Send message | `POST /spaces/:id/chat` | ✅ |
| Real-time stream | `GET /spaces/:id/chat/stream` (SSE) | ✅ |
| Message reactions | `POST /spaces/:id/chat/:msgId/react` | ✅ |
| Threaded replies | `POST /spaces/:id/chat/:msgId/replies` | ✅ |
| Pin messages | `POST /spaces/:id/chat/:msgId/pin` | ✅ |
| Get pinned | `GET /spaces/:id/chat/pinned` | ✅ |
| Edit message | `PATCH /spaces/:id/chat/:msgId` | ✅ |
| Delete message | `DELETE /spaces/:id/chat/:msgId` | ✅ |
| Search messages | `GET /spaces/:id/chat/search` | ✅ |
| Typing indicator | `POST /spaces/:id/chat/typing` | ✅ |
| Read receipts | `POST /spaces/:id/chat/read` | ✅ |
| Intent detection | `POST /spaces/:id/chat/intent` | ✅ |
| Inline components | Slash commands → tool embeds | ✅ |
