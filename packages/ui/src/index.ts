// Curated, stable top-level exports for @hive/ui
// RUTHLESS CLEANUP: Only atoms (with Storybook) + navigation shell

// Utilities
export { cn } from "./lib/utils";

// Design Kit - Composition Patterns (Nov 2025)
export {
  createCompoundComponent,
  createPolymorphicComponent,
  createSlotComponent,
  createComponentContext,
  Slot,
} from "./patterns";
export type {
  CompoundComponent,
  PolymorphicComponentProps,
  SlotProps,
} from "./patterns";

// Design Kit - Design Recipes (Nov 2025)
export {
  FormField,
  InlineFormField,
  FormSection,
  FormActions,
  CheckboxGroup,
  RadioGroup,
  SearchInput,
  LoadingSpinner,
  LoadingPage,
  CardSkeleton,
  EmptyState,
  ErrorState,
  SuccessState,
  InlineAlert,
  ProgressSteps,
  Stack,
  Row,
  Split,
  Center,
  Container,
  Section,
  Divider,
  Grid as GridLayout,
  StickyHeader,
  PageLayout,
  CardGrid,
  Masonry,
} from "./recipes";

// Design Kit - Motion Library (Nov 2025)
export {
  // Presets
  easing,
  duration,
  transition,
  variants,
  gestures,
  stagger,
  // Primitives
  FadeIn,
  SlideUp,
  SlideIn,
  ScaleIn,
  Pop,
  Stagger as StaggerContainer,
  Presence,
  MotionDiv,
  Collapse,
  // Interactions
  HoverLift,
  HoverScale,
  TapScale,
  ButtonMotion,
  CardMotion,
  FocusRing as FocusRingMotion,
  Pulse,
  Shake,
  Rotate,
  Spin,
  Glow,
  // Orchestration
  StaggerList,
  SequentialReveal,
  PageTransition,
  ModalTransition,
  SheetTransition,
  ToastTransition,
  DropdownTransition,
  AccordionTransition,
  AchievementCelebration,
  CountUp,
} from "./motion";

// HIVE Branded Navigation (Nov 2025)
export { DesktopNav } from "./atomic/00-Global/organisms/desktop-nav";
export { MobileNav, defaultNavItems } from "./atomic/00-Global/organisms/mobile-nav";
export { NotificationDropdown } from "./atomic/00-Global/organisms/notification-dropdown-branded";
export { ProfileDropdown } from "./atomic/00-Global/organisms/profile-dropdown-branded";
export { Breadcrumbs, BreadcrumbsCompact } from "./atomic/00-Global/molecules/breadcrumbs";
export type { BreadcrumbItem, BreadcrumbsProps } from "./atomic/00-Global/molecules/breadcrumbs";
export { HiveNavigationExample, HiveNavigationLayout } from "./atomic/00-Global/organisms/hive-navigation-example";
export type { DesktopNavProps } from "./atomic/00-Global/organisms/desktop-nav";
export type { MobileNavProps, NavItem, MySpaceItem } from "./atomic/00-Global/organisms/mobile-nav";
export type { NotificationDropdownProps } from "./atomic/00-Global/organisms/notification-dropdown-branded";
export type { ProfileDropdownProps } from "./atomic/00-Global/organisms/profile-dropdown-branded";

// Toast System (Sonner-based - Nov 2025)
export { Toaster, toast, useToast, legacyToast } from "./atomic/00-Global/atoms/sonner-toast";
export type { LegacyToastOptions } from "./atomic/00-Global/atoms/sonner-toast";

// Motion Primitives (Nov 2025 - Animation System)
export {
  InView,
  AutoAnimated,
  useAutoAnimate,
  AnimatedNumber,
  numberSpringPresets,
  LottieAnimation,
  LottieCelebration,
  LottieLoading,
  LottieSuccess,
  lottiePresets,
  GlowEffect,
  AnimatedGoldIcon,
  // Premium Card Effects (Billion-Dollar UI)
  ShineBorder,
  ShineBorderCard,
  BorderBeam,
  BorderBeamCard,
  SparklesText,
  sparklePresets,
} from "./components/motion-primitives";

