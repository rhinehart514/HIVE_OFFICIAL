// Curated, stable top-level exports for @hive/ui
// RUTHLESS CLEANUP: Only atoms (with Storybook) + navigation shell

// Utilities
export { cn } from "./lib/utils";

// ============================================
// LAYOUT ARCHETYPES (Jan 2026)
// Four locked behavioral layout types
// ============================================

export {
  DiscoveryLayout,
  DiscoveryGrid,
  DiscoveryList,
  DiscoveryEmpty,
} from "./layouts/DiscoveryLayout";

export {
  LayoutProvider,
  useLayout,
} from "./layouts/LayoutContext";
export type { LayoutArchetype } from "./layouts/LayoutContext";

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

// HIVE Branded Navigation (Jan 2026 - Migrated to design-system)
// NOTE: Use DropdownMenu + NotificationBanner for notifications
// NOTE: Use DropdownMenu for profile dropdown
// NOTE: Use TopBar's Breadcrumb component for breadcrumbs
export { TopBar, Breadcrumb } from "./design-system/components/TopBar";
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./design-system/components/Dropdown";
export { NotificationBanner } from "./design-system/components/NotificationBanner";

// Space Switcher (migrated to design-system Jan 2026)
export { SpaceSwitcher } from "./design-system/components/SpaceSwitcher";
export type { SpaceSwitcherProps, SpaceSwitcherSpace } from "./design-system/components/SpaceSwitcher";

// Space Rail - REMOVED (Use Sidebar/MinimalSidebar instead)
// NOTE: SpaceRail replaced by design-system Sidebar component

// Toast System (Jan 2026 - Migrated to design-system)
export { Toast, ToastContainer, toastVariants, toastIconVariants } from "./design-system/primitives/Toast";
export type { ToastProps } from "./design-system/primitives/Toast";
export { useToast, Toaster, ToastProvider } from "./design-system/primitives/use-toast";
export type { ToastData, ToastOptions, ToastAPI } from "./design-system/primitives/use-toast";

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
  GLOW_COLORS,
} from "./components/motion-primitives";

// Motion Tokens (Jan 2026 - Premium motion design tokens)
export { MOTION } from "./tokens/motion";
export type {
  EaseType,
  DurationType,
  StaggerType,
  ViewportType,
  SpringType,
  ParallaxType,
} from "./tokens/motion";

// Canonical Motion Variants (7 patterns)
export {
  // Pattern constants
  REVEAL,
  SURFACE,
  MORPH,
  OVERLAY,
  SNAP,
  CELEBRATE,
  CELEBRATE_GOLD,
  // Reveal variants
  revealTransition,
  revealFadeUp,
  revealFade,
  revealScale,
  revealContainer,
  // Surface variants
  surfaceCard,
  surfacePanel,
  surfaceDrawer,
  surfaceFloat,
  // Overlay variants
  overlayBackdrop,
  overlayModal,
  overlayDialog,
  overlayCommand,
  overlayToast,
  // Snap variants
  snapButton,
  snapToggle,
  snapCheck,
  // Celebrate variants
  celebratePop,
  celebrateGlow,
  celebrateCheck,
  celebrateBadge,
} from "./tokens/variants";

// Layout Tokens (Jan 2026 - Consistent layout dimensions)
export {
  HEADER_HEIGHT,
  HEADER_HEIGHT_CLASS,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_CLASS,
  SIDEBAR_COLLAPSED_WIDTH,
  MOBILE_NAV_WIDTH,
  MOBILE_NAV_WIDTH_CLASS,
  MOBILE_HEADER_HEIGHT,
  MOBILE_BOTTOM_NAV_HEIGHT,
  MAX_CONTENT_WIDTH,
  MAX_CONTENT_WIDTH_CLASS,
  CONTENT_PADDING_X,
  CONTENT_PADDING_Y,
  SPACING,
  RADIUS,
  Z_INDEX,
  EASE_PREMIUM,
} from "./design-system/layout-tokens";

// Dramatic Reveal Primitives (Jan 2026 - WordReveal, ThresholdReveal)
export {
  WordReveal,
  ThresholdReveal,
  ArrivalTransition,
  ArrivalZone,
} from "./design-system/primitives/motion";
export type {
  WordRevealProps,
  ThresholdRevealProps,
  ArrivalTransitionProps,
  ArrivalZoneProps,
} from "./design-system/primitives/motion";

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
  GlassPremium,
  GlassDepth,
  GlassBorder,
  GlassPreset,
} from "./lib/glass-morphism";

// Spatial Depth System (Dec 2025 - 2026 Design Elevation)
export {
  elevation,
  elevationLevels,
  getElevation,
  shadows,
  perspective,
  getPerspectiveStyle,
  getPerspectiveHover,
  depthRelationships,
  cardDepth,
  backdrop,
  elevationVariants,
  withElevation,
  getDarkShadow,
  isFloatingElement,
  getBackdrop,
} from "./lib/spatial-depth";
export type {
  InViewProps,
  AutoAnimatedProps,
  AnimatedNumberProps,
  LottieAnimationProps,
  GlowEffectProps,
} from "./components/motion-primitives";

export type { PresenceStatus, ActivityLevel, ActivityPresenceProps } from "./identity";
export { ActivityPresence, getActivityLevel } from "./identity";
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

// Quick templates for one-click tool deployment
export {
  QUICK_TEMPLATES,
  getQuickTemplate,
  getTemplatesByCategory,
  getTemplatesByComplexity,
  getAppTemplates,
  getAvailableTemplates,
  getCategoriesWithCounts,
  createToolFromTemplate,
  getQuickDeployTemplates,
  getTemplatesForInterests,
  getTemplatesForSpaceType,
  getTemplatesSortedByRelevance,
  SPACE_TYPE_LABELS,
} from "./lib/hivelab/quick-templates";
export type { QuickTemplate, TemplateCategory, TemplateComplexity, TemplateStatus, SpaceType } from "./lib/hivelab/quick-templates";

// HiveLab UI Components
export { QuickCreateWizard, QUICK_CREATE_INTENTS } from "./design-system/components/hivelab";
export type { QuickCreateIntent, QuickCreateField, QuickCreateResult, QuickCreateWizardProps } from "./design-system/components/hivelab";
export { BuilderOnboarding, useBuilderOnboarding } from "./design-system/components/hivelab";
export type { BuilderOnboardingProps } from "./design-system/components/hivelab";
export { QuickDeployModal } from "./design-system/components/hivelab";
export type { QuickDeployModalProps, QuickDeployResult } from "./design-system/components/hivelab";

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

// Core atoms (Design System)
export { Button, buttonVariants } from "./design-system/primitives";
export type { ButtonProps } from "./design-system/primitives";
export { Input, inputVariants } from "./design-system/primitives";
export type { InputProps } from "./design-system/primitives";
// Label (Jan 2026 - Using design-system primitives)
export { Label, labelVariants } from "./design-system/primitives/Label";
export type { LabelProps } from "./design-system/primitives/Label";
export { Textarea, textareaVariants } from "./design-system/primitives";
export type { TextareaProps } from "./design-system/primitives";
// Skeleton (Design System - Jan 2026)
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonListItem,
  skeletonVariants,
} from "./design-system/primitives";
export type {
  SkeletonProps,
  SkeletonTextProps,
} from "./design-system/primitives";
// NOTE: SkeletonButton - Use Skeleton with button dimensions instead

