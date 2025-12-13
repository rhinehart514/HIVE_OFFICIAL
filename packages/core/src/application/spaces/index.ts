/**
 * Space Application Layer
 *
 * Services, DTOs and presenters for space API responses.
 */

// Discovery Service
export {
  SpaceDiscoveryService,
  createSpaceDiscoveryService,
} from './space-discovery.service';

export type {
  BrowseSpacesInput,
  BrowseSpacesResult,
  SearchSpacesInput,
  RecommendedSpacesInput,
  UserSpacesInput,
  CheckMembershipFn,
  GetMembershipsFn,
} from './space-discovery.service';

// Deployment Service (HiveLab → Spaces Integration)
export {
  SpaceDeploymentService,
  createSpaceDeploymentService,
} from './space-deployment.service';

export type {
  PlaceToolInput,
  PlaceToolResult,
  UpdatePlacedToolInput,
  RemovePlacedToolInput,
  ReorderPlacedToolsInput,
  AutoDeployInput,
  AutoDeployResult,
  SpaceDeploymentCallbacks,
  PlacedToolData,
} from './space-deployment.service';

// DTOs
export type {
  SpaceBaseDTO,
  SpaceBrowseDTO,
  SpaceDetailDTO,
  SpaceMembershipDTO,
  SpaceWithMembersDTO,
  SpaceWithToolsDTO,
  MembershipDTO,
  SpaceActivityDTO,
  SpaceWidgetStatsDTO,
  SpaceMemberDTO,
  TabSummaryDTO,
  TabDetailDTO,
  WidgetSummaryDTO,
  WidgetDetailDTO,
  PlacedToolDTO,
} from './space.dto';

// Presenters
export {
  toSpaceBrowseDTO,
  toSpaceDetailDTO,
  toSpaceMembershipDTO,
  toSpaceWithMembersDTO,
  toSpaceWithToolsDTO,
  toSpaceBrowseDTOList,
  toSpaceMembershipDTOList,
} from './space.presenter';

// Chat Service (Boards + Messages)
export {
  SpaceChatService,
  createSpaceChatService,
} from './space-chat.service';

export type {
  CreateBoardInput,
  UpdateBoardInput,
  SendMessageInput,
  ReactionInput,
  BoardResult,
  MessageResult,
  ListMessagesOptions,
  ListMessagesResult,
  IBoardRepository,
  IMessageRepository,
  CheckPermissionFn,
  GetUserProfileFn,
} from './space-chat.service';