// Premium Subtle Motion Variants (Dec 2025 - Vercel/Linear style)
export {
  premiumContainerVariants,
  premiumItemVariants,
  premiumStatVariants,
  premiumCardHover,
  fadeInUpVariants,
  scaleInVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from "./lib/motion-variants";

// Spaces Motion Variants (Nov 2025 - Motion-Rich Premium)
export {
  // Tier 1: High motion
  spaceHeroCardVariants,
  spaceJoinCelebrationVariants,
  goldGlowPulseVariants,
  kenBurnsVariants,
  // Tier 2: Medium motion
  spaceDiscoveryCardVariants,
  categoryPillVariants,
  momentumPulseVariants,
  filterBarVariants,
  // Tier 3: Subtle motion
  railWidgetVariants,
  nowCardVariants,
  spaceHeaderVariants,
  sectionRevealVariants,
  collapsibleVariants,
  chevronRotateVariants,
  // Tier 4: Minimal
  staticVariants,
  // Scroll-triggered
  scrollRevealVariants,
  scrollFadeVariants,
  parallaxVariants,
  // Stagger containers
  sectionStaggerVariants,
  gridStaggerVariants,
  heroStaggerVariants,
  listStaggerVariants,
  // Stagger items
  staggerItemVariants as spaceStaggerItemVariants,
  staggerFadeItemVariants,
  // Celebrations
  confettiParticleVariants,
  successCheckVariants,
  // Utility
  withReducedMotion,
} from "./lib/motion-variants-spaces";

// Glass Morphism System (Nov 2025 - Subtle 8px blur)
export {
  glass,
  glassPresets,
  glassCSSVars,
} from "./lib/glass-morphism";
export type {
  GlassPanel,
  GlassElevated,
  GlassSticky,
  GlassGlow,
  GlassDepth,
  GlassBorder,
  GlassPreset,
} from "./lib/glass-morphism";
export type {
  InViewProps,
  AutoAnimatedProps,
  AnimatedNumberProps,
  LottieAnimationProps,
  GlowEffectProps,
  // Premium Card Effects Types (Billion-Dollar UI)
  ShineBorderProps,
  ShineBorderCardProps,
  BorderBeamProps,
  BorderBeamCardProps,
  SparklesTextProps,
} from "./components/motion-primitives";

export type { PresenceStatus } from "./identity";
// HiveLab element system exports
export type {
  ToolComposition,
  ElementDefinition,
  ElementProps,
  ElementTier,
  DataSource,
  UserContext,
} from "./lib/hivelab/element-system";

export {
  CORE_ELEMENTS,
  getAvailableElements,
  canUseElement,
  getElementsByTier,
  canUseComposition,
  getRequiredContext,
  initializeElementSystem,
} from "./lib/hivelab/element-system";
export {
  VisuallyHidden,
  SkipToContent,
  FocusRing,
  FocusTrap,
  LiveRegion,
  Portal,
  ClickAwayListener,
  useMeasure,
  Measure,
  VirtualList,
} from "./a11y";
export type {
  VisuallyHiddenProps,
  SkipToContentProps,
  FocusRingProps,
  FocusTrapProps,
  LiveRegionProps,
  PortalProps,
  ClickAwayListenerProps,
  MeasureProps,
  MeasureRenderProps,
  MeasureBounds,
  UseMeasureOptions,
  VirtualListProps,
} from "./a11y";

// Core atoms
export { Button, buttonVariants } from "./atomic/00-Global/atoms/button";
export type { ButtonProps, ButtonState } from "./atomic/00-Global/atoms/button";
export { Input, inputVariants } from "./atomic/00-Global/atoms/input";
export type { InputProps, InputStatus } from "./atomic/00-Global/atoms/input";
export { Label } from "./atomic/00-Global/atoms/label";
export { Textarea } from "./atomic/00-Global/atoms/textarea";
export { Skeleton } from "./atomic/00-Global/atoms/skeleton";
export { Badge } from "./atomic/00-Global/atoms/badge";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./atomic/00-Global/atoms/card";
export {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "./atomic/00-Global/atoms/avatar";

// Tabs
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./atomic/00-Global/atoms/tabs";

// Select
export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
} from "./atomic/00-Global/atoms/select";

// Checkbox
export { Checkbox } from "./atomic/00-Global/atoms/checkbox";

// Switch
export { Switch } from "./atomic/00-Global/atoms/switch";

// Slider
export { Slider } from "./atomic/00-Global/atoms/slider";

// Dialog
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./atomic/00-Global/atoms/dialog";

// Alert
export {
  Alert,
  AlertTitle,
  AlertDescription,
} from "./atomic/00-Global/atoms/alert";

// Progress
export { Progress } from "./atomic/00-Global/atoms/progress";

// Popover
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./atomic/00-Global/atoms/popover";

// Signature Expression Components (Nov 2025 - Autonomous Rebellion)
export { AnimatedCounter } from "./atomic/00-Global/atoms/animated-counter";
export type { AnimatedCounterProps } from "./atomic/00-Global/atoms/animated-counter";

export { AvatarStack } from "./atomic/00-Global/molecules/avatar-stack";
export type { AvatarStackProps, AvatarStackUser } from "./atomic/00-Global/molecules/avatar-stack";

export { SignatureToast, useSignatureToast } from "./atomic/00-Global/molecules/signature-toast";
export type { SignatureToastProps, SignatureToastType } from "./atomic/00-Global/molecules/signature-toast";

export { RSVPButton } from "./atomic/00-Global/molecules/rsvp-button";
export type { RSVPButtonProps } from "./atomic/00-Global/molecules/rsvp-button";

// Stat Card (metrics display)
export { StatCard } from "./atomic/00-Global/molecules/stat-card";
export type { StatCardProps } from "./atomic/00-Global/molecules/stat-card";

// Search Bar
export { SearchBar } from "./atomic/00-Global/molecules/search-bar";
export type { SearchBarProps } from "./atomic/00-Global/molecules/search-bar";

// Command
export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "./atomic/00-Global/atoms/command";

// Tooltip
export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
} from "./atomic/00-Global/atoms/tooltip";

// Dropdown Menu
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./atomic/00-Global/molecules/dropdown-menu";

// Loading State Components (Nov 2025 - Loading Architecture)
export { LoadingButton } from "./atomic/00-Global/atoms/loading-button";
export type { LoadingButtonProps } from "./atomic/00-Global/atoms/loading-button";

export { ProgressiveImage, AvatarImage as ProgressiveAvatarImage } from "./atomic/00-Global/atoms/progressive-image";
export type { ProgressiveImageProps } from "./atomic/00-Global/atoms/progressive-image";

export { LazyImage, LazyBackgroundImage } from "./atomic/00-Global/atoms/lazy-image";
export type { LazyImageProps, LazyBackgroundImageProps } from "./atomic/00-Global/atoms/lazy-image";

export {
  ConnectionStatus,
  FloatingConnectionStatus,
  ConnectionBadge,
} from "./atomic/00-Global/atoms/connection-status";
export type { ConnectionStatusProps } from "./atomic/00-Global/atoms/connection-status";
export { HiveCard, HiveCardHeader, HiveCardContent, HiveCardTitle } from "./atomic/00-Global/atoms/hive-card";
export { Grid } from "./atomic/00-Global/atoms/grid";
export { HiveLogo, HiveLogos } from "./atomic/00-Global/atoms/hive-logo";
export type { HiveLogoProps } from "./atomic/00-Global/atoms/hive-logo";

