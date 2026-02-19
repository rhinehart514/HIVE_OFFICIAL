/**
 * HIVE Design System
 * The bridge from spec to code.
 *
 * This module exports:
 * - CSS tokens (import tokens.css separately)
 * - AtmosphereProvider (context for atmosphere-aware components)
 * - TypeScript interfaces (for building primitives)
 * - All primitives
 * - All components
 *
 * Reading Order:
 * 1. LANGUAGE.md → tokens.css
 * 2. SYSTEMS.md → AtmosphereProvider
 * 3. PRIMITIVES.md → primitives/
 * 4. COMPONENTS.md → components/
 */

// Context Provider
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
  AtmosphereContext,
  type AtmosphereLevel,
  type Density,
  type WarmthLevel,
  type AtmosphereState,
  type AtmosphereContextValue,
  type AtmosphereProviderProps,
} from './AtmosphereProvider';

// Type Interfaces
export type {
  AtmosphereAware,
  DensityAware,
  WarmthProps,
  ElevationProps,
  LifeProps,
  SurfaceProps,
  InteractiveProps,
  ButtonVariant,
  ButtonSize,
  InputState,
  ToastVariant,
  AvatarShape,
  AvatarSize,
  AsChildProps,
  PolymorphicProps,
  DataAttributes,
  FullPrimitiveProps,
  ComponentWithRef,
} from './types';

// ============================================
// ALL PRIMITIVES
// ============================================

export * from './primitives';

// ============================================
// ALL COMPONENTS
// ============================================