// Badge (Design System - Jan 2026)
export {
  Badge,
  DotBadge,
  CountBadge,
  badgeVariants,
} from "./design-system/primitives";
export type {
  BadgeProps,
  DotBadgeProps,
  CountBadgeProps,
} from "./design-system/primitives";
// NOTE: NotificationBadge, StatusBadge - Use CountBadge or Badge with variant instead

// Space Health Badge (Sprint 3 - Jan 2026)
export {
  SpaceHealthBadge,
  SpaceHealthDot,
  SpaceHealthEdge,
  SpaceGrowthIndicator,
  SpaceHealthIndicator,
  healthBadgeContainerVariants,
  healthDotVariants,
  healthEdgeVariants,
  getSpaceHealthLevel,
  getHealthLabel,
  getHealthDescription,
  getMemberGrowthTrend,
} from "./design-system/primitives";
export type {
  SpaceHealthLevel,
  SpaceHealthMetrics,
  SpaceHealthBadgeProps,
  SpaceHealthDotProps,
  SpaceHealthEdgeProps,
  SpaceGrowthIndicatorProps,
  SpaceHealthIndicatorProps,
} from "./design-system/primitives";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./design-system/primitives";
export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  SimpleAvatar,
  avatarVariants,
  getInitials,
} from "./design-system/primitives";
export type { AvatarProps, SimpleAvatarProps } from "./design-system/primitives";

// Dialog (Design System)
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./design-system/components/Dialog";

// Sheet (Design System)
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
  sheetVariants,
} from "./design-system/components/Sheet";
export type { SheetContentProps } from "./design-system/components/Sheet";

// Command (Design System)
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "./design-system/components/Command";

// Popover (Design System - Jan 2026)
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverPortal,
  PopoverAnchor,
  PopoverClose,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverBody,
  PopoverFooter,
  PopoverCard,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "./design-system/components/Popover";
export type { PopoverContentProps, PopoverCardProps } from "./design-system/components/Popover";

// Separator (Design System - Jan 2026)
export {
  Separator,
  separatorVariants,
} from "./design-system/primitives";
export type {
  SeparatorProps,
} from "./design-system/primitives";
// NOTE: LabeledSeparator, IconSeparator, etc. - Build with Separator + custom content

// Tabs (Design System - Jan 2026)
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  tabsTriggerVariants,
} from "./design-system/primitives";
export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
} from "./design-system/primitives";
// NOTE: SimpleTabs, CardTabs - Use Tabs + custom styling

// Select (Design System - Jan 2026)
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  selectTriggerVariants,
} from "./design-system/primitives";
export type {
  SelectTriggerProps,
  SelectContentProps,
  SelectItemProps,
} from "./design-system/primitives";
// NOTE: SimpleSelect, SelectScrollUpButton, SelectScrollDownButton - Use Select primitives directly

// Checkbox (Jan 2026 - Using design-system primitives)
export { Checkbox, checkboxVariants } from "./design-system/primitives/Checkbox";
export type { CheckboxProps } from "./design-system/primitives/Checkbox";

// Switch (Design System - Jan 2026)
export {
  Switch,
  switchVariants,
} from "./design-system/primitives";
export type {
  SwitchProps,
} from "./design-system/primitives";
// NOTE: SwitchField, thumbVariants - Use Switch + Label combo

// Slider (Design System - Jan 2026)
export {
  Slider,
  SliderWithLabels,
  RangeSlider,
  SliderWithMarks,
  sliderVariants,
} from "./design-system/components/Slider";
export type {
  SliderProps,
  SliderWithLabelsProps,
  RangeSliderProps,
  SliderWithMarksProps,
} from "./design-system/components/Slider";

// Note: Dialog components now exported from design-system above (line ~329)

// Alert (Design System - Jan 2026)
// Note: InlineAlert exported from ./recipes to avoid duplicate
export {
  Alert,
  AlertTitle,
  AlertDescription,
  alertVariants,
} from "./design-system/components/Alert";
export type {
  AlertProps,
  InlineAlertProps,
} from "./design-system/components/Alert";

// Progress (Design System)
export { Progress, CircularProgress, progressVariants, progressIndicatorVariants } from "./design-system/primitives";
export type { ProgressProps, CircularProgressProps } from "./design-system/primitives";

// Popover - REMOVED (Use Tooltip or Dialog instead)
// NOTE: Popover requires @radix-ui/react-hover-card which is not installed
// Use Tooltip for simple hovers, Dialog for complex popovers

// HeroInput - REMOVED (Use Input with custom styling instead)
// NOTE: HeroInput was a ChatGPT-style input, use Input primitive with custom CSS

// Command Palette (Dec 2025 - ⌘K Navigation)
export { CommandPalette } from "./design-system/components/CommandPalette";
export type { CommandPaletteProps, CommandPaletteItem } from "./design-system/components/CommandPalette";

// HiveLogo Component and Shell Icons (standalone for use anywhere)
export {
  HiveLogo,
  HomeIcon,
  UsersIcon,
  UserIcon,
  CompassIcon,
  SpacesIcon,
  BeakerIcon,
  BellIcon,
  CalendarIcon,
  SettingsIcon,
  LogOutIcon,
} from "./shells/shell-icons";

// Page Transition (Jan 2026 - Route animations)
// PageTransition template REMOVED Feb 2026 — use motion primitives directly
// Stub exports to avoid breaking downstream imports
export const RouteTransition = ({ children }: { children: React.ReactNode }) => children;
export const PageTransitionProvider = ({ children }: { children: React.ReactNode }) => children;
export const usePageTransition = () => ({ mode: 'fade' as const, setMode: () => {} });
export type RouteTransitionProps = { children: React.ReactNode };
export type PageTransitionContextValue = { mode: string; setMode: (m: string) => void };
export type PageTransitionProviderProps = { children: React.ReactNode; defaultMode?: string };
export type TransitionMode = 'fade' | 'slide' | 'scale';

// Phase 2: Territory-First Navigation Templates (Jan 2026)
export { AppShell, AppShellSkeleton, useAppShell, APP_SHELL_HEADER_HEIGHT, APP_SHELL_MOBILE_NAV_HEIGHT } from "./design-system/templates/AppShell";
export type { AppShellProps, AppShellUser } from "./design-system/templates/AppShell";
export {
  SpaceShell, SpaceShellSkeleton, useSpaceShell,
  SPACE_SHELL_HEADER_HEIGHT, SPACE_SHELL_BOARD_TABS_HEIGHT, SPACE_SHELL_INPUT_HEIGHT, SPACE_SHELL_PANEL_WIDTH_PERCENT,
} from "./design-system/templates/SpaceShell";
export type { SpaceShellProps, SpaceIdentity as SpaceShellIdentity } from "./design-system/templates/SpaceShell";

// Auth Components (Jan 2026 - Auth/Onboarding)
export { EmailInput, getFullEmail, isValidEmailUsername } from "./design-system/components/EmailInput";
export type { EmailInputProps } from "./design-system/components/EmailInput";
export { OTPInput } from "./design-system/components/OTPInput";
export type { OTPInputProps } from "./design-system/components/OTPInput";
export { AuthSuccessState, AuthSuccessStateCompact } from "./design-system/components/AuthSuccessState";
export type { AuthSuccessStateProps } from "./design-system/components/AuthSuccessState";