// Typography
export { Heading, Text } from "./typography";
export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
} from "./components/ui/input-otp";
export {
  CheckCircleIcon,
  MegaphoneIcon,
  AlertTriangleIcon,
  InfoIcon,
  XIcon,
} from "./atomic/00-Global/atoms/icon-library";

// Additional atoms
export { MediaThumb } from "./atomic/02-Feed/atoms/media-thumb";
export { PercentBar, VoteBar } from "./atomic/02-Feed/atoms/percent-bar";
export {
  PostCardListItem,
  PostCardSkeleton,
  PostOverlay
} from "./atomic/02-Feed/atoms/post-card";
export type {
  HivePost,
  HivePostComment,
  HivePostMedia,
  PostCardListItemProps,
  PostOverlayProps
} from "./atomic/02-Feed/atoms/post-card";

// Universal Shell (navigation)
export {
  UniversalShell,
  DEFAULT_SIDEBAR_NAV_ITEMS,
  DEFAULT_MOBILE_NAV_ITEMS,
} from "./shells/UniversalShell";
export type {
  ShellNavItem,
  ShellMobileNavItem,
  ShellSpaceLink,
  ShellSpaceSection,
  UniversalShellProps,
} from "./shells/UniversalShell";

// Experience Shells (HIVE Layout System 2025)
export {
  VoidShell,
  StreamShell,
  streamItemVariants,
  CanvasShell,
  ProfileShell,
  profileCardVariants,
  statCounterVariants,
  GridShell,
  gridItemVariants,
  gridCardHoverEffect,
} from "./shells";

// Page-level surfaces
export {
  FeedPage,
  SpacesDiscoveryPage,
  SpaceCard,
  ProfileOverviewPage,
  ProfileViewLoadingSkeleton,
  HiveLabToolsPage,
  OnboardingFlowPage,
  ToolAnalyticsPage,
  ToolPreviewPage,
  ToolEditPage,
} from "./pages";
export type {
  FeedPageProps,
  SpacesDiscoveryPageProps,
  SpaceCardProps,
  SpaceCardData,
  ProfileOverviewPageProps,
  HiveLabToolsPageProps,
  OnboardingFlowPageProps,
  ToolAnalyticsPageProps,
  ToolAnalyticsData,
  ToolPreviewPageProps,
  ToolEditPageProps,
} from "./pages";

// Space discovery/loading skeletons
export { SpacesDiscoverySkeleton } from "./pages/spaces/SpacesSkeletons";

// Spaces - shared molecules
export { SpaceHeader } from "./atomic/03-Spaces/molecules/space-header";
export type {
  SpaceHeaderProps,
  SpaceHeaderSpace,
  SpaceMembershipState,
} from "./atomic/03-Spaces/molecules/space-header";

// NOTE: All molecules were deleted per cleanup directive.
// Storybook imports from dist/ will continue to work (compiled code exists).
// New components should be atoms (primitives) placed in atomic/atoms/

// New P0 Components - Feed, Spaces, Rituals (Nov 2024)

// Feed Organisms
export { FeedCardSystem } from "./atomic/02-Feed/organisms/feed-card-system";
export type {
  FeedCardSystemProps,
  FeedCardSystemData,
  FeedCardSystemMeta,
  FeedSystemVariant,
} from "./atomic/02-Feed/organisms/feed-card-system";

// Legacy Feed Card (backwards-compatible export for web app)
export { FeedCardPost } from "./atomic/02-Feed/organisms/feed-card-post";
export type { FeedCardPostData } from "./atomic/02-Feed/organisms/feed-card-post";

// Additional Feed Cards
export { FeedCardEvent } from "./atomic/02-Feed/organisms/feed-card-event";
export { FeedCardTool } from "./atomic/02-Feed/organisms/feed-card-tool";

// Post Detail Modal
export { PostDetailModal } from "./atomic/02-Feed/organisms/post-detail-modal";
export type {
  PostDetailModalProps,
  PostDetailData,
  PostDetailComment,
  PostDetailAuthor,
  PostDetailSpace,
} from "./atomic/02-Feed/organisms/post-detail-modal";

// Feed Molecules
export { FeedFilterBar } from "./atomic/02-Feed/molecules/feed-filter-bar";

export { FeedComposerSheet } from "./atomic/02-Feed/organisms/feed-composer-sheet";
export type {
  FeedComposerSheetProps,
  ComposerSpace,
  MediaFile,
} from "./atomic/02-Feed/organisms/feed-composer-sheet";

export { FeedVirtualizedList } from "./atomic/02-Feed/organisms/feed-virtualized-list";
export type {
  FeedVirtualizedListProps,
  FeedItem,
} from "./atomic/02-Feed/organisms/feed-virtualized-list";

export { NotificationToastContainer } from "./atomic/00-Global/organisms/notification-toast-container";
export type {
  NotificationToastContainerProps,
  ToastNotification,
} from "./atomic/00-Global/organisms/notification-toast-container";

// Notification system primitives
export { NotificationSystem } from "./atomic/00-Global/organisms/notification-system";
export type {
  NotificationSystemProps,
  NotificationListItem,
} from "./atomic/00-Global/organisms/notification-system";

// Welcome mat (onboarding surface)
export { WelcomeMat } from "./atomic/00-Global/organisms/welcome-mat";
export type { WelcomeMatProps } from "./atomic/00-Global/organisms/welcome-mat";
export { useWelcomeMat } from "./hooks/use-welcome-mat";

