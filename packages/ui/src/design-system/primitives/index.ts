/**
 * HIVE Primitives
 * Source: docs/design-system/PRIMITIVES.md
 *
 * Atomic building blocks for the HIVE design system.
 * All primitives use CSS variables from tokens.css.
 */

// ============================================
// TYPOGRAPHY PRIMITIVES
// ============================================

export { DisplayText, displayTextVariants, type DisplayTextProps } from './DisplayText';
export { Heading, headingVariants, type HeadingProps } from './Heading';
export { Text, textVariants, type TextProps } from './Text';
export { Mono, monoVariants, type MonoProps } from './Mono';
export { Label, labelVariants, type LabelProps } from './Label';
export { Link, linkVariants, type LinkProps } from './Link';

// ============================================
// CONTAINER PRIMITIVES (Phase 3)
// ============================================

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
  type CardProps,
} from './Card';
export { Separator, separatorVariants, type SeparatorProps } from './Separator';
export { Icon, iconVariants, type IconProps } from './Icon';

// ============================================
// INPUT PRIMITIVES (Phase 4)
// ============================================

export { Button, buttonVariants, type ButtonProps } from './Button';
export { Input, inputVariants, type InputProps } from './Input';
export { EmailInput, type EmailInputProps } from './EmailInput';
export { HandleInput, type HandleInputProps, type HandleStatus } from './HandleInput';
export { OTPInput, type OTPInputProps } from './OTPInput';
export {
  HandleStatusBadge,
  type HandleStatusBadgeProps,
  type HandleBadgeStatus,
} from './HandleStatusBadge';
export {
  CountdownTimer,
  formatTime,
  type CountdownTimerProps,
} from './CountdownTimer';
export {
  SuccessCheckmark,
  CHECKMARK_GOLD,
  type SuccessCheckmarkProps,
} from './SuccessCheckmark';
export { Textarea, textareaVariants, type TextareaProps } from './Textarea';
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  selectTriggerVariants,
  type SelectProps,
  type SelectTriggerProps,
  type SelectContentProps,
  type SelectItemProps,
  type SelectLabelProps,
  type SelectSeparatorProps,
} from './Select';
export { Checkbox, checkboxVariants, type CheckboxProps } from './Checkbox';
export { Switch, switchVariants, type SwitchProps } from './Switch';
export {
  RadioGroup,
  RadioItem,
  radioGroupVariants,
  radioItemVariants,
  type RadioGroupProps,
  type RadioItemProps,
} from './Radio';

// ============================================
// FEEDBACK PRIMITIVES (Phase 5)
// ============================================

export {
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  modalContentVariants,
  type ModalProps,
  type ModalContentProps,
  type ModalHeaderProps,
  type ModalBodyProps,
  type ModalFooterProps,
  type ModalTitleProps,
  type ModalDescriptionProps,
} from './Modal';

export {
  Toast,
  ToastContainer,
  toastVariants,
  toastIconVariants,
  type ToastProps,
} from './Toast';

export {
  useToast,
  Toaster,
  ToastProvider,
  type ToastData,
  type ToastOptions,
  type ToastAPI,
} from './use-toast';

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  SimpleTooltip,
  type TooltipProps,
  type TooltipContentProps,
  type SimpleTooltipProps,
} from './Tooltip';

export {
  Progress,
  CircularProgress,
  progressVariants,
  progressIndicatorVariants,
  type ProgressProps,
  type CircularProgressProps,
} from './Progress';

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonListItem,
  SkeletonMessageBubble,
  SkeletonSpaceCard,
  SkeletonProfileHeader,
  skeletonVariants,
  type SkeletonProps,
  type SkeletonTextProps,
} from './Skeleton';

export {
  EmptyState,
  NoResults,
  NoItems,
  ErrorState,
  emptyStateVariants,
  iconContainerVariants as emptyStateIconContainerVariants,
  iconVariants as emptyStateIconVariants,
  type EmptyStateProps,
  type NoResultsProps,
  type NoItemsProps,
  type ErrorStateProps,
} from './EmptyState';

// ============================================
// NAVIGATION PRIMITIVES (Phase 6)
// ============================================

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  tabsTriggerVariants,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentProps,
} from './Tabs';

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  SimpleAvatar,
  avatarVariants,
  getInitials,
  type AvatarProps,
  type AvatarImageProps,
  type AvatarFallbackProps,
  type SimpleAvatarProps,
} from './Avatar';

export {
  AvatarGroup,
  avatarGroupVariants,
  type AvatarGroupProps,
  type AvatarGroupUser,
} from './AvatarGroup';