// Signature Expression Components (Jan 2026 - Migrated to design-system)

// AvatarStack - Use AvatarGroup from design-system/primitives
export { AvatarGroup, avatarGroupVariants } from "./design-system/primitives/AvatarGroup";
export type { AvatarGroupProps, AvatarGroupUser } from "./design-system/primitives/AvatarGroup";

// SignatureToast - REMOVED (Use Toast from design-system instead)
// NOTE: Use Toaster and useToast from design-system/components/Toast

// RSVPButton - From design-system/components
export { RSVPButton, RSVPButtonGroup } from "./design-system/components/RSVPButton";
export type { RSVPButtonProps, RSVPButtonGroupProps } from "./design-system/components/RSVPButton";

// Stat Card (Design System - Jan 2026)
export {
  StatCard,
  StatCardGroup,
  StatCardSkeleton,
  Sparkline,
} from "./design-system/components/StatCard";
export type {
  StatCardProps,
  StatCardGroupProps,
} from "./design-system/components/StatCard";

// DataTable (Design System - Jan 2026)
export {
  DataTable,
  DataTableSkeleton,
} from "./design-system/components/DataTable";
export type {
  DataTableProps,
  DataTableColumn,
} from "./design-system/components/DataTable";

// FileCard (Design System - Jan 2026)
export {
  FileCard,
  FileCardSkeleton,
  FileIcon,
} from "./design-system/components/FileCard";
export type {
  FileCardProps,
} from "./design-system/components/FileCard";

// ChatComposer (Design System - Jan 2026)
export {
  ChatComposer,
  ChatComposerMinimal,
} from "./design-system/components/ChatComposer";
export type {
  ChatComposerProps,
  ChatComposerMinimalProps,
  ChatAttachment,
  ChatReplyTo,
} from "./design-system/components/ChatComposer";

// MemberList (Jan 2026 - Fixed Avatar API to use SimpleAvatar)
export {
  MemberList,
  MemberRow,
  MemberRowSkeleton,
} from "./design-system/components/MemberList";
export type {
  MemberListProps,
  Member,
} from "./design-system/components/MemberList";

// AttendeeList (Jan 2026 - Fixed Avatar API to use SimpleAvatar)
export {
  AttendeeList,
  AttendeeRow,
  AttendeeRowSkeleton,
  AttendeeStack,
} from "./design-system/components/AttendeeList";
export type {
  AttendeeListProps,
  AttendeeStackProps,
  Attendee,
} from "./design-system/components/AttendeeList";

// Search Bar (Jan 2026 - Using design-system SearchInput)
// NOTE: SearchInput already exported from ./recipes above
export type { SearchInputProps } from "./design-system/components/SearchInput";

// Note: Command components now exported from design-system above (line ~356)

// Tooltip (Design System - Jan 2026)
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  SimpleTooltip,
} from "./design-system/primitives/Tooltip";
export type {
  TooltipProps,
  TooltipContentProps,
  SimpleTooltipProps,
} from "./design-system/primitives/Tooltip";
// NOTE: TooltipRich - Use Tooltip with custom content

// Dropdown Menu (Design System - Jan 2026)
// NOTE: DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem already exported above (line ~101)
export {
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./design-system/components/Dropdown";

// Loading State Components (Jan 2026 - Migrated to design-system)
// ProgressiveImage/LazyImage - REMOVED (Use native img + Skeleton for loading states)
// ConnectionStatus - Use PresenceIndicator from design-system
export { PresenceIndicator, PresenceIndicatorGroup, PresenceIndicatorInline } from "./design-system/components/PresenceIndicator";
export type { PresenceIndicatorProps, PresenceIndicatorGroupProps, PresenceIndicatorInlineProps } from "./design-system/components/PresenceIndicator";
// NOTE: PresenceStatus type already exported from ./identity above (line ~245)

// HiveCard - Use Card from design-system
// NOTE: Card already exported from design-system/components/Card above (line ~346)
export { cardVariants } from "./design-system/primitives/Card";
// HiveCard alias for backwards compatibility (admin app uses this)
export { Card as HiveCard } from "./design-system/primitives";
// NOTE: CardProps type already exported above

// HiveModal - Use Modal from design-system
// Already exported above from design-system primitives

// HiveConfirmModal - Use ConfirmDialog from design-system
// NOTE: ConfirmDialog/useConfirmDialog exported below at line ~826

// Modal (Design System - Jan 2026)
export {
  Modal,
  ModalTrigger,
  ModalPortal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
  modalContentVariants,
} from "./design-system/primitives";
export type {
  ModalContentProps,
  ModalBodyProps,
} from "./design-system/primitives";
// NOTE: useModal - Use useState for open/close state management

// Drawer (Design System - Jan 2026)
export {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
  drawerContentVariants,
} from "./design-system/components/Drawer";
export type {
  DrawerContentProps,
} from "./design-system/components/Drawer";

// Accordion - Removed: TypeScript type issue with Radix types
// TODO: Fix AccordionProps interface extension issue

// Collapsible (Design System - Jan 2026)
export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  SimpleCollapsible,
  CollapsibleCard,
  collapsibleTriggerVariants,
} from "./design-system/components/Collapsible";
export type {
  CollapsibleProps,
  CollapsibleTriggerProps,
  CollapsibleContentProps,
  SimpleCollapsibleProps,
  CollapsibleCardProps,
} from "./design-system/components/Collapsible";

// ScrollArea - Removed: needs @radix-ui/react-scroll-area dependency
// TODO: Install @radix-ui/react-scroll-area to re-enable

// Stepper (Design System - Jan 2026)
export {
  Stepper,
  DotStepper,
  ProgressStepper,
  stepVariants,
  connectorVariants,
} from "./design-system/components/Stepper";
export type {
  StepperProps,
  Step,
  DotStepperProps,
  ProgressStepperProps,
} from "./design-system/components/Stepper";

// Callout - Removed: Type mismatch (HTMLDivElement vs HTMLQuoteElement)
// TODO: Fix QuoteCallout ref type

// NumberInput (Design System - Jan 2026)
export {
  NumberInput,
  SimpleNumberInput,
  CurrencyInput,
  PercentInput,
  numberInputVariants,
} from "./design-system/components/NumberInput";
export type {
  NumberInputProps,
  SimpleNumberInputProps,
  CurrencyInputProps,
  PercentInputProps,
} from "./design-system/components/NumberInput";

// Combobox - Removed: depends on Popover which needs @radix-ui/react-hover-card
// TODO: Fix Combobox dependency on Popover's hover-card

// NotificationBanner (Design System - Jan 2026)
// NOTE: NotificationBanner already exported above (line ~102)
export {
  NotificationBannerStack,
  bannerVariants,
} from "./design-system/components/NotificationBanner";
export type {
  NotificationBannerProps,
  NotificationBannerStackProps,
} from "./design-system/components/NotificationBanner";

// TabNav (Design System - Jan 2026)
export {
  TabNav,
  TabPanel,
  tabNavVariants,
  tabItemVariants,
} from "./design-system/components/TabNav";
export type {
  TabNavProps,
  TabPanelProps,
  TabItem,
} from "./design-system/components/TabNav";

