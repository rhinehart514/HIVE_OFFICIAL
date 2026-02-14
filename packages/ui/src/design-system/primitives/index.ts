/**
 * HIVE Primitives
 * Source: docs/design-system/PRIMITIVES.md
 *
 * Atomic building blocks for the HIVE design system.
 * All primitives use CSS variables from tokens.css.
 */

// ============================================
// TOKENS
// ============================================

export { MOTION } from '../../tokens';
export type {
  EaseType,
  DurationType,
  StaggerType,
  ViewportType,
  SpringType,
  ParallaxType,
} from '../../tokens';

// Density tokens
export {
  DENSITY,
  DENSITY_CONTEXTS,
  getDensityConfig,
  getDensityClasses,
  getDensityForContext,
} from '../../tokens';
export type {
  DensityLevel,
  DensityContext,
} from '../../tokens';

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
  LoadingState,
  SkeletonBox,
  SkeletonCircle,
  SkeletonText as LoadingSkeletonText,
  Spinner,
  type LoadingStateProps,
  type LoadingVariant,
  type LoadingSize,
} from './LoadingState';

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
  Tag,
  tagVariants,
  type TagProps,
} from './Tag';

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
  TypingIndicator,
  TypingDotsOnly,
  TypingDots,
  typingIndicatorVariants,
  formatTypingText,
  type TypingIndicatorProps,
  type TypingDotsOnlyProps,
} from './TypingIndicator';

// Note: LifeBadge is covered by Badge with variant="gold" for achievements

// ============================================
// WORKSHOP PRIMITIVES (Phase 8)
// ============================================

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

export {
  LandingSection,
  LandingContainer,
  LandingHero,
  type LandingSectionProps,
  type LandingContainerProps,
  type LandingHeroProps,
} from './layout/LandingSection';

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

// ============================================
// MOBILE NAVIGATION PRIMITIVES (Phase 12)
// ============================================

export {
  BottomNav,
  BottomNavSpacer,
  bottomNavContainerVariants,
  bottomNavItemVariants,
  bottomNavBadgeVariants,
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

// ============================================
// HIVELAB PRIMITIVES (Phase 14)
// ============================================

export {
  DeploymentTarget,
  DeploymentTargetCard,
  DeploymentSpaceAvatar,
  DeploymentSurfaceSelector,
  deploymentTargetContainerVariants,
  deploymentTargetCardVariants,
  deploymentSurfacePillVariants,
  type DeploymentSurface,
  type DeploymentSpaceTarget,
  type DeploymentTargetProps,
} from './DeploymentTarget';

// ============================================
// MOTION PRIMITIVES (Phase 11)
// ============================================

export {
  // Hooks
  useMouse,
  useScrollProgress,
  useScrollTransform,
  // Components
  Tilt,
  Magnetic,
  TextReveal,
  FadeUp,
  Stagger,
  Parallax,
  CursorGlow,
  NoiseOverlay,
  // Reveal Primitives (from /about)
  RevealSection,
  NarrativeReveal,
  AnimatedBorder,
  // Scroll Primitives (from /about)
  ParallaxText,
  ScrollIndicator,
  HeroParallax,
  ScrollProgress,
  ScrollSpacer,
  // Gradient Primitives
  GradientBackground,
  GradientText,
  GradientOrb,
  // Glass Primitives
  GlassSurface,
  GlassPanel,
  GlassOverlay,
  GlassPill,
  FrostedEdge,
  // Border Glow Primitives
  GlowBorder,
  PulseBorder,
  TrailBorder,
  BreatheBorder,
  CursorTrailBorder,
  // Scroll Transform Primitives
  ScrollTransform,
  ScrollFade,
  ScrollSticky,
  ScrollCounter,
  ScrollProgressBar,
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
  // Reveal Types
  type RevealSectionProps,
  type NarrativeRevealProps,
  type AnimatedBorderProps,
  // Scroll Types
  type ParallaxTextProps,
  type ScrollIndicatorProps,
  type HeroParallaxProps,
  type ScrollProgressProps,
  type ScrollSpacerProps,
  // Gradient Types
  type GradientBackgroundProps,
  type GradientTextProps,
  type GradientOrbProps,
  // Glass Types
  type GlassSurfaceProps,
  type GlassPanelProps,
  type GlassOverlayProps,
  type GlassPillProps,
  type FrostedEdgeProps,
  // Border Glow Types
  type GlowBorderProps,
  type PulseBorderProps,
  type TrailBorderProps,
  type BreatheBorderProps,
  type CursorTrailBorderProps,
  // Scroll Transform Types
  type ScrollTransformProps,
  type ScrollFadeProps,
  type ScrollStickyProps,
  type ScrollCounterProps,
  type ScrollProgressBarProps,
  type UseScrollTransformOptions,
} from './motion';

// ============================================
// PROFILE PRIMITIVES (Phase 15)
// ============================================

// ============================================
// FEEDBACK PRIMITIVES (Canvas)
// ============================================

export {
  EmptyCanvas,
  type EmptyCanvasProps,
} from './feedback/EmptyCanvas';

// ============================================
// INPUT HOOKS
// ============================================

export {
  useDramaticHandleCheck,
  type UseDramaticHandleCheckOptions,
  type DramaticHandleCheckResult,
} from './input/useDramaticHandleCheck';

// ============================================
// MOTION PRIMITIVES (DRAMA.md)
// ============================================

export {
  WordReveal,
  type WordRevealProps,
} from './motion';

export {
  ThresholdReveal,
  type ThresholdRevealProps,
} from './motion/ThresholdReveal';

export {
  ArrivalTransition,
  ArrivalZone,
  type ArrivalTransitionProps,
  type ArrivalZoneProps,
} from './motion/ArrivalTransition';

// ============================================
// SPACE HEALTH PRIMITIVES (Sprint 3)
// ============================================

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
  type SpaceHealthLevel,
  type SpaceHealthMetrics,
  type SpaceHealthBadgeProps,
  type SpaceHealthDotProps,
  type SpaceHealthEdgeProps,
  type SpaceGrowthIndicatorProps,
  type SpaceHealthIndicatorProps,
} from './SpaceHealthBadge';

// ============================================
// BREADCRUMB PRIMITIVES (IA Consolidation)
// ============================================

export {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbCurrent,
  BreadcrumbEllipsis,
  type BreadcrumbProps,
  type BreadcrumbItemProps as BreadcrumbLinkProps,
  type BreadcrumbSeparatorProps,
  type BreadcrumbCurrentProps,
  type BreadcrumbEllipsisProps,
} from './Breadcrumb';