// Gesture Actions Hook (Dec 2025 - Mobile interactions)
export {
  useGestureActions,
  MESSAGE_GESTURE_CONFIG,
  CARD_GESTURE_CONFIG,
  LIST_ITEM_GESTURE_CONFIG,
} from "./hooks/use-gesture-actions";
export type {
  SwipeDirection,
  GestureAction,
  GestureConfig,
  GestureCallbacks,
  UseGestureActionsOptions,
  GestureState,
  UseGestureActionsReturn,
} from "./hooks/use-gesture-actions";

// HiveLab: Visual composer (desktop-first)
export { VisualToolComposer } from "./components/hivelab/visual-tool-composer";
export type { VisualToolComposerProps } from "./components/hivelab/visual-tool-composer";

// HiveLab: Tool Canvas (runtime rendering)
export { ToolCanvas } from "./components/hivelab/tool-canvas";
export type { ToolCanvasProps, ToolElement, ToolCanvasContext } from "./components/hivelab/tool-canvas";

// HiveLab: Element Renderers
export {
  renderElement,
  renderElementSafe,
  isElementSupported,
  getSupportedElementTypes,
} from "./components/hivelab/element-renderers";

// HiveLab: Element Showcase (ChatGPT-style - Dec 2025)
export {
  // Components
  ElementShowcase,
  ElementBundleCard,
  ElementShowcaseGrid,
  ElementShowcaseSidebar,
  // Hook
  useElementShowcase,
  // Data
  ELEMENT_BUNDLES,
  ELEMENT_SHOWCASE_DATA,
  BUNDLE_ORDER,
  getBundleElements,
  getElementBundle,
  getAllShowcaseElements,
  getRandomPrompt,
} from "./components/hivelab/showcase";
export type {
  ElementShowcaseProps,
  ElementBundleCardProps,
  ElementShowcaseGridProps,
  ElementShowcaseSidebarProps,
  ShowcaseState,
  UseElementShowcaseOptions,
  UseElementShowcaseReturn,
  ElementBundleDefinition,
  ElementShowcaseMetadata,
} from "./components/hivelab/showcase";

// HiveLab: Modern @dnd-kit Studio Components (Nov 2025)
export { DndStudioProvider } from "./components/hivelab/studio/DndStudioProvider";
export type { DndStudioProviderProps } from "./components/hivelab/studio/DndStudioProvider";

export { DraggablePaletteItem } from "./components/hivelab/studio/DraggablePaletteItem";
export type { DraggablePaletteItemProps } from "./components/hivelab/studio/DraggablePaletteItem";

export { SortableCanvasElement } from "./components/hivelab/studio/SortableCanvasElement";
export type { SortableCanvasElementProps } from "./components/hivelab/studio/SortableCanvasElement";

export { CanvasDropZone } from "./components/hivelab/studio/CanvasDropZone";
export type { CanvasDropZoneProps } from "./components/hivelab/studio/CanvasDropZone";

export { ToolStudioExample } from "./components/hivelab/studio/ToolStudioExample";
export type { ToolStudioExampleProps } from "./components/hivelab/studio/ToolStudioExample";

// HiveLab: State Management (Immer-based with undo/redo)
export {
  createToolHistory,
  addElement,
  removeElement,
  updateElement,
  reorderElements,
  updateTool,
  undo,
  redo,
  canUndo,
  canRedo,
  getLastActionDescription,
} from "./lib/hivelab/tool-state-manager";
export type {
  Tool,
  ToolElement as ToolStateElement,
  ToolHistory,
  ToolAction,
} from "./lib/hivelab/tool-state-manager";

export { useToolState } from "./hooks/hivelab/use-tool-state";
export type {
  UseToolStateOptions,
  UseToolStateReturn,
} from "./hooks/hivelab/use-tool-state";

// Space Molecules
export { SpaceAboutWidget } from "./atomic/03-Spaces/molecules/space-about-widget";
export type {
  SpaceAboutWidgetProps,
  SpaceAboutData,
  SpaceLeader,
} from "./atomic/03-Spaces/molecules/space-about-widget";

export { SpaceToolsWidget } from "./atomic/03-Spaces/molecules/space-tools-widget";
export type {
  SpaceToolsWidgetProps,
  SpaceToolsWidgetData,
  SpaceTool,
} from "./atomic/03-Spaces/molecules/space-tools-widget";

// Space Discovery Components (Dec 2025)
// Atoms
export { MomentumIndicator } from "./atomic/03-Spaces/atoms/momentum-indicator";
export type { MomentumIndicatorProps, MomentumLevel } from "./atomic/03-Spaces/atoms/momentum-indicator";

export { CategoryPill } from "./atomic/03-Spaces/atoms/category-pill";
export type { CategoryPillProps } from "./atomic/03-Spaces/atoms/category-pill";

export { MemberStack } from "./atomic/03-Spaces/atoms/member-stack";
export type { MemberStackProps, MemberStackMember } from "./atomic/03-Spaces/atoms/member-stack";

export { ActivityBadge } from "./atomic/03-Spaces/atoms/activity-badge";
export type { ActivityBadgeProps } from "./atomic/03-Spaces/atoms/activity-badge";

// Glass morphism primitives
export {
  GlassSurface,
  GlassCard,
  GlassWidget,
  GlassModal,
  GlassHeader,
} from "./atomic/03-Spaces/atoms/glass-surface";
export type { GlassSurfaceProps } from "./atomic/03-Spaces/atoms/glass-surface";