// ProgressBar (Design System - Jan 2026)
export {
  ProgressBar,
  ProgressCircle,
  ProgressSteps as ProgressStepsNew,
  progressFillVariants,
} from "./design-system/components/ProgressBar";
export type {
  ProgressBarProps,
  ProgressCircleProps,
  ProgressStepsProps,
} from "./design-system/components/ProgressBar";

// ConfirmDialog & HiveConfirmModal (Design System - Jan 2026)
export {
  ConfirmDialog,
  HiveConfirmModal,
  useConfirmDialog,
} from "./design-system/components/ConfirmDialog";
export type {
  ConfirmDialogProps,
  HiveConfirmModalProps,
  UseConfirmDialogOptions,
} from "./design-system/components/ConfirmDialog";

// ThreadDrawer (Design System - Jan 2026)
export {
  ThreadDrawer,
  type ThreadDrawerProps,
  type ChatMessageData as ThreadMessage,
} from "./design-system/components/ThreadDrawer";

// TagInput (Design System - Jan 2026)
export {
  TagInput,
  Tag,
  tagVariants,
} from "./design-system/components/TagInput";
export type {
  TagInputProps,
  TagProps,
} from "./design-system/components/TagInput";

// ToggleGroup (Design System - Jan 2026)
export {
  ToggleGroup,
  ToggleButton,
  toggleGroupVariants,
  toggleItemVariants,
} from "./design-system/components/ToggleGroup";
export type {
  ToggleGroupProps,
  ToggleButtonProps,
  ToggleOption,
} from "./design-system/components/ToggleGroup";

// AspectRatio - Removed: needs @radix-ui/react-aspect-ratio dependency
// TODO: Install @radix-ui/react-aspect-ratio to re-enable

// Note: VisuallyHidden, Portal, and Slot are exported from ./a11y and ./patterns above
// Design-system versions have extended variants - use direct imports if needed:
// - "./design-system/components/VisuallyHidden" (VisuallyHiddenInput, FocusableVisuallyHidden)
// - "./design-system/components/Portal" (PortalWithContainer, TooltipPortal, ToastPortal)
// - "./design-system/components/Slot" (Slottable, SlotClone, mergeProps, composeRefs, useSlot)

// Pagination (Design System - Jan 2026)
export {
  Pagination,
  SimplePagination,
  CompactPagination,
  paginationItemVariants,
} from "./design-system/components/Pagination";
export type {
  PaginationProps,
  SimplePaginationProps,
  CompactPaginationProps,
} from "./design-system/components/Pagination";

// Grid - REMOVED (Use CSS Grid or GridLayout from recipes)
// NOTE: Use GridLayout from recipes or native CSS Grid

// HiveLogo - RE-ADDED (exported from ./design-system/templates/Shell)
// NOTE: Exported above in line ~540

// Typography (Using design-system primitives)
export { Heading, headingVariants } from "./design-system/primitives/Heading";
export type { HeadingProps } from "./design-system/primitives/Heading";
export { Text, textVariants } from "./design-system/primitives/Text";
export type { TextProps } from "./design-system/primitives/Text";
export { DisplayText, displayTextVariants } from "./design-system/primitives/DisplayText";
export type { DisplayTextProps } from "./design-system/primitives/DisplayText";

export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
} from "./components/ui/input-otp";

// Icon - Use Icon primitive from design-system
export { Icon, iconVariants } from "./design-system/primitives/Icon";
export type { IconProps } from "./design-system/primitives/Icon";

// Feed atoms - REMOVED (Use Card + Progress primitives instead)
// NOTE: MediaThumb, PercentBar, VoteBar, PostCard were in atomic/ (now deleted)
// Use Card for post cards, Progress/ProgressBar for vote bars

// Space Mobile Navigation
export { SpaceMobileNav } from "./shells/SpaceMobileNav";
export type { SpaceMobileNavProps, SpaceTab } from "./shells/SpaceMobileNav";

// Page-level surfaces - DISABLED
// NOTE: Legacy prototype pages with type mismatches pending design system migration
// export {
//   FeedPage,
//   SpacesDiscoveryPage,
//   SpaceCard,
//   ProfileOverviewPage,
//   ProfileViewLoadingSkeleton,
//   HiveLabToolsPage,
//   OnboardingFlowPage,
//   ToolAnalyticsPage,
//   ToolPreviewPage,
//   ToolEditPage,
// } from "./pages";
// export type {
//   FeedPageProps,
//   SpacesDiscoveryPageProps,
//   SpaceCardProps,
//   SpaceCardData,
//   ProfileOverviewPageProps,
//   HiveLabToolsPageProps,
//   OnboardingFlowPageProps,
//   ToolAnalyticsPageProps,
//   ToolAnalyticsData,
//   ToolPreviewPageProps,
//   ToolEditPageProps,
// } from "./pages";

// Space discovery/loading skeletons - DISABLED (type mismatches)
// export { SpacesDiscoverySkeleton } from "./pages/spaces/SpacesSkeletons";

// NOTE: SpaceHeader was removed - use PremiumHeader from premium exports instead
// Storybook imports from dist/ will continue to work (compiled code exists).
// New components should be atoms (primitives) placed in atomic/atoms/

// New P0 Components - Feed, Spaces, Rituals (Nov 2024)

// Feed Organisms - REMOVED (Use Card-based layouts from design-system)
// NOTE: FeedCardSystem, FeedCardPost, FeedCardEvent, FeedCardTool were in atomic/ (now deleted)
// Use Card + custom layouts for feed items
// Use EventCard from design-system for events

// Post Detail Modal - REMOVED (Use Modal + custom content)
// NOTE: PostDetailModal was in atomic/ (now deleted)

// Feed Molecules - REMOVED
// NOTE: FeedFilterBar - Use TabNav or ToggleGroup
// NOTE: FeedComposerSheet - Use Sheet + ChatComposer
// NOTE: FeedVirtualizedList - Use react-window for virtualization

// Notification containers - REMOVED (Use ToastContainer from design-system)
// NOTE: NotificationToastContainer, NotificationSystem were in atomic/ (now deleted)
// Use ToastContainer and NotificationBanner from design-system
// Stub for backwards compatibility:
export const NotificationSystem: React.FC<{
  notifications?: unknown[];
  unreadCount?: number;
  loading?: boolean;
  error?: Error | string | null;
  onNavigate?: (url: string) => void;
  className?: string;
  disabled?: boolean;
}> = () => null; // Deprecated - use Toaster from design-system

// Welcome mat - REMOVED (Jan 2026)
// Legacy WelcomeMat was deprecated. Entry flow now uses /enter with evolving sections.

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
export { ToolCanvas, ToolErrorBoundary } from "./components/hivelab/tool-canvas";
export type { ToolCanvasProps, ToolElement, ToolCanvasContext } from "./components/hivelab/tool-canvas";

// HiveLab: Tool Runtime Provider (context injection for space-deployed tools)
export {
  ToolRuntimeProvider,
  useToolRuntimeContext,
  useToolContext,
  useToolSpaceContext,
  useToolMemberContext,
  useToolTemporalContext,
  useToolCapabilities,
  useToolCapability,
  useHasRole,
  useIsSpaceLeader,
} from "./components/hivelab/tool-runtime-provider";
export type { ToolRuntimeProviderProps } from "./components/hivelab/tool-runtime-provider";

