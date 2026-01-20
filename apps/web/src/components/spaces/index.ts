/**
 * Spaces Components Index
 *
 * Re-exports all space-related components for clean imports.
 *
 * @version 1.0.0 - Spaces Hub redesign (Jan 2026)
 */

// Core list row
export { SpaceListRow, SpaceListRowSkeleton } from './space-list-row';
export type { SpaceListRowSpace, SpaceListRowProps } from './space-list-row';

// Identity cards
export { IdentityCards } from './identity-cards';
export type { IdentityClaim, IdentityType, IdentityCardsProps } from './identity-cards';

// Identity claim modal
export { IdentityClaimModal } from './identity-claim-modal';

// Your spaces list
export { YourSpacesList } from './your-spaces-list';
export type { YourSpace, YourSpacesListProps } from './your-spaces-list';

// Discover section
export { DiscoverSection } from './discover-section';
export type { DiscoverTab, DiscoverSpace, DiscoverSectionProps } from './discover-section';

// Invite link modal
export { InviteLinkModal } from './invite-link-modal';

// User state layouts
export { NewUserLayout } from './new-user-layout';
export type { NewUserLayoutProps } from './new-user-layout';
export { ReturningUserLayout } from './returning-user-layout';
export type { ReturningUserLayoutProps } from './returning-user-layout';

// Space preview modal
export { SpacePreviewModal } from './space-preview-modal';
export type { SpacePreviewData, SpacePreviewModalProps } from './space-preview-modal';