export {
  Badge,
  DotBadge,
  CountBadge,
  badgeVariants,
  type BadgeProps,
  type DotBadgeProps,
  type CountBadgeProps,
} from './Badge';

export {
  FeaturedBadge,
  FeaturedBadgeGroup,
  featuredBadgeVariants,
  REASON_COLORS,
  DEFAULT_LABELS as FEATURED_LABELS,
  ReasonIcons as FeaturedReasonIcons,
  type FeaturedReason,
  type FeaturedBadgeProps,
} from './FeaturedBadge';

export {
  Tag,
  tagVariants,
  type TagProps,
} from './Tag';

export {
  SelectionCard,
  type SelectionCardProps,
} from './SelectionCard';

// ============================================
// LIFE PRIMITIVES (Phase 7)
// ============================================

export {
  PresenceDot,
  PresenceWrapper,
  presenceDotVariants,
  type PresenceDotProps,
  type PresenceWrapperProps,
} from './PresenceDot';

export {
  ActivityEdge,
  activityEdgeVariants,
  getWarmthFromActiveUsers,
  type ActivityEdgeProps,
} from './ActivityEdge';

export {
  WarmthDots,
  InlineWarmth,
  warmthDotsContainerVariants,
  warmthDotVariants,
  getWarmthLevel,
  getFilledDots,
  usesGold,
  type WarmthDotsProps,
  type InlineWarmthProps,
  type WarmthLevel,
} from './WarmthDots';

export {
  LiveCounter,
  LiveCounterGroup,
  liveCounterVariants,
  formatCompact,
  type LiveCounterProps,
  type LiveCounterGroupProps,
} from './LiveCounter';

export {
  TypingIndicator,
  TypingDotsOnly,
  TypingDots,
  typingIndicatorVariants,
  formatTypingText,
  type TypingIndicatorProps,
  type TypingDotsOnlyProps,
} from './TypingIndicator';

export {
  ActivityBar,
  ActivityBarCompact,
  activityBarContainerVariants,
  activitySegmentVariants,
  getActivityPercentage,
  getActivityLabel,
  type ActivityBarProps,
  type ActivityBarCompactProps,
} from './ActivityBar';

export {
  ActivityHeartbeat,
  ActivityHeartbeatStrip,
  activityHeartbeatVariants,
  getActivityLevel,
  isSpaceLive,
  getHeartbeatColor,
  type ActivityHeartbeatProps,
  type ActivityHeartbeatStripProps,
  type ActivityLevel,
} from './ActivityHeartbeat';

export {
  FriendStack,
  FriendStackInline,
  friendStackContainerVariants,
  friendAvatarRingVariants,
  type FriendStackProps,
  type FriendStackInlineProps,
  type Friend,
} from './FriendStack';

export {
  LiveIndicator,
  LiveBadge,
  LiveCountIndicator,
  ExploringNow,
  LiveDotOnly,
  liveIndicatorContainerVariants,
  liveDotVariants,
  liveTextVariants,
  countTextVariants,
  liveBadgeVariants,
  type LiveIndicatorProps,
  type LiveBadgeProps,
  type LiveCountIndicatorProps,
  type ExploringNowProps,
  type LiveDotOnlyProps,
} from './LiveIndicator';

// Note: LifeBadge is covered by Badge with variant="gold" for achievements

// ============================================
// WORKSHOP PRIMITIVES (Phase 8)
// ============================================

export {
  PropertyField,
  PropertyGroup,
  PropertySection,
  propertyFieldVariants,
  type PropertyFieldProps,
  type PropertyGroupProps,
  type PropertySectionProps,
} from './PropertyField';

export {
  CanvasArea,
  CanvasElement,
  CanvasGuides,
  canvasAreaVariants,
  type CanvasAreaProps,
  type CanvasElementProps,
  type CanvasGuidesProps,
} from './CanvasArea';

export {
  HandleDot,
  HandleGroup,
  RotationHandle,
  handleDotVariants,
  type HandleDotProps,
  type HandlePosition,
  type HandleGroupProps,
  type RotationHandleProps,
} from './HandleDot';

// ============================================
// GLOBAL NAV PRIMITIVES (Top + Sidebar)
// ============================================

export {
  TopBar,
  TopBarBrand,
  TopBarBreadcrumbs,
  TopBarActions,
  TopBarSearch,
  TopBarNotifications,
  TopBarProfile,
  TopBarDivider,
  TOPBAR_TOKENS,
  type TopBarProps,
  type TopBarBrandProps,
  type BreadcrumbItem,
  type TopBarBreadcrumbsProps,
  type TopBarActionsProps,
  type TopBarSearchProps,
  type TopBarNotificationsProps,
  type TopBarProfileProps,
} from './TopBar';