// Sticky rail primitives
export {
  StickyRail,
  SpaceSidebarRail,
} from "./atomic/03-Spaces/atoms/sticky-rail";
export type { StickyRailProps, SpaceSidebarRailProps } from "./atomic/03-Spaces/atoms/sticky-rail";

// Molecules
export { SpaceDiscoveryCard } from "./atomic/03-Spaces/molecules/space-discovery-card";
export type { SpaceDiscoveryCardProps, SpaceDiscoveryCardData } from "./atomic/03-Spaces/molecules/space-discovery-card";

export { SpaceHeroCard } from "./atomic/03-Spaces/molecules/space-hero-card";
export type { SpaceHeroCardProps, SpaceHeroCardData } from "./atomic/03-Spaces/molecules/space-hero-card";

export { CategoryFilterBar } from "./atomic/03-Spaces/molecules/category-filter-bar";
export type { CategoryFilterBarProps, CategoryFilterItem } from "./atomic/03-Spaces/molecules/category-filter-bar";

export { DiscoverySectionHeader } from "./atomic/03-Spaces/molecules/discovery-section-header";
export type { DiscoverySectionHeaderProps } from "./atomic/03-Spaces/molecules/discovery-section-header";

// Collapsible widget pattern
export {
  CollapsibleWidget,
  CompactCollapsibleWidget,
} from "./atomic/03-Spaces/molecules/collapsible-widget";
export type {
  CollapsibleWidgetProps,
  CompactCollapsibleWidgetProps,
} from "./atomic/03-Spaces/molecules/collapsible-widget";

// Mobile inline sections
export {
  MobileInlineSection,
  MobileAboutSection,
  MobileToolsSection,
} from "./atomic/03-Spaces/molecules/mobile-inline-section";
export type { MobileInlineSectionProps } from "./atomic/03-Spaces/molecules/mobile-inline-section";

// Space empty states
export {
  SpaceEmptyState,
  PostsEmptyState,
  MembersEmptyState,
  EventsEmptyState,
  ToolsEmptyState,
  SpacesEmptyState,
  SearchEmptyState,
} from "./atomic/03-Spaces/molecules/space-empty-state";
export type { SpaceEmptyStateProps } from "./atomic/03-Spaces/molecules/space-empty-state";

// Space layout primitives
export {
  SpaceSplitLayout,
  SpaceFullWidthLayout,
  SpaceCenteredLayout,
  SpacePageLayout,
} from "./atomic/03-Spaces/layouts/space-split-layout";
export type {
  SpaceSplitLayoutProps,
  SpaceFullWidthLayoutProps,
  SpaceCenteredLayoutProps,
  SpacePageLayoutProps,
} from "./atomic/03-Spaces/layouts/space-split-layout";

// Organisms
export { SpacesHeroSection } from "./atomic/03-Spaces/organisms/spaces-hero-section";
export type { SpacesHeroSectionProps } from "./atomic/03-Spaces/organisms/spaces-hero-section";

export { SpacesDiscoveryGrid } from "./atomic/03-Spaces/organisms/spaces-discovery-grid";
export type { SpacesDiscoveryGridProps } from "./atomic/03-Spaces/organisms/spaces-discovery-grid";

// Unified Space Sidebar (Nov 2025 - Motion-Rich Premium)
export {
  SpaceSidebar,
  SpaceSidebarMinimal,
} from "./atomic/03-Spaces/organisms/space-sidebar";
export type {
  SpaceSidebarProps,
  SpaceSidebarData,
  SpaceSidebarCallbacks,
  SpaceSidebarAbout,
  SpaceSidebarTools,
  SpaceSidebarEvent,
  SpaceSidebarMinimalProps,
} from "./atomic/03-Spaces/organisms/space-sidebar";

// Space Detail Premium Components (Nov 2025 - T1 Premium)
export { SpaceDetailHeader } from "./atomic/03-Spaces/organisms/space-detail-header";
export type {
  SpaceDetailHeaderProps,
  SpaceDetailData,
  SpaceMembershipState as SpaceDetailMembershipState,
} from "./atomic/03-Spaces/organisms/space-detail-header";

export { SpaceDynamicContent } from "./atomic/03-Spaces/organisms/space-dynamic-content";
export type {
  SpaceDynamicContentProps,
  SpaceWidget as DynamicSpaceWidget,
  TabContentType,
} from "./atomic/03-Spaces/organisms/space-dynamic-content";

// Space Tab Navigation (Nov 2025)
export { SpaceTabBar } from "./atomic/03-Spaces/molecules/space-tab-bar";
export type {
  SpaceTabBarProps,
  SpaceTabItem,
} from "./atomic/03-Spaces/molecules/space-tab-bar";

// Space Celebrations
export {
  GoldConfettiBurst,
  JoinCelebration,
  FirstPostCelebration,
  MilestoneBadge,
} from "./components/motion-primitives/space-celebrations";
export type {
  GoldConfettiBurstProps,
  JoinCelebrationProps,
  FirstPostCelebrationProps,
  MilestoneBadgeProps,
} from "./components/motion-primitives/space-celebrations";

// Space Welcome Modal (Dec 2025 - First-time experience)
export { SpaceWelcomeModal, useSpaceWelcome } from "./atomic/03-Spaces/organisms/space-welcome-modal";
export type {
  SpaceWelcomeModalProps,
  SpaceWelcomeData,
  SpaceLeaderInfo,
  SpaceFeatureHighlight,
} from "./atomic/03-Spaces/organisms/space-welcome-modal";

// Brand Spinner (Dec 2025 - Design Elevation)
export { GoldSpinner, GoldSpinnerInline } from "./components/motion-primitives/gold-spinner";
export type { GoldSpinnerProps } from "./components/motion-primitives/gold-spinner";