// Export all from components EXCEPT FormField/FormSection (conflicts with patterns)
export {
  // Cards
  SpaceCard, SpaceCardSkeleton, territoryConfig,
  EventCard, EventCardSkeleton,
  ProfileCardMemberRow, ProfileCardHover, ProfileCardSearchRow, ProfileCardMention, ProfileCardFull,
  ProfileCardMemberRowSkeleton, ProfileCardHoverSkeleton, ProfileCardSearchRowSkeleton, ProfileCardFullSkeleton,
  ProfileCardLegacy, ProfileCardSkeleton, ProfileCardMini,
  ToolCard, ToolCardSkeleton, CategoryIcon,
  // Loading
  LoadingOverlay, LoadingSpinner, LoadingDots,
  // Chat
  ChatMessage, MessageGroup, groupMessages,
  ReactionPicker, ReactionPickerMinimal, ReactionPickerGrid, ReactionPickerPopover, QUICK_EMOJIS,
  ReactionBadge, ReactionBadgeExpanded, ReactionBadgeGroup,
  // Navigation
  TopNavBar, CommandBar, useCommandBar, CommandPalette,
  TopBar, TopBarSkeleton, Breadcrumb,
  // Status
  PresenceIndicator, PresenceIndicatorGroup, PresenceIndicatorInline,
  // Forms (with explicit names to avoid conflict)
  FormField as ComponentFormField,
  FormFieldGroup,
  FormSection as ComponentFormSection,
  ImageUploader, ImageUploaderCompact,
  MentionAutocomplete, useMentionAutocomplete,
  SearchInput, DatePicker, DateRangePicker,
  // Data
  DataTable, DataTableSkeleton,
  EventCalendar, EventCalendarMini,
  // Feedback
  EmptyState, EmptyStatePresets,
  ErrorState, ErrorStatePresets,
  // Stats
  StatCard, StatCardGroup, StatCardSkeleton, Sparkline,
  // Actions
  RSVPButton, RSVPButtonGroup,
  // Files
  FileCard, FileCardSkeleton, FileIcon,
  // Chat Input
  ChatComposer, ChatComposerMinimal,
  ThreadDrawer,
  // Input
  TagInput, Tag, tagVariants,
  ToggleGroup, ToggleButton, toggleGroupVariants, toggleItemVariants,
  // Overlay
  ConfirmDialog, HiveConfirmModal, useConfirmDialog,
  // Notification
  NotificationBanner, NotificationBannerStack, bannerVariants,
  // Tabs
  TabNav, TabPanel, tabNavVariants, tabItemVariants,
  // Progress
  ProgressBar, ProgressCircle, ProgressSteps, progressBarVariants, progressFillVariants,
  // Dropdown
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup,
  DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuRadioGroup,
  // Slider
  Slider, SliderWithLabels, RangeSlider, SliderWithMarks, sliderVariants,
  // Radio
  RadioGroupComposed, RadioGroupItemComposed, RadioOption, RadioCard,
  SimpleRadioGroup, radioGroupComposedVariants,
  // Drawer
  Drawer, DrawerTrigger, DrawerPortal, DrawerOverlay, DrawerContent,
  DrawerHeader, DrawerTitle, DrawerDescription, DrawerBody, DrawerFooter, DrawerClose,
  drawerContentVariants,
  // Sheet
  Sheet, SheetTrigger, SheetClose, SheetPortal, SheetOverlay, SheetContent,
  SheetHeader, SheetFooter, SheetTitle, SheetDescription, sheetVariants,
  // Dialog
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  // Popover
  Popover, PopoverTrigger, PopoverPortal, PopoverAnchor, PopoverClose, PopoverContent,
  PopoverHeader, PopoverTitle, PopoverDescription, PopoverBody, PopoverFooter, PopoverCard,
  HoverCard, HoverCardTrigger, HoverCardContent,
  // Alert
  Alert, AlertTitle, AlertDescription, InlineAlert, alertVariants,
  // Accordion
  Accordion, AccordionItem, AccordionTrigger, AccordionContent, SimpleAccordion,
  accordionVariants, accordionItemVariants, accordionTriggerVariants,
  // Collapsible
  Collapsible, CollapsibleTrigger, CollapsibleContent, SimpleCollapsible, CollapsibleCard,
  collapsibleTriggerVariants,
  // Combobox
  CommandLoading, Combobox, comboboxTriggerVariants,
  // Pagination
  Pagination, SimplePagination, CompactPagination, paginationItemVariants,
  // Stepper
  Stepper, DotStepper, ProgressStepper, stepVariants, connectorVariants,
  // ScrollArea
  ScrollArea, ScrollAreaRoot, ScrollAreaViewport, ScrollAreaScrollbar,
  ScrollAreaThumb, ScrollAreaCorner, scrollbarVariants, thumbVariants,
  // NumberInput
  NumberInput, SimpleNumberInput, CurrencyInput, PercentInput, numberInputVariants,
  // VisuallyHidden
  VisuallyHidden, VisuallyHiddenInput, FocusableVisuallyHidden, srOnlyClass, notSrOnlyClass,
  // Portal
  Portal, PortalWithContainer, TooltipPortal, ToastPortal, usePortal,
  // Slot
  Slot, Slottable, SlotClone, mergeProps, composeRefs, useSlot,
  // Auth
  OTPInput, EmailInput, getFullEmail, isValidEmailUsername, AuthSuccessState, AuthSuccessStateCompact,
  // Space Header
  SpaceHeader, SpaceHeaderCompact,
  // Profile - 3-Zone Layout (New)
  ProfileIdentityHero, ProfileActivityCard, ProfileLeadershipCard, ProfileEventCard,
  ProfileSpacePill, ProfileConnectionFooter, ProfileOverflowChip,
  // Profile - Legacy Bento
  ProfileBentoCard, ProfileBentoCardLegacy, ProfileHero, ProfileStatsRow, ContextBanner,
  ProfileSpacesCard, ProfileToolsCard, ProfileConnectionsCard, ProfileInterestsCard,
  ProfileActivityHeatmap, ProfileToolModal,
  // Spaces (simplified Feb 2026)
  ContextPill, ContextPillMobile,
  ChatRowMessage, SystemMessage, DateSeparator, ChatTypingDots, ChatTypingDotsCompact, ChatTypingDotsInline,
  MemberInviteModal, EventCreateModal, EventDetailsModal,
  PinnedMessagesWidget, LeaderSetupProgress, MobileActionBar, MobileDrawer,
  SpaceLeaderOnboardingModal, SpaceWelcomeModal, SpaceEntryAnimation,
  // HiveLab IDE
  IDEButton, ideButtonVariants, IDEInput, ideInputVariants,
  IDEPanel, IDEPanelHeader, IDEPanelContent, IDEPanelFooter, IDESection,
} from './components';