// HiveLab: Element Renderers
export {
  renderElement,
  renderElementSafe,
  isElementSupported,
  getSupportedElementTypes,
} from "./components/hivelab/element-renderers";

// HiveLab: Element Showcase (removed)

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

// HiveLab: Setups (Orchestrated Tool Bundles)
export { SetupDeployWizard } from "./components/hivelab/SetupDeployWizard";
export type { SetupDeployWizardProps, SetupTemplateItem, SetupDeployConfig } from "./components/hivelab/SetupDeployWizard";

export { SetupDashboard } from "./components/hivelab/SetupDashboard";
export type { SetupDashboardProps, SetupDeploymentItem, SetupToolItem, OrchestrationRuleItem, OrchestrationLogItem } from "./components/hivelab/SetupDashboard";

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

export { useConnectionCascade } from "./hooks/hivelab/use-connection-cascade";
export type {
  CascadeContext,
  CascadeResult,
} from "./hooks/hivelab/use-connection-cascade";

// Space Molecules - REMOVED (Use design-system components)
// NOTE: SpaceAboutWidget, SpaceToolsWidget, LeaderSetupProgress were in atomic/ (now deleted)
// Use Card + ProfileCard patterns for about widgets
// Use Stepper for setup progress

// Space Discovery Components (Jan 2026 - Migrated to design-system)
// MomentumIndicator - Use ActivityEdge from design-system
export { ActivityEdge, activityEdgeVariants, getWarmthFromActiveUsers } from "./design-system/primitives/ActivityEdge";
export type { ActivityEdgeProps } from "./design-system/primitives/ActivityEdge";

// CategoryPill, ActivityBadge - Use Badge from design-system
// NOTE: Badge, DotBadge, CountBadge, badgeVariants already exported above (line ~332)

// MemberStack - Already exported as AvatarGroup above

// Glass morphism - REMOVED (Use Card with glass CSS classes)
// NOTE: GlassSurface, GlassCard, etc. - Use Card + glass-morphism from lib/glass-morphism

// Sticky rail - REMOVED (Use Sidebar from design-system)
// NOTE: StickyRail, SpaceSidebarRail - Use Sidebar component

// Space Discovery molecules - REMOVED
// NOTE: SpaceDiscoveryCard, SpaceHeroCard, CategoryFilterBar, DiscoverySectionHeader
// Use Card + SpaceHeader from design-system

// CollapsibleWidget - Use Collapsible from design-system
// NOTE: Collapsible components already exported above (line ~731)

// Mobile sections - REMOVED (Use Card + responsive design)
// Empty states - REMOVED (Use EmptyState from design-system when fixed)
// Space layouts - REMOVED (Use Shell/Stream/Grid templates)

// Space Sidebar - Use Sidebar from design-system
// Already exported as MinimalSidebar above

// SpaceDetailHeader - Use SpaceHeader from design-system
export { SpaceHeader, SpaceHeaderCompact } from "./design-system/components/SpaceHeader";
export type { SpaceHeaderProps, SpaceHeaderCompactProps, MembershipState } from "./design-system/components/SpaceHeader";

// Phase 2: Territory-First Components (Jan 2026)
// SpaceCard - Immersive portal layout
export { SpaceCard, SpaceCardSkeleton, territoryConfig } from "./design-system/components/SpaceCard";
export type { SpaceCardProps, SpaceTerritory } from "./design-system/components/SpaceCard";

// GhostSpaceCard - Unclaimed space variant
export { GhostSpaceCard, GhostSpaceCardSkeleton } from "./design-system/components/GhostSpaceCard";
export type { GhostSpaceCardProps } from "./design-system/components/GhostSpaceCard";

// BoardTabs - REMOVED Feb 2026

// SpacePanel - 40% sidebar with NOW/NEXT UP/PINNED sections
export { SpacePanel, SpacePanelSkeleton, NowSection, NextUpSection, PinnedSection } from "./design-system/components/SpacePanel";
export type { SpacePanelProps, OnlineMember as SpacePanelOnlineMember, UpcomingEvent, PinnedItem } from "./design-system/components/SpacePanel";


// Premium UI Components - REMOVED (Use design-system components)
// NOTE: PremiumHeader - Use SpaceHeader from design-system
// NOTE: PremiumBoardTabs - Use Tabs from design-system
// NOTE: PremiumMessage - Use ChatMessage from design-system
// NOTE: PremiumMessageList - Use MessageGroup from design-system
// NOTE: PremiumChatBoard - Use TheaterChatBoard from design-system/components/spaces
// NOTE: PremiumComposer - Use ChatComposer from design-system
// NOTE: PremiumSidebar - Use Sidebar from design-system

// Use design-system chat components
export { ChatMessage } from "./design-system/components/ChatMessage";
export type { ChatMessageProps } from "./design-system/components/ChatMessage";
export { MessageGroup, groupMessages } from "./design-system/components/MessageGroup";
export type { MessageGroupProps } from "./design-system/components/MessageGroup";

// Space Tab Navigation - Use TabNav from design-system
// NOTE: TabNav already exported above (line ~798)

// Space Celebrations - REMOVED Feb 2026

// Space Welcome Modal - REMOVED (Use Modal + custom content)
// NOTE: SpaceWelcomeModal, SpaceLeaderOnboardingModal were in atomic/ (now deleted)
// Use Modal + Stepper for onboarding flows

// Brand Spinner (Dec 2025 - configurable colors, neutral by default)
export {
  BrandSpinner,
  BrandSpinnerInline,
  GoldSpinner, // deprecated - use BrandSpinner with variant="gold"
  GoldSpinnerInline, // deprecated - use BrandSpinnerInline with variant="gold"
  SPINNER_VARIANTS,
} from "./components/motion-primitives/gold-spinner";
export type {
  BrandSpinnerProps,
  GoldSpinnerProps, // deprecated alias
} from "./components/motion-primitives/gold-spinner";

// Ritual Molecules - REMOVED (Use ProgressBar from design-system)
// NOTE: RitualProgressBar was in atomic/ (now deleted)
// Use ProgressBar or ProgressSteps from design-system

// Privacy Control - REMOVED (Use Switch + FormField from design-system)
// NOTE: PrivacyControl, BulkPrivacyControl were in atomic/ (now deleted)
// Build with SwitchField from design-system

// Note: Sheet components now exported from design-system above (line ~340)

// Admin dashboard primitives (moved to apps/admin)
// export {
//   AdminShell,
//   AdminTopBar,
//   AdminNavRail,
//   AdminMetricCard,
//   StatusPill,
//   AuditLogList,
//   ModerationQueue,
// } from "./atomic/07-Admin/organisms";
// export type {
//   AdminShellProps,
//   AdminNavItem,
//   AdminTopBarProps,
//   AdminNavRailProps,
//   AdminMetricCardProps,
//   StatusPillProps,
//   AuditLogEvent,
//   AuditLogListProps,
//   ModerationQueueItem,
//   ModerationQueueProps,
// } from "./atomic/07-Admin/organisms";

// export {
//   RitualFeedBannerCard,
//   type RitualFeedBannerCardProps,
// } from "./atomic/06-Rituals/organisms/ritual-feed-banner";