// Ritual Molecules
export { RitualProgressBar } from "./atomic/06-Rituals/molecules/ritual-progress-bar";
export type {
  RitualProgressBarProps,
  RitualMilestone,
} from "./atomic/06-Rituals/molecules/ritual-progress-bar";

export { PrivacyControl, BulkPrivacyControl } from "./atomic/00-Global/molecules/privacy-control";
export type {
  PrivacyControlProps,
  PrivacyLevel,
  BulkPrivacyControlProps,
  BulkPrivacyControlWidget,
} from "./atomic/00-Global/molecules/privacy-control";

// Sheets
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "./atomic/00-Global/atoms/sheet";
export type { SheetContentProps } from "./atomic/00-Global/atoms/sheet";

// Admin dashboard primitives
export {
  AdminShell,
  AdminTopBar,
  AdminNavRail,
  AdminMetricCard,
  StatusPill,
  AuditLogList,
  ModerationQueue,
} from "./atomic/07-Admin/organisms";
export type {
  AdminShellProps,
  AdminNavItem,
  AdminTopBarProps,
  AdminNavRailProps,
  AdminMetricCardProps,
  StatusPillProps,
  AuditLogEvent,
  AuditLogListProps,
  ModerationQueueItem,
  ModerationQueueProps,
} from "./atomic/07-Admin/organisms";

export {
  // AdminRitualComposer,
  // type AdminRitualComposerProps,
} from "./atomic/07-Admin/organisms";

// export {
//   RitualFeedBannerCard,
//   type RitualFeedBannerCardProps,
// } from "./atomic/06-Rituals/organisms/ritual-feed-banner";

// Profile Molecules
export { ProfileBentoGrid } from "./atomic/04-Profile/molecules/profile-bento-grid";
export type { ProfileBentoGridProps } from "./atomic/04-Profile/molecules/profile-bento-grid";

// Feed Templates
export { FeedPageLayout } from "./atomic/02-Feed/templates/feed-page-layout";
export type { FeedPageLayoutProps } from "./atomic/02-Feed/templates/feed-page-layout";


export { FeedLoadingSkeleton } from "./atomic/02-Feed/templates/feed-loading-skeleton";
export type { FeedLoadingSkeletonProps } from "./atomic/02-Feed/templates/feed-loading-skeleton";
export { FeedLoadingSkeleton as FeedPageSkeleton } from "./atomic/02-Feed/templates/feed-loading-skeleton";

// Loading Skeletons (Nov 2025 - Loading Architecture)
export {
  PostComposerSkeleton,
  CompactPostInputSkeleton,
} from "./atomic/02-Feed/organisms/post-composer-skeleton";
export type { PostComposerSkeletonProps } from "./atomic/02-Feed/organisms/post-composer-skeleton";

// Space Organisms
export { SpaceBoardLayout } from "./atomic/03-Spaces/organisms/space-board-layout";
export type {
  SpaceBoardLayoutProps,
  PinnedPost as SpacePinnedPost,
} from "./atomic/03-Spaces/organisms/space-board-layout";

export { SpacePostComposer } from "./atomic/03-Spaces/organisms/space-post-composer";
export type { SpacePostComposerProps } from "./atomic/03-Spaces/organisms/space-post-composer";

// Space Modals
export { AddTabModal } from "./atomic/03-Spaces/organisms/add-tab-modal";
export type { AddTabModalProps, AddTabInput, TabType } from "./atomic/03-Spaces/organisms/add-tab-modal";

export { AddWidgetModal } from "./atomic/03-Spaces/organisms/add-widget-modal";
export type { AddWidgetModalProps, AddWidgetInput as AddWidgetInputUI, WidgetType } from "./atomic/03-Spaces/organisms/add-widget-modal";

export { MemberInviteModal } from "./atomic/03-Spaces/organisms/member-invite-modal";
export type { MemberInviteModalProps, MemberInviteInput, InviteableUser, MemberRole } from "./atomic/03-Spaces/organisms/member-invite-modal";

export { EventCreateModal } from "./atomic/03-Spaces/organisms/event-create-modal";
export type { EventCreateModalProps, EventCreateInput, EventType, BoardOption } from "./atomic/03-Spaces/organisms/event-create-modal";

// Space Templates
export { SpaceBoardTemplate } from "./atomic/03-Spaces/templates/space-board-template";
export type {
  SpaceBoardTemplateProps,
  PinnedPost,
} from "./atomic/03-Spaces/templates/space-board-template";

// Space Skeletons (Nov 2025 - Loading Architecture)
export {
  SpaceBoardSkeleton,
  SpaceCardSkeleton,
} from "./atomic/03-Spaces/organisms/space-board-skeleton";
export type { SpaceBoardSkeletonProps } from "./atomic/03-Spaces/organisms/space-board-skeleton";

// Space Chat Board (Dec 2025 - Discord-style real-time chat)
export { SpaceChatBoard } from "./atomic/03-Spaces/organisms/space-chat-board";
export type {
  SpaceChatBoardProps,
  SpaceBoardData,
  ChatMessageData,
  TypingUser,
} from "./atomic/03-Spaces/organisms/space-chat-board";

// Board Tab Bar (Dec 2025 - Discord-style channel selector)
export { BoardTabBar } from "./atomic/03-Spaces/molecules/board-tab-bar";
export type {
  BoardTabBarProps,
  BoardData,
} from "./atomic/03-Spaces/molecules/board-tab-bar";

// Mobile Space Components (Dec 2025 - Bottom bar + drawers)
export { MobileActionBar } from "./atomic/03-Spaces/molecules/mobile-action-bar";
export type {
  MobileActionBarProps,
  MobileDrawerType,
  QuickActionType,
  BadgeConfig,
} from "./atomic/03-Spaces/molecules/mobile-action-bar";

