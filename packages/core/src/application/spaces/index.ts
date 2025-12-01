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

// DTOs
export type {
  SpaceBaseDTO,
  SpaceBrowseDTO,
  SpaceDetailDTO,
  SpaceMembershipDTO,
  SpaceWithMembersDTO,
  MembershipDTO,
  SpaceActivityDTO,
  SpaceWidgetStatsDTO,
  SpaceMemberDTO,
  TabSummaryDTO,
  TabDetailDTO,
  WidgetSummaryDTO,
  WidgetDetailDTO,
} from './space.dto';

// Presenters
export {
  toSpaceBrowseDTO,
  toSpaceDetailDTO,
  toSpaceMembershipDTO,
  toSpaceWithMembersDTO,
  toSpaceBrowseDTOList,
  toSpaceMembershipDTOList,
} from './space.presenter';