// Profile Molecules - REMOVED (Use design-system profile components)
// NOTE: ProfileBentoGrid, ProfileToolCard, ProfileToolWidget, ProfileToolModal were in atomic/ (now deleted)
// Use ProfileCard, ProfileHero, ProfileToolsCard from design-system/components/profile

// Feed Templates - REMOVED (Use Stream template from design-system)
// NOTE: FeedPageLayout, FeedLoadingSkeleton were in atomic/ (now deleted)
// Use Stream template for feed layouts, Skeleton components for loading

// Loading Skeletons - REMOVED (Use Skeleton components from design-system)
// NOTE: PostComposerSkeleton, SpaceBoardSkeleton, SpaceCardSkeleton were in atomic/ (now deleted)
// Use Skeleton, SkeletonCard, SkeletonText from design-system primitives

// Space Organisms - REMOVED (Use design-system components)
// NOTE: SpacePostComposer - Use ChatComposer from design-system
// NOTE: AddTabModal, AddWidgetModal, MemberInviteModal, EventCreateModal, EventDetailsModal - Use Modal + FormField
// NOTE: SpaceChatBoard - Use TheaterChatBoard from design-system/components/spaces
// NOTE: BoardTabBar - Use TabNav from design-system
// NOTE: MobileActionBar, MobileDrawer, ThreadDrawer - Use Drawer from design-system
// NOTE: PinnedMessagesWidget, SidebarToolSlot, SpaceBreadcrumb - Use Card/Breadcrumb components
// NOTE: Widget priority, SpaceSidebarConfigurable, WidgetGallery - Removed
// NOTE: SpaceEntryAnimation, SpaceThreshold - Use PageTransition/ModeTransition
// NOTE: ContextPanel - Use Drawer from design-system
// NOTE: ChatToolbar - Use ToggleGroup from design-system

// Spaces (simplified Feb 2026 - Hub/Theater/Modes/Boards removed)
export {
  ContextPill,
  ContextPillMobile,
  ChatRowMessage,
  SystemMessage,
  DateSeparator,
  ChatTypingDots,
  ChatTypingDotsCompact,
  ChatTypingDotsInline,
  SpaceThreshold,
  JoinRequestsPanel,
} from "./design-system/components/spaces";
export type {
  ChatRowMessageProps,
  ChatRowMessageAuthor,
  ChatRowMessageReaction,
  SystemMessageProps,
  DateSeparatorProps,
  ChatTypingDotsProps,
  ChatTypingDotsCompactProps,
  ChatTypingDotsInlineProps,
  TypingUser,
  SpaceThresholdProps,
  JoinRequestsPanelProps,
  JoinRequestItem,
  JoinRequestUser,
  PinnedMessage,
  SpaceFeature,
  SpaceLeaderInfo,
} from "./design-system/components/spaces";

// Ritual Organisms - REMOVED (Use Card from design-system)
// NOTE: RitualStrip, RitualCard, RitualFoundingClass, RitualSurvival, RitualTournamentBracket were in atomic/ (now deleted)
// NOTE: RitualsPageLayout - Use Grid template from design-system

// Profile Layout - REMOVED (Use Grid template from design-system)
// NOTE: ProfileViewLayout was in atomic/ (now deleted)

// Layout Primitives (Jan 2026 - Using design-system templates)
// NOTE: Shell from atomic/ replaced by Shell template from design-system
export { PageHeader, SectionHeader } from "./layout/page-header";
export type { PageHeaderProps, SectionHeaderProps } from "./layout/page-header";
export { CollapsiblePageHeader } from "./layout/collapsible-page-header";
export type { CollapsiblePageHeaderProps, TabItem as HeaderTabItem } from "./layout/collapsible-page-header";

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

// HiveLab: App Surface (P0 - Full-screen app mode within Spaces)
export { AppBreadcrumb } from "./components/hivelab/app-breadcrumb";
export { AppSurface, CapabilityContext, useCapabilities } from "./components/hivelab/app-surface";
export type { AppSurfaceProps } from "./components/hivelab/app-surface";

// HiveLab: Inline element renderer (for chat messages)
export { InlineElementRenderer } from "./components/hivelab/inline-element-renderer";
export type {
  InlineElementRendererProps,
  ComponentData,
  InlineComponentData,
} from "./components/hivelab/inline-element-renderer";

// HiveLab: Automations (removed)

// ============================================
// HIVELAB: LEGACY STUDIO EXPORTS (REMOVED)
// NOTE: HiveLabStudio, HiveLabElementPalette, HiveLabInspectorPanel,
// HiveLabLintPanel, HiveLabToolLibraryCard were in atomic/ (now deleted).
// Use HiveLabIDE and its sub-components from ./components/hivelab/ide instead:
// - HiveLabIDE (main component)
// - IDEToolbar, IDECanvas, AICommandPalette, ElementPalette
// - LayersPanel, PropertiesPanel
// ============================================

// ============================================
// HIVELAB: SKELETONS (REMOVED)
// NOTE: ToolLibrarySkeleton, ToolCardSkeleton, ToolExecutionSkeleton,
// ToolListItemSkeleton were in atomic/ (now deleted).
// Use Skeleton composites from design-system/primitives/Skeleton:
// - Skeleton, SkeletonText, SkeletonCard, SkeletonListItem
// ============================================

// ============================================
// HIVELAB: SETUP GALLERY (REMOVED)
// NOTE: SetupCard, SetupGrid were in atomic/ (now deleted).
// Use Card + Grid layout patterns instead.
// ============================================

// ============================================
// PROFILE WIDGETS - Mapped to design-system/components/profile
// ============================================

// ProfileIdentityWidget → ProfileHero
export { ProfileHero as ProfileIdentityWidget } from "./design-system/components/profile";
export type { ProfileHeroProps as ProfileIdentityWidgetProps } from "./design-system/components/profile";


// ProfileSpacesWidget → ProfileSpacesCard
export { ProfileSpacesCard as ProfileSpacesWidget } from "./design-system/components/profile";
export type { ProfileSpacesCardProps as ProfileSpacesWidgetProps } from "./design-system/components/profile";
export type { ProfileSpace as ProfileSpaceItem } from "./design-system/components/profile";

// ProfileConnectionsWidget → ProfileConnectionsCard
export { ProfileConnectionsCard as ProfileConnectionsWidget } from "./design-system/components/profile";
export type { ProfileConnectionsCardProps as ProfileConnectionsWidgetProps } from "./design-system/components/profile";
export type { ProfileConnection as ProfileConnectionItem } from "./design-system/components/profile";

// ============================================
// PROFILE: REMOVED EXPORTS
// NOTE: ProfileCompletionCard was in atomic/ (now deleted).
// Use Stepper + Card composites for completion flows.
//
// NOTE: HiveLabWidget was in atomic/ (now deleted).
// Use ProfileToolsCard from design-system/components/profile.
// ============================================

// ProfileHiveLabWidget → ProfileToolsCard
export { ProfileToolsCard as ProfileHiveLabWidget } from "./design-system/components/profile";
export type { ProfileToolsCardProps as ProfileHiveLabWidgetProps } from "./design-system/components/profile";
export type { ProfileTool as ProfileToolItem } from "./design-system/components/profile";