// Re-export types from components
export type {
  SpaceCardProps, SpaceTerritory,
  EventCardProps,
  ProfileUser, UserStatus,
  ProfileCardMemberRowProps, ProfileCardHoverProps, ProfileCardSearchRowProps,
  ProfileCardMentionProps, ProfileCardFullProps, ProfileCardLegacyProps,
  ToolCardProps,
  LoadingOverlayProps,
  ChatMessageProps, MessageGroupProps,
  ReactionPickerProps, ReactionBadgeProps, ReactionBadgeGroupProps,
  TopNavBarProps, TopNavBarUser,
  CommandBarProps, CommandBarResult, CommandBarResultType, UseCommandBarOptions,
  CommandBarUser, CommandBarNotification,
  CommandPaletteProps, CommandPaletteItem,
  TopBarProps,
  PresenceIndicatorProps, PresenceIndicatorGroupProps, PresenceIndicatorInlineProps, PresenceStatus,
  FormFieldProps as ComponentFormFieldProps,
  FormFieldGroupProps,
  FormSectionProps as ComponentFormSectionProps,
  ImageUploaderProps, ImageUploaderCompactProps,
  MentionAutocompleteProps, MentionUser, UseMentionAutocompleteOptions, UseMentionAutocompleteReturn,
  SearchInputProps, DatePickerProps, DateRangePickerProps,
  DataTableProps, DataTableColumn,
  EventCalendarProps, EventCalendarMiniProps, CalendarEvent,
  EmptyStateProps, ErrorStateProps,
  StatCardProps, StatCardGroupProps,
  RSVPButtonProps, RSVPButtonGroupProps,
  FileCardProps,
  ChatComposerProps, ChatComposerMinimalProps, ChatAttachment, ChatReplyTo,
  ThreadDrawerProps,
  TagInputProps, TagProps,
  ToggleGroupProps, ToggleButtonProps, ToggleOption,
  ConfirmDialogProps, HiveConfirmModalProps, UseConfirmDialogOptions,
  NotificationBannerProps, NotificationBannerStackProps,
  TabNavProps, TabPanelProps, TabItem,
  ProgressBarProps, ProgressCircleProps, ProgressStepsProps,
  SliderProps, SliderWithLabelsProps, RangeSliderProps, SliderWithMarksProps,
  RadioGroupComposedProps, RadioGroupItemComposedProps, RadioOptionProps, RadioCardProps,
  SimpleRadioGroupProps, SimpleRadioOption,
  DrawerContentProps,
  SheetContentProps,
  PopoverContentProps, PopoverCardProps,
  AlertProps, InlineAlertProps,
  AccordionProps, AccordionItemProps, AccordionTriggerProps, AccordionContentProps,
  SimpleAccordionProps, SimpleAccordionItem,
  CollapsibleProps, CollapsibleTriggerProps, CollapsibleContentProps,
  SimpleCollapsibleProps, CollapsibleCardProps,
  ComboboxProps, ComboboxOption, ComboboxGroup,
  PaginationProps, SimplePaginationProps, CompactPaginationProps,
  StepperProps, Step, DotStepperProps, ProgressStepperProps,
  ScrollAreaProps,
  NumberInputProps, SimpleNumberInputProps, CurrencyInputProps, PercentInputProps,
  VisuallyHiddenProps, VisuallyHiddenInputProps, FocusableVisuallyHiddenProps,
  PortalProps, PortalWithContainerProps, TooltipPortalProps, ToastPortalProps,
  SlotProps, SlottableProps, SlotCloneProps,
  OTPInputProps, EmailInputProps, AuthSuccessStateProps,
  SpaceHeaderProps, SpaceHeaderCompactProps, MembershipState,
  // Profile - 3-Zone Layout Types (New)
  ProfileIdentityHeroUser, ProfileIdentityHeroProps, ProfileBadge,
  ProfileActivityTool, ProfileActivityCardProps,
  ProfileLeadershipSpace, ProfileLeadershipCardProps,
  ProfileEvent, ProfileEventCardProps,
  ProfileSpacePillSpace, ProfileSpacePillProps,
  ProfileConnectionFooterProps, ProfileOverflowChipProps,
  // Profile - Legacy Types
  ProfileBentoCardProps, ProfileBentoCardLegacyProps, ProfileHeroProps, ProfileHeroUser,
  ProfileHeroPresence, ProfileHeroBadges, ProfileStatsRowProps, ContextBannerProps,
  ProfileSpacesCardProps, ProfileSpace, ProfileToolsCardProps, ProfileTool,
  ProfileConnectionsCardProps, ProfileConnection, ProfileInterestsCardProps,
  ProfileActivityHeatmapProps, ActivityContribution, ProfileToolModalData, ProfileToolModalProps,
  ChatRowMessageProps, ChatRowMessageAuthor, ChatRowMessageReaction,
  SystemMessageProps, DateSeparatorProps, ChatTypingDotsProps,
  ChatTypingDotsCompactProps, ChatTypingDotsInlineProps, TypingUser,
  InviteableUser, MemberInviteInput, MemberInviteModalProps,
  EventCreateInput, EventCreateModalProps, RSVPStatus, SpaceEventDetails, EventDetailsModalProps,
  PinnedMessage, PinnedMessagesWidgetProps, SetupTask, LeaderSetupProgressProps,
  MobileDrawerType, MobileActionBarProps, MobileDrawerProps,
  QuickDeployTemplate, SpaceLeaderOnboardingModalProps, SpaceLeaderInfo,
  SpaceFeature, SpaceWelcomeModalProps, SpaceEntryAnimationProps,
  IDEButtonProps, IDEInputProps, IDEPanelProps, IDEPanelHeaderProps,
  IDEPanelContentProps, IDEPanelFooterProps, IDESectionProps,
} from './components';