export { MobileDrawer } from "./atomic/03-Spaces/molecules/mobile-drawer";
export type { MobileDrawerProps, SnapPoint } from "./atomic/03-Spaces/molecules/mobile-drawer";

// Thread Drawer (Dec 2025 - Thread/reply view)
export { ThreadDrawer } from "./atomic/03-Spaces/molecules/thread-drawer";
export type { ThreadDrawerProps } from "./atomic/03-Spaces/molecules/thread-drawer";

// Pinned Messages Widget (Dec 2025)
export { PinnedMessagesWidget } from "./atomic/03-Spaces/molecules/pinned-messages-widget";
export type {
  PinnedMessagesWidgetProps,
  PinnedMessage,
} from "./atomic/03-Spaces/molecules/pinned-messages-widget";

// Sidebar Tool System (Dec 2025 - HiveLab-powered)
export { SidebarToolSlot } from "./atomic/03-Spaces/molecules/sidebar-tool-slot";
export type {
  SidebarToolSlotProps,
  SidebarSlotData,
} from "./atomic/03-Spaces/molecules/sidebar-tool-slot";

// Space Breadcrumb (Navigation context)
export { SpaceBreadcrumb } from "./atomic/03-Spaces/molecules/space-breadcrumb";
export type { SpaceBreadcrumbProps } from "./atomic/03-Spaces/molecules/space-breadcrumb";

// Widget Priority Engine (Dec 2025 - Smart sidebar ordering)
export {
  calculateWidgetScore,
  shouldExpandByDefault,
  prioritizeWidgets,
  getDefaultWidgets,
  getWidgetPriorityState,
} from "./atomic/03-Spaces/lib/widget-priority";
export type {
  WidgetType as SidebarWidgetType,
  UserMembership,
  WidgetData,
  PriorityContext,
  PrioritizedWidget,
  WidgetPriority,
} from "./atomic/03-Spaces/lib/widget-priority";

export { SpaceSidebarConfigurable } from "./atomic/03-Spaces/organisms/space-sidebar-configurable";
export type { SpaceSidebarConfigurableProps } from "./atomic/03-Spaces/organisms/space-sidebar-configurable";

export { WidgetGallery } from "./atomic/03-Spaces/organisms/widget-gallery";
export type {
  WidgetGalleryProps,
  WidgetTemplate,
} from "./atomic/03-Spaces/organisms/widget-gallery";

// Chat Toolbar (Dec 2025 - Inline tool insertion)
export { ChatToolbar } from "./atomic/03-Chat/chat-toolbar";
export type {
  ChatToolbarProps,
  ToolInsertData,
  ToolType,
} from "./atomic/03-Chat/chat-toolbar";

// Ritual Organisms
export { RitualStrip } from "./atomic/06-Rituals/organisms/ritual-strip";
export type { RitualStripProps } from "./atomic/06-Rituals/organisms/ritual-strip";

export { RitualCard } from "./atomic/06-Rituals/organisms/ritual-card";
export type { RitualCardProps } from "./atomic/06-Rituals/organisms/ritual-card";

// Ritual Templates
export { RitualsPageLayout } from "./atomic/06-Rituals/templates/rituals-page-layout";
export type {
  RitualsPageLayoutProps,
  RitualData,
} from "./atomic/06-Rituals/templates/rituals-page-layout";

// export { RitualDetailLayout } from "./atomic/06-Rituals/templates/ritual-detail-layout";
// export type {
//   RitualDetailLayoutProps,
// } from "./atomic/06-Rituals/templates/ritual-detail-layout";

export { ProfileViewLayout } from "./atomic/04-Profile/templates/profile-view-layout";
export type { ProfileViewLayoutProps } from "./atomic/04-Profile/templates/profile-view-layout";

// Layout Primitives (Vercel/Linear patterns - Nov 2025)
export { Shell, shellSizes } from "./atomic/00-Global/templates/shell";
export type { ShellProps, ShellSize } from "./atomic/00-Global/templates/shell";
export { PageHeader } from "./atomic/00-Global/templates/page-header";
export type { PageHeaderProps } from "./atomic/00-Global/templates/page-header";
export { CollapsiblePageHeader } from "./layout/collapsible-page-header";
export type { CollapsiblePageHeaderProps, TabItem as HeaderTabItem } from "./layout/collapsible-page-header";

// Auth/Onboarding Components
export { AuthOnboardingLayout } from "./atomic/00-Global/templates/auth-onboarding-layout";
export type { AuthOnboardingLayoutProps } from "./atomic/00-Global/templates/auth-onboarding-layout";
export { OnboardingFrame } from "./atomic/00-Global/molecules/onboarding-frame";
export type { OnboardingFrameProps } from "./atomic/00-Global/molecules/onboarding-frame";

// HiveLab: Deployment modal
export {
  ToolDeployModal,
} from "./components/hivelab/ToolDeployModal";
export type {
  ToolDeployModalProps,
  DeploymentConfig as ToolDeploymentConfig,
  DeploymentTarget as ToolDeploymentTarget,
} from "./components/hivelab/ToolDeployModal";

// HiveLab: Runtime modal (for in-context tool execution in Spaces)
export { ToolRuntimeModal } from "./components/hivelab/tool-runtime-modal";
export type { ToolRuntimeModalProps } from "./components/hivelab/tool-runtime-modal";

// HiveLab: Inline element renderer (for chat messages)
export { InlineElementRenderer } from "./components/hivelab/inline-element-renderer";
export type {
  InlineElementRendererProps,
  InlineComponentData,
} from "./components/hivelab/inline-element-renderer";