// ConnectButton - Friend request button with state machine
export { ConnectButton } from "./design-system/components/profile";
export type { ConnectButtonProps, ConnectionState } from "./design-system/components/profile";

// ============================================
// PROFILE: COMING SOON (REMOVED)
// NOTE: ProfileComingSoonSection was in atomic/ (now deleted).
// Use EmptyState or Card with custom content.
// ============================================

// ============================================
// CHAT COMPONENTS - Mapped to design-system
// NOTE: atomic/03-Chat has been deleted.
// Most components map to design-system/components/ChatMessage,
// ChatComposer, and spaces/ChatRowMessage.
// ============================================

// MessageBubble → ChatMessage
export { ChatMessage as MessageBubble } from "./design-system/components/ChatMessage";
export type { ChatMessageProps as MessageBubbleProps } from "./design-system/components/ChatMessage";

// ChatInput → ChatComposer
// NOTE: ChatComposer exports already above (line ~600)
export { ChatComposer as ChatInput } from "./design-system/components/ChatComposer";
export type { ChatComposerProps as ChatInputProps } from "./design-system/components/ChatComposer";

// TypingIndicator → TypingIndicator primitive
export { TypingIndicator, TypingDotsOnly, TypingDots } from "./design-system/primitives/TypingIndicator";
export type { TypingIndicatorProps, TypingDotsOnlyProps } from "./design-system/primitives/TypingIndicator";

// ============================================
// CHAT: REMOVED EXPORTS
// NOTE: The following were in atomic/03-Chat (now deleted):
// - MessageList: Use MessageGroup + map
// - ConversationThread: Build with Card + MessageGroup
// - EmptyChatState: Use EmptyState from design-system
// - ToolPreviewCard: Use ToolCard from design-system/components
// - MobilePreviewSheet: Use Sheet + ToolCard
// - IntentConfirmation, IntentConfirmationInline: Build with Card + Button
// - FloatingComposer: Use ChatComposer with fixed positioning
// ============================================

// Parsed slash command data (for slash command handling)
export interface SlashCommandData {
  command: string;
  primaryArg?: string;
  listArgs: string[];
  flags: Record<string, string | boolean | number>;
  raw: string;
  isValid: boolean;
  error?: string;
}

// Chat-based Landing Page - DISABLED (type mismatches)
// export { AILandingPageChat } from "./pages/hivelab/AILandingPageChat";
// export type { AILandingPageChatProps } from "./pages/hivelab/AILandingPageChat";

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
  HeaderBar,
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
  PageMode,
  CanvasState,
  HistoryEntry,
  IDEState,
  IDEActions,
  KeyboardShortcut,
} from "./components/hivelab/ide";

// HiveLab: Deploy Takeover (Full-screen deployment experience)
export {
  DeployTakeover,
  ToolCard as DeployToolCard,
  FlightAnimation,
  SuccessRecap,
} from "./components/hivelab/deploy";
export type { DeployPhase } from "./components/hivelab/deploy";

// ============================================
// ATMOSPHERE SYSTEM (Jan 2026 - Global Context)
// ============================================

export {
  AtmosphereProvider,
  useAtmosphere,
  useAtmosphereOptional,
  useAtmosphereLevel,
  atmospherePresets,
  densityMultipliers,
  getWarmthCSS,
  getWarmthFromActivity,
  isGoldAllowed,
  getAtmosphereClasses,
  getDensityClasses,
} from "./design-system/AtmosphereProvider";

export type {
  AtmosphereLevel,
  Density,
  WarmthLevel,
  AtmosphereState,
  AtmosphereContextValue,
  AtmosphereProviderProps,
} from "./design-system/AtmosphereProvider";

// ============================================
// CAMPUS NAVIGATION (Jan 2026 - Global Navigation)
// Apple-inspired navigation with Command Bar + Campus Dock
// ============================================

// Provider
export {
  CampusProvider,
  useCampus,
  useCampusOptional,
} from "./design-system/components/campus";
export type {
  CampusContextValue,
  CampusProviderProps,
  DrawerState,
} from "./design-system/components/campus";

// Command Bar
export { CommandBar } from "./design-system/components/campus";
export type {
  CommandBarProps,
  CommandBarUser,
  CommandBarNotification,
} from "./design-system/components/campus";

// Campus Dock, DockOrb, DockPreviewCard, CampusDrawer - REMOVED Feb 2026

// ============================================
// PROFILE COMPONENTS (Jan 2026 - Profile Rebuild)
// Viral UI components with presence ring, activity heatmap
// ============================================

export {
  // 3-Zone Profile Layout (New - Design Sprint)
  ProfileIdentityHero,
  ProfileActivityCard,
  ProfileLeadershipCard,
  ProfileEventCard,
  ProfileSpacePill,
  ProfileConnectionFooter,
  ProfileOverflowChip,
  // Belonging-First Profile (v2 - Profile Redesign)
  ProfileBelongingSpaceCard,
  ProfileSharedBanner,
  // Legacy Profile Components
  ProfileCard,
  ProfileHero,
  ProfileStatsRow,
  ContextBanner,
  ProfileSpacesCard,
  ProfileToolsCard,
  ProfileConnectionsCard,
  ProfileInterestsCard,
  ProfileStatsWidget,
  ProfileFeaturedToolCard,
} from "./design-system/components/profile";

export type {
  // 3-Zone Profile Layout Types (New)
  ProfileIdentityHeroUser,
  ProfileIdentityHeroProps,
  ProfileBadge,
  ProfileActivityTool,
  ProfileActivityCardProps,
  ProfileLeadershipSpace,
  ProfileLeadershipCardProps,
  ProfileEvent,
  ProfileEventCardProps,
  ProfileSpacePillSpace,
  ProfileSpacePillProps,
  ProfileConnectionFooterProps,
  ProfileOverflowChipProps,
  // Belonging-First Profile Types (v2)
  BelongingSpace,
  ProfileBelongingSpaceCardProps,
  ProfileSharedBannerProps,
  // Legacy Profile Types
  ProfileCardProps,
  ProfileHeroProps,
  ProfileHeroUser,
  ProfileHeroPresence,
  ProfileHeroBadges,
  ProfileStatsRowProps,
  ContextBannerProps,
  ProfileSpacesCardProps,
  ProfileSpace,
  ProfileToolsCardProps,
  ProfileTool,
  ProfileConnectionsCardProps,
  ProfileConnection,
  ProfileInterestsCardProps,
  ProfileStatsWidgetProps,
  ProfileFeaturedToolCardProps,
  FeaturedTool,
  ActivityContribution,
} from "./design-system/components/profile";

// ============================================
// ATOMS (Feb 2026)
// Canonical atoms — one treatment everywhere
// ============================================

export {
  StatAtom,
} from "./design-system/primitives";

export type {
  StatAtomProps,
} from "./design-system/primitives";

// ============================================
// HIVELAB PAGE COMPONENTS (Jan 2026)
// Tool analytics and preview pages for HiveLab app
// ============================================

export {
  ToolAnalyticsPage,
  ToolPreviewPage,
  // Page Skeletons - Premium loading states with staggered animations
  FeedLoadingSkeleton,
  ProfileViewLoadingSkeleton,
  SpacesDiscoverySkeleton,
  SpaceDetailSkeleton,
  SpaceCreationSkeleton,
} from "./pages";