// ============================================
// ALL PATTERNS (authoritative for FormField, FormSection, GridItem)
// ============================================

export * from './patterns';

// ============================================
// ALL TEMPLATES
// Note: GridItem conflict resolved - patterns/GridLayout.tsx version is authoritative
// templates/Grid.tsx also exports GridItem but patterns takes precedence
// ============================================

// PageTransition exports
export {
  PageTransition,
  PageTransitionProvider,
  usePageTransition,
  FadeTransition,
  SlideTransition,
  ScaleTransition,
  StaggerContainer,
  StaggerItem,
  pageTransitionPresets,
  type TransitionMode,
  type TransitionDirection,
  type PageTransitionProps,
  type PageTransitionContextValue,
  type PageTransitionProviderProps,
  type FadeTransitionProps,
  type SlideTransitionProps,
  type ScaleTransitionProps,
  type StaggerContainerProps,
  type StaggerItemProps,
} from './templates/PageTransition';



// ============================================
// LEGACY PAGE TRANSITIONS (use templates/PageTransition.tsx for new code)
// ============================================

export {
  PageTransition as LegacyPageTransition,
  StaggerContainer as LegacyStaggerContainer,
  StaggerItem as LegacyStaggerItem,
  usePageTransition as useLegacyPageTransition,
  useStaggerAnimation,
  getTransitionTiming,
  createTransition,
  TIMING_BY_ATMOSPHERE,
  EASE_SMOOTH,
  EASE_OUT,
  EASE_IN_OUT,
  type TransitionType,
  type PageTransitionProps as LegacyPageTransitionProps,
  type StaggerContainerProps as LegacyStaggerContainerProps,
  type StaggerItemProps as LegacyStaggerItemProps,
} from './page-transitions';

// ============================================
// COHERENCE STREAM (Architecture Visualization)
// ============================================

export {
  CoherenceStream,
  tokens as coherenceTokens,
  atmosphereConfig as coherenceAtmosphereConfig,
  shellConfig as coherenceShellConfig,
  pageTransitions as coherencePageTransitions,
} from './coherence-stream';