export {
  GlobalSidebar,
  SidebarSection as GlobalSidebarSection,
  SidebarSpaceItem as GlobalSidebarSpaceItem,
  SidebarToolItem,
  SidebarAddButton,
  SidebarNavItem as GlobalSidebarNavItem,
  SidebarDivider as GlobalSidebarDivider,
  SidebarFooter as GlobalSidebarFooter,
  SidebarCollapseToggle as GlobalSidebarCollapseToggle,
  useGlobalSidebar,
  SIDEBAR_TOKENS as GLOBAL_SIDEBAR_TOKENS,
  BrowseIcon,
  SettingsIcon,
  ToolsIcon,
  type GlobalSidebarProps,
  type SidebarSectionProps as GlobalSidebarSectionProps,
  type SidebarSpaceItemProps as GlobalSidebarSpaceItemProps,
  type SidebarToolItemProps,
  type SidebarAddButtonProps,
  type SidebarNavItemProps as GlobalSidebarNavItemProps,
  type SidebarFooterProps as GlobalSidebarFooterProps,
} from './GlobalSidebar';

// ============================================
// LAYOUT PRIMITIVES (Phase 9)
// ============================================

export {
  Section,
  sectionVariants,
  type SectionProps,
} from './layout/Section';

export {
  Container,
  containerVariants,
  type ContainerProps,
} from './layout/Container';

export {
  Stack,
  stackVariants,
  type StackProps,
} from './layout/Stack';

export {
  Cluster,
  clusterVariants,
  type ClusterProps,
} from './layout/Cluster';

export {
  Grid,
  gridVariants,
  type GridProps,
} from './layout/Grid';

export {
  Spacer,
  spacerVariants,
  type SpacerProps,
} from './layout/Spacer';

// ============================================
// BRAND PRIMITIVES
// ============================================

export {
  Logo,
  LogoMark,
  LogoWordmark,
  logoVariants,
  type LogoProps,
} from './Logo';

// ============================================
// LANDING PRIMITIVES (Phase 10)
// ============================================

export {
  LandingNav,
  type LandingNavProps,
  type LandingNavLinkProps,
} from './landing/LandingNav';

export {
  Hero,
  heroVariants,
  type HeroProps,
} from './landing/Hero';

export {
  Feature,
  featureVariants,
  featureIconVariants,
  type FeatureProps,
} from './landing/Feature';

export {
  Footer,
  type FooterProps,
  type FooterLinkProps,
  type FooterLinkGroupProps,
} from './landing/Footer';

// ============================================
// MOBILE NAVIGATION PRIMITIVES (Phase 12)
// ============================================

export {
  BottomNav,
  BottomNavSpacer,
  bottomNavContainerVariants,
  bottomNavItemVariants,
  bottomNavBadgeVariants,
  glassContainerSurface as bottomNavGlassContainerSurface,
  bottomNavGlassPillSurface,
  type BottomNavItem,
  type BottomNavProps,
  type BottomNavItemRenderProps,
} from './BottomNav';

export {
  CategoryScroller,
  categoryScrollerContainerVariants,
  categoryScrollerScrollAreaVariants,
  categoryScrollerItemVariants,
  fadeOverlayVariants as categoryScrollerFadeOverlayVariants,
  scrollToSelected,
  type CategoryItem,
  type CategoryScrollerProps,
} from './CategoryScroller';

// ============================================
// SPACE PRIMITIVES (Phase 13)
// ============================================

export {
  SpacePreviewSheet,
  sheetContainerVariants as spacePreviewSheetContainerVariants,
  sheetHeaderVariants as spacePreviewSheetHeaderVariants,
  sheetBodyVariants as spacePreviewSheetBodyVariants,
  sheetFooterVariants as spacePreviewSheetFooterVariants,
  activityDotVariants as spaceActivityDotVariants,
  DragHandle as SpacePreviewDragHandle,
  DefaultAvatar as SpacePreviewDefaultAvatar,
  DefaultEventCard as SpacePreviewDefaultEventCard,
  glassSheetSurface as spacePreviewGlassSheetSurface,
  HIVE_GOLD,
  type ActivityStatus,
  type SpacePreviewData,
  type SpacePreviewSheetProps,
} from './SpacePreviewSheet';