export type {
  ToolAnalyticsPageProps,
  ToolAnalyticsData,
  ToolPreviewPageProps,
} from "./pages";

// ============================================
// SPACE MODAL COMPONENTS (from design-system)
// ============================================

export {
  MemberInviteModal,
  EventCreateModal,
  EventDetailsModal,
  SpaceLeaderOnboardingModal,
  SpaceWelcomeModal,
  SpaceEntryAnimation,
  MobileActionBar,
  MobileDrawer,
  PinnedMessagesWidget,
  LeaderSetupProgress,
} from "./design-system/components/spaces";

export type {
  MemberInviteInput,
  InviteableUser,
  MemberInviteModalProps,
  EventCreateInput,
  EventCreateModalProps,
  RSVPStatus,
  SpaceEventDetails,
  EventDetailsModalProps,
  MobileDrawerType,
  MobileActionBarProps,
  MobileDrawerProps,
  SetupTask,
  LeaderSetupProgressProps,
  PinnedMessagesWidgetProps,
  SpaceLeaderOnboardingModalProps,
  SpaceWelcomeModalProps,
  SpaceEntryAnimationProps,
} from "./design-system/components/spaces";

export { ProfileToolModal } from "./design-system/components/profile";

// Moderation components
export {
  ReportContentModal,
  type ReportContentModalProps,
  type ReportContentInput,
  type ReportContentType,
  type ReportCategory,
} from "./design-system/components/moderation";

// ============================================
// LEGACY TYPE ALIASES (Backwards Compatibility)
// These types were in deprecated-components.tsx
// ============================================

export interface ProfileToolModalData {
  id?: string;
  name?: string;
  description?: string;
  toolId?: string;
  deploymentId?: string;
  icon?: string;
  usageCount?: number;
  deployedSpaces?: string[];
  deployedToSpaces?: string[];
}

// IntentType re-exported from spaces above
type LocalIntentType = 'create_event' | 'invite_member' | 'add_tool' | 'ask_question' | 'general' | 'unknown' | 'none' | 'help' | 'countdown' | 'poll' | 'rsvp' | 'announcement';

export interface DetectedIntent {
  type?: LocalIntentType;
  confidence?: number;
  entities?: Record<string, unknown>;
  hasIntent?: boolean;
  intentType?: LocalIntentType;
}

export type FeatureKey =
  | 'chat'
  | 'events'
  | 'tools'
  | 'boards'
  | 'members'
  | 'settings'
  | 'analytics';

export interface SpaceFeatureHighlight {
  feature?: FeatureKey;
  title: string;
  description: string;
  type?: string;
  count?: number;
}

export interface RitualData {
  id: string;
  name: string;
  description?: string;
  type?: string;
  status?: string;
  participants?: number;
  participantCount?: number;
  icon?: string;
  progress?: number;
  duration?: string | number;
  startDate?: Date | string;
  endDate?: Date | string;
  frequency?: string;
  category?: string;
  isParticipating?: boolean;
  archetype?: string;
  isCompleted?: boolean;
}

export interface SetupCardData {
  id: string;
  title: string;
  description?: string;
  image?: string;
  category?: string;
}

export type InputStatus = 'default' | 'success' | 'error' | 'warning' | 'loading' | 'idle';

export interface OnboardingTask {
  id: string;
  label: string;
  title?: string;
  description?: string;
  completed: boolean;
  action?: 'deploy-tool' | 'create-event' | 'invite-members' | 'customize-sidebar' | (() => void);
}

export interface FoundingClassRitualData extends RitualData {
  foundingMembers?: string[];
  deadline?: Date;
}

// ChatMessageData - Use SpaceChatMessageData from spaces export above
// SpaceBoardData - Use SpaceChatBoardData from spaces export above

// ============================================
// DEPRECATED STUBS (Minimal placeholders)
// ============================================

import * as React from 'react';

/** @deprecated Use Modal from design-system/primitives */
export const HiveModal: React.FC<{
  children?: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  size?: string;
}> = ({ children }) => (children ? React.createElement(React.Fragment, null, children) : null);

/** @deprecated Use AppShell or layout components */
export const Shell: React.FC<{
  children?: React.ReactNode;
  size?: string;
  noVerticalPadding?: boolean;
}> = ({ children }) => React.createElement('div', { className: 'min-h-screen bg-ground' }, children);

/** @deprecated Use ProfileCard components from design-system */
export const ProfileBentoGrid: React.FC<{
  userId?: string;
  isEditable?: boolean;
  editable?: boolean;
  profile?: unknown;
  onLayoutChange?: (layout: unknown) => void;
}> = () => null;

/** @deprecated Rituals not yet implemented */
export const RitualFoundingClass: React.FC<{ ritual?: RitualData; isParticipating?: boolean; onJoin?: () => void | Promise<void> }> = () => null;
export const RitualSurvival: React.FC<{ ritual?: RitualData; isParticipating?: boolean; onVote?: (matchId: string, choice: string) => void }> = () => null;
export const RitualTournamentBracket: React.FC<{ ritual?: RitualData; isParticipating?: boolean }> = () => null;
export const RitualsPageLayout: React.FC<{ children?: React.ReactNode; rituals?: RitualData[]; featuredRitual?: RitualData }> = ({ children }) => React.createElement(React.Fragment, null, children);
export const RitualStrip: React.FC<{ rituals?: RitualData[]; onRitualClick?: (id: string) => void }> = () => null;
export const SetupGrid: React.FC<{ items?: SetupCardData[]; onItemClick?: (id: string) => void }> = () => null;
export const SpaceBoardSkeleton: React.FC = () => null;
export const AILandingPageChat: React.FC<{ onSubmit?: (message: string) => void; templates?: unknown[] }> = () => null;
export const NotificationBell: React.FC<{ notifications?: unknown[]; unreadCount?: number }> = () => null;

/** @deprecated Use design-system hooks */
export function useSpaceWelcome(_spaceId?: string) {
  return {
    showWelcome: false,
    shouldShow: false,
    isLoading: false,
    setShowWelcome: () => {},
    dismissWelcome: () => {},
    features: [] as SpaceFeatureHighlight[],
  };
}

// Backwards compatibility: export toast object with methods
// Some files import { toast } from '@hive/ui' and call toast.success/toast.error
// They should use useToast() hook instead, but this provides a fallback
const toastLog = (type: string) => (title: string, description?: string) => {
  console.warn(`toast.${type}() is deprecated. Use useToast() hook instead.`);
  console.log(`[Toast ${type}] ${title}${description ? `: ${description}` : ''}`);
};

export const toast = Object.assign(
  (message: string, description?: string) => {
    console.warn('toast() is deprecated. Use useToast() hook instead.');
    console.log(`Toast: ${message}${description ? ` - ${description}` : ''}`);
  },
  {
    success: toastLog('success'),
    error: toastLog('error'),
    warning: toastLog('warning'),
    info: toastLog('info'),
  }
);

// GSAP Scroll Effects - REMOVED (Jan 2026)
// NOTE: GSAP scroll hooks have been removed. Use Framer Motion instead:
// - ParallaxText from design-system/primitives for parallax effects
// - useScroll + useTransform from framer-motion for custom parallax