// HiveLab: Automations panel (Phase 3)
export { AutomationsPanel, AutomationsBadge } from "./components/hivelab/automations-panel";
export type { AutomationItem } from "./components/hivelab/automations-panel";

// Automation Templates Browser (Phase 3.5)
export { AutomationTemplates, AutomationTemplatesCompact } from "./components/hivelab/automation-templates";

// HiveLab: Studio + panels
export { HiveLabStudio } from "./atomic/05-HiveLab/organisms/hivelab-studio";
export type { HiveLabStudioProps } from "./atomic/05-HiveLab/organisms/hivelab-studio";
export { HiveLabElementPalette } from "./atomic/05-HiveLab/molecules/hivelab-element-palette";
export type { HiveLabElementPaletteProps } from "./atomic/05-HiveLab/molecules/hivelab-element-palette";
export { HiveLabInspectorPanel } from "./atomic/05-HiveLab/molecules/hivelab-inspector-panel";
export type { HiveLabInspectorPanelProps } from "./atomic/05-HiveLab/molecules/hivelab-inspector-panel";
export { HiveLabLintPanel } from "./atomic/05-HiveLab/molecules/hivelab-lint-panel";
export type { HiveLabLintPanelProps } from "./atomic/05-HiveLab/molecules/hivelab-lint-panel";
export { HiveLabToolLibraryCard } from "./atomic/05-HiveLab/molecules/hivelab-tool-library-card";
export type { HiveLabToolLibraryCardProps } from "./atomic/05-HiveLab/molecules/hivelab-tool-library-card";

// HiveLab Skeletons (Nov 2025 - Loading Architecture)
export {
  ToolLibrarySkeleton,
  ToolCardSkeleton,
  ToolExecutionSkeleton,
  ToolListItemSkeleton,
} from "./atomic/05-HiveLab/organisms/tool-library-skeleton";
export type { ToolLibrarySkeletonProps } from "./atomic/05-HiveLab/organisms/tool-library-skeleton";

export { ProfileIdentityWidget } from "./atomic/04-Profile/organisms/profile-identity-widget";
export type { ProfileIdentityWidgetProps } from "./atomic/04-Profile/organisms/profile-identity-widget";
export { ProfileActivityWidget } from "./atomic/04-Profile/organisms/profile-activity-widget";
export type { ProfileActivityWidgetProps, ProfileActivityItem } from "./atomic/04-Profile/organisms/profile-activity-widget";
export { ProfileSpacesWidget } from "./atomic/04-Profile/organisms/profile-spaces-widget";
export type { ProfileSpacesWidgetProps, ProfileSpaceItem } from "./atomic/04-Profile/organisms/profile-spaces-widget";
export { ProfileConnectionsWidget } from "./atomic/04-Profile/organisms/profile-connections-widget";
export type { ProfileConnectionsWidgetProps, ProfileConnectionItem } from "./atomic/04-Profile/organisms/profile-connections-widget";
export { ProfileCompletionCard } from "./atomic/04-Profile/organisms/profile-completion-card";
export type { ProfileCompletionCardProps, ProfileCompletionStep } from "./atomic/04-Profile/organisms/profile-completion-card";
export { HiveLabWidget } from "./atomic/05-HiveLab/organisms/hivelab-widget";
export type { HiveLabWidgetProps } from "./atomic/05-HiveLab/organisms/hivelab-widget";

// Chat Components (OpenAI-style)
export {
  MessageBubble,
  MessageList,
  ConversationThread,
  EmptyChatState,
  ChatInput,
  TypingIndicator,
  ToolPreviewCard,
  MobilePreviewSheet,
} from "./atomic/03-Chat";
export type {
  MessageBubbleProps,
  ConversationThreadProps,
  EmptyChatStateProps,
  ChatInputProps,
  TypingIndicatorProps,
  ToolPreviewCardProps,
  MobilePreviewSheetProps,
} from "./atomic/03-Chat";

// Chat-based Landing Page
export { AILandingPageChat } from "./pages/hivelab/AILandingPageChat";
export type { AILandingPageChatProps } from "./pages/hivelab/AILandingPageChat";

// HiveLab: Local Tool Storage (localStorage migration helpers)
export {
  getLocalTools,
  getLocalTool,
  saveLocalTool,
  updateLocalTool,
  deleteLocalTool,
  clearLocalTools,
  getLocalToolCount,
  hasLocalTool,
  exportLocalTools,
  importLocalTools,
  useLocalToolStorage,
  // WIP (Work In Progress) storage
  saveWIPTool,
  getWIPTool,
  clearWIPTool,
  hasRecentWIPTool,
} from "./lib/hivelab/local-tool-storage";
export type { LocalTool, WIPToolData } from "./lib/hivelab/local-tool-storage";

// HiveLab IDE (Figma/VS Code-style - Dec 2025)
export {
  // Main IDE Component
  HiveLabIDE,
  // Sub-components
  IDEToolbar,
  IDECanvas,
  AICommandPalette,
  ElementPalette,
  LayersPanel,
  PropertiesPanel,
  // Hooks
  useIDEKeyboard,
  formatShortcut,
  SHORTCUTS,
  // Types
  DEFAULT_CANVAS_STATE,
  DEFAULT_IDE_STATE,
} from "./components/hivelab/ide";
export type {
  HiveLabIDEProps,
  HiveLabComposition,
  CanvasElement as IDECanvasElement,
  Connection as IDEConnection,
  ToolMode,
  CanvasState,
  HistoryEntry,
  IDEState,
  IDEActions,
  KeyboardShortcut,
} from "./components/hivelab/ide";