export {
  SpacePreviewModal,
  spacePreviewModalContainerVariants,
  spacePreviewModalHeaderVariants,
  spacePreviewModalBodyVariants,
  spacePreviewModalFooterVariants,
  SpacePreviewStatsRow,
  SpacePreviewCloseButton,
  spacePreviewModalGlassSurface,
  type SpacePreviewModalProps,
} from './SpacePreviewModal';

export {
  MemberCard,
  MemberList,
  memberCardContainerVariants,
  memberAvatarVariants,
  roleBadgeVariants,
  presenceDotVariants as memberPresenceDotVariants,
  MemberAvatar,
  DefaultRoleIcon,
  ROLE_COLORS,
  type MemberRole,
  type PresenceStatus as MemberPresenceStatus,
  type MemberCardData,
  type MemberCardProps,
  type MemberListProps,
} from './MemberCard';

export {
  SpaceModeNav,
  AnimatedSpaceModeNav,
  spaceModeNavContainerVariants,
  spaceModeNavItemVariants,
  unreadBadgeVariants as spaceModeUnreadBadgeVariants,
  SpaceModeIcons,
  createSpaceModes,
  detectActiveMode,
  defaultSpaceModes,
  spaceModeGlassPillSurface,
  spaceModeSpringConfig,
  type SpaceModeItem,
  type SpaceModeNavProps,
} from './SpaceModeNav';

// ============================================
// HIVELAB PRIMITIVES (Phase 14)
// ============================================

export {
  TemplateScroller,
  TemplateCard,
  BlankCard,
  templateScrollerContainerVariants,
  templateScrollerScrollAreaVariants,
  templateCardVariants,
  templatePreviewVariants,
  templateScrollerFadeOverlayVariants,
  templateCardGlassSurface,
  type TemplateItem,
  type TemplateScrollerProps,
} from './TemplateScroller';

export {
  DeploymentTarget,
  DeploymentTargetCard,
  DeploymentSpaceAvatar,
  DeploymentSurfaceSelector,
  deploymentTargetContainerVariants,
  deploymentTargetCardVariants,
  deploymentSurfacePillVariants,
  deploymentTargetGlassSurface,
  type DeploymentSurface,
  type DeploymentSpaceTarget,
  type DeploymentTargetProps,
} from './DeploymentTarget';

export {
  ElementGroup,
  ElementPalette,
  ElementItemCard,
  TierBadge,
  ChevronIcon,
  elementGroupContainerVariants,
  elementGroupHeaderVariants,
  elementGroupContentVariants,
  elementItemVariants,
  tierBadgeVariants,
  TIER_COLORS,
  elementGroupGlassHeaderSurface,
  type ElementTier,
  type ElementItem,
  type ElementGroupData,
  type ElementGroupProps,
  type ElementPaletteProps,
} from './ElementGroup';

// ============================================
// MOTION PRIMITIVES (Phase 11)
// ============================================

export {
  // Hooks
  useMouse,
  useScrollProgress,
  // Components
  Tilt,
  Magnetic,
  TextReveal,
  FadeUp,
  Stagger,
  Parallax,
  CursorGlow,
  NoiseOverlay,
  // Re-exports from framer-motion
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
  // Types
  type TiltProps,
  type MagneticProps,
  type TextRevealProps,
  type FadeUpProps,
  type StaggerProps,
  type ParallaxProps,
  type CursorGlowProps,
  type NoiseOverlayProps,
  type MotionProps,
} from './motion';

// ============================================
// PROFILE PRIMITIVES (Phase 15)
// ============================================

export {
  ProfileBentoGrid,
  ProfileBentoItem,
  ProfileBentoSidebar,
  ProfileBentoMain,
  ProfileBentoLayout,
  bentogridContainerVariants,
  bentogridItemVariants,
  profileBentoContainerAnimationVariants,
  profileBentoItemAnimationVariants,
  type ProfileBentoGridProps,
  type ProfileBentoItemProps,
} from './ProfileBentoGrid';

export {
  ProfileCompletionNudge,
  useProfileCompletionNudge,
  nudgeContainerVariants,
  progressBarVariants as profileNudgeProgressBarVariants,
  shouldShowNudge,
  recordDismiss,
  glassNudgeSurface,
  type ProfileCompletionItem,
  type ProfileCompletionNudgeProps,
} from './ProfileCompletionNudge';

export {
  ConnectionStrengthIndicator,
  ConnectionStrengthInline,
  connectionContainerVariants,
  connectionDotVariants,
  connectionBarVariants,
  strengthToLevel,
  levelToStrength,
  getStrengthColor,
  STRENGTH_LEVELS,
  type StrengthLevel,
  type ConnectionStrengthIndicatorProps,
} from './ConnectionStrengthIndicator';
