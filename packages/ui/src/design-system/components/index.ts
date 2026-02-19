/**
 * HIVE Components
 * Source: docs/design-system/COMPONENTS.md
 *
 * Level 6: Primitive Compositions
 * Components are built from primitives and don't introduce new design decisions.
 *
 * Strategy: Reuse well-built atomic components, only rebuild what's missing.
 */

// ============================================
// LAYOUT ARCHETYPES (Locked)
// ============================================

// ============================================
// CARD COMPONENTS (New Design System)
// ============================================
// SpaceCard - LOCKED 2026-01-11 (Immersive Portal layout)
export {
  SpaceCard,
  SpaceCardSkeleton,
  territoryConfig,
  type SpaceCardProps,
  type SpaceTerritory,
} from './SpaceCard';

// GhostSpaceCard - Unclaimed space variant for territory discovery
export {
  GhostSpaceCard,
  GhostSpaceCardSkeleton,
  type GhostSpaceCardProps,
} from './GhostSpaceCard';

// EventCard - LOCKED 2026-01-11 (Toggle chip RSVP, edge warmth)
export {
  EventCard,
  EventCardSkeleton,
  type EventCardProps,
} from './EventCard';

// ProfileCard - LOCKED 2026-01-11 (5 context variants)
export {
  // New context-specific variants
  ProfileCardMemberRow,
  ProfileCardHover,
  ProfileCardSearchRow,
  ProfileCardMention,
  ProfileCardFull,
  // Skeletons
  ProfileCardMemberRowSkeleton,
  ProfileCardHoverSkeleton,
  ProfileCardSearchRowSkeleton,
  ProfileCardFullSkeleton,
  // Legacy (deprecated) - use context-specific variants
  ProfileCard as ProfileCardLegacy,
  ProfileCardSkeleton,
  ProfileCardMini,
  // Types
  type ProfileUser,
  type UserStatus,
  type ProfileCardMemberRowProps,
  type ProfileCardHoverProps,
  type ProfileCardSearchRowProps,
  type ProfileCardMentionProps,
  type ProfileCardFullProps,
  type ProfileCardProps as ProfileCardLegacyProps,
} from './ProfileCard';

// ToolCard - LOCKED 2026-01-11 (Workshop layout, category icons)
export {
  ToolCard,
  ToolCardSkeleton,
  CategoryIcon,
  type ToolCardProps,
} from './ToolCard';

// ============================================
// LOADING COMPONENTS (New Design System)
// ============================================

export {
  LoadingOverlay,
  LoadingSpinner,
  LoadingDots,
  type LoadingOverlayProps,
} from './LoadingOverlay';

// ============================================
// CHAT COMPONENTS (New Design System)
// ============================================

export { ChatMessage, type ChatMessageProps } from './ChatMessage';
export { MessageGroup, groupMessages, type MessageGroupProps } from './MessageGroup';

export {
  ReactionPicker,
  ReactionPickerMinimal,
  ReactionPickerGrid,
  ReactionPickerPopover,
  QUICK_EMOJIS,
  type ReactionPickerProps,
} from './ReactionPicker';

export {
  ReactionBadge,
  ReactionBadgeExpanded,
  ReactionBadgeGroup,
  type ReactionBadgeProps,
  type ReactionBadgeGroupProps,
} from './ReactionBadge';

// ============================================
// TOP NAVIGATION BAR (New Design System)
// Social/Tech/YC top navigation bar
// ============================================

export {
  TopNavBar,
  type TopNavBarProps,
  type TopNavBarUser,
} from './TopNavBar';

// COMMAND BAR (⌘K Command Palette)
// Keyboard-first search and navigation
// ============================================

export {
  CommandBar,
  useCommandBar,
  type CommandBarProps,
  type CommandBarResult,
  type CommandBarResultType,
  type UseCommandBarOptions,
  // Legacy type aliases
  type CommandBarUser,
  type CommandBarNotification,
} from './CommandBar';

export {
  CommandPalette,
  type CommandPaletteProps,
  type CommandPaletteItem,
} from './CommandPalette';

// ============================================
// EVENT COMPONENTS
// NOTE: EventDetailsModal and EventCreateModal were in atomic/ (now deleted)
// Use Modal + FormField + EventCalendar to create event flows
// ============================================

// ============================================
// NAVIGATION COMPONENTS (New Design System)
// ============================================

export { TopBar, TopBarSkeleton, Breadcrumb, type TopBarProps } from './TopBar';

// ============================================
// STATUS COMPONENTS (New Design System)
// ============================================

export {
  PresenceIndicator,
  PresenceIndicatorGroup,
  PresenceIndicatorInline,
  type PresenceIndicatorProps,
  type PresenceIndicatorGroupProps,
  type PresenceIndicatorInlineProps,
  type PresenceStatus,
} from './PresenceIndicator';

// ============================================
// FORM COMPONENTS (New Design System)
// ============================================

export {
  ImageUploader,
  ImageUploaderCompact,
  type ImageUploaderProps,
  type ImageUploaderCompactProps,
} from './ImageUploader';

export {
  MentionAutocomplete,
  useMentionAutocomplete,
  type MentionAutocompleteProps,
  type MentionUser,
  type UseMentionAutocompleteOptions,
  type UseMentionAutocompleteReturn,
} from './MentionAutocomplete';

// ============================================
// DATA COMPONENTS (New Design System)
// ============================================

export {
  DataTable,
  DataTableSkeleton,
  type DataTableProps,
  type DataTableColumn,
} from './DataTable';

// ============================================
// CALENDAR COMPONENTS (New Design System)
// ============================================

export {
  EventCalendar,
  EventCalendarMini,
  type EventCalendarProps,
  type EventCalendarMiniProps,
  type CalendarEvent,
} from './EventCalendar';

// ============================================
// HIVELAB IDE COMPONENTS (Re-exports)
// Already well-built in components/hivelab/ide/
// ============================================

export {
  IDEButton,
  ideButtonVariants,
  type IDEButtonProps,
  IDEInput,
  ideInputVariants,
  type IDEInputProps,
  IDEPanel,
  IDEPanelHeader,
  IDEPanelContent,
  IDEPanelFooter,
  type IDEPanelProps,
  type IDEPanelHeaderProps,
  type IDEPanelContentProps,
  type IDEPanelFooterProps,
  IDESection,
  type IDESectionProps,
} from '../../components/hivelab/ide/components';

// ============================================
// PROFILE COMPONENTS
// NOTE: ProfileBentoGrid was in atomic/ (now deleted)
// Use ProfileCard, ProfileHero, ProfileStatsRow from profile/ instead
// ============================================

// ============================================
// FORM COMPONENTS (Continued)
// ============================================

export { SearchInput, type SearchInputProps } from './SearchInput';

export {
  FormField,
  FormFieldGroup,
  FormSection,
  type FormFieldProps,
  type FormFieldGroupProps,
  type FormSectionProps,
} from './FormField';

export { DatePicker, DateRangePicker, type DatePickerProps, type DateRangePickerProps } from './DatePicker';

// ============================================
// FEEDBACK COMPONENTS (New Design System)
// ============================================

// NOTE: TypingIndicator exported from primitives/
// TODO: Rebuild TypingIndicatorDots, TypingIndicatorBubble using primitives as base
// export {
//   TypingIndicatorDots,
//   TypingIndicatorBubble,
//   type TypingIndicatorBubbleProps,
// } from './TypingIndicator';

// EmptyState and ErrorState - FIXED: Updated to use valid Button variants
export {
  EmptyState,
  EmptyStatePresets,
  type EmptyStateProps,
} from './EmptyState';

export {
  ErrorState,
  ErrorStatePresets,
  type ErrorStateProps,
} from './ErrorState';

// ============================================
// DATA DISPLAY COMPONENTS (New Design System)
// ============================================

export {
  StatCard,
  StatCardGroup,
  StatCardSkeleton,
  Sparkline,
  type StatCardProps,
  type StatCardGroupProps,
} from './StatCard';

// ============================================
// ACTION COMPONENTS (New Design System)
// ============================================

export {
  RSVPButton,
  RSVPButtonGroup,
  type RSVPButtonProps,
  type RSVPButtonGroupProps,
} from './RSVPButton';

// ============================================
// CONTENT COMPONENTS (New Design System)
// ============================================

// PostCard - FIXED: Uses size="default" which is valid
export {
  PostCard,
  PostCardSkeleton,
  type PostCardProps,
  type PostAuthor,
  type PostMedia,
} from './PostCard';

export {
  FileCard,
  FileCardSkeleton,
  FileIcon,
  type FileCardProps,
} from './FileCard';

// ============================================
// CHAT INPUT COMPONENTS (New Design System)
// ============================================

export {
  ChatComposer,
  ChatComposerMinimal,
  type ChatComposerProps,
  type ChatComposerMinimalProps,
  type ChatAttachment,
  type ChatReplyTo,
} from './ChatComposer';

export {
  ThreadDrawer,
  type ThreadDrawerProps,
  type ChatMessageData as ThreadMessage, // Alias for backwards compatibility
} from './ThreadDrawer';

// ============================================
// MEMBER/ATTENDEE COMPONENTS (New Design System)
// ============================================

// MemberList - FIXED: Uses size="sm" and size="default" which are valid
export {
  MemberList,
  MemberRow,
  MemberRowSkeleton,
  type MemberListProps,
  type Member,
} from './MemberList';

// AttendeeList - FIXED: Uses valid sizes, AttendeeStack maps 'md' → 'default' internally
export {
  AttendeeList,
  AttendeeStack,
  AttendeeRow,
  AttendeeRowSkeleton,
  type AttendeeListProps,
  type AttendeeStackProps,
  type Attendee,
} from './AttendeeList';

// ============================================
// INPUT COMPONENTS (New Design System)
// ============================================

export {
  TagInput,
  Tag,
  tagVariants,
  type TagInputProps,
  type TagProps,
} from './TagInput';

export {
  ToggleGroup,
  ToggleButton,
  toggleGroupVariants,
  toggleItemVariants,
  type ToggleGroupProps,
  type ToggleButtonProps,
  type ToggleOption,
} from './ToggleGroup';

// ============================================
// OVERLAY COMPONENTS (New Design System)
// ============================================

// NOTE: Tooltip, TooltipProvider exported from primitives/
// TODO: Rebuild TooltipRich using primitives as base
// export {
//   TooltipRich,
//   type TooltipRichProps,
// } from './Tooltip';

export {
  ConfirmDialog,
  HiveConfirmModal,
  useConfirmDialog,
  type ConfirmDialogProps,
  type HiveConfirmModalProps,
  type UseConfirmDialogOptions,
} from './ConfirmDialog';

// ============================================
// NOTIFICATION COMPONENTS (New Design System)
// ============================================

export {
  NotificationBanner,
  NotificationBannerStack,
  bannerVariants,
  type NotificationBannerProps,
  type NotificationBannerStackProps,
} from './NotificationBanner';

// ============================================
// NAVIGATION COMPONENTS (Continued)
// ============================================

export {
  TabNav,
  TabPanel,
  tabNavVariants,
  tabItemVariants,
  type TabNavProps,
  type TabPanelProps,
  type TabItem,
} from './TabNav';

// BoardTabs - REMOVED Feb 2026

// ============================================
// PROGRESS COMPONENTS (New Design System)
// ============================================

export {
  ProgressBar,
  ProgressCircle,
  ProgressSteps,
  progressVariants as progressBarVariants, // Alias to avoid conflict with Progress
  progressFillVariants,
  type ProgressBarProps,
  type ProgressCircleProps,
  type ProgressStepsProps,
} from './ProgressBar';

// ============================================
// DROPDOWN COMPONENTS (New Design System)
// ============================================

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
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './Dropdown';

// ============================================
// SWITCH COMPONENTS (New Design System)
// ============================================

// NOTE: Switch, SwitchProps, switchVariants exported from primitives/
// TODO: Rebuild SwitchField using primitives as base
// export {
//   SwitchField,
//   type SwitchFieldProps,
// } from './Switch';

// ============================================
// SKELETON COMPONENTS (New Design System)
// ============================================

// NOTE: Skeleton components exported from primitives/
// TODO: Rebuild SkeletonButton using primitives as base
// export {
//   SkeletonButton,
//   type SkeletonButtonProps,
// } from './Skeleton';

// ============================================
// AVATAR GROUP COMPONENTS (New Design System)
// ============================================

// NOTE: AvatarGroup is exported from primitives/index.ts, not from here.
// Use: import { AvatarGroup } from '@hive/ui/design-system/primitives'
// The AvatarGroup primitive uses valid sizes: xs, sm, default, lg

// ============================================
// BADGE COMPONENTS (New Design System)
// ============================================

// NOTE: Badge, BadgeProps, badgeVariants exported from primitives/
// TODO: Rebuild NotificationBadge, StatusBadge using primitives as base
// export {
//   NotificationBadge,
//   StatusBadge,
//   type NotificationBadgeProps,
//   type StatusBadgeProps,
//   type StatusType,
// } from './Badge';

// ============================================
// SLIDER COMPONENTS (New Design System)
// ============================================

export {
  Slider,
  SliderWithLabels,
  RangeSlider,
  SliderWithMarks,
  sliderVariants,
  type SliderProps,
  type SliderWithLabelsProps,
  type RangeSliderProps,
  type SliderWithMarksProps,
} from './Slider';

// ============================================
// RADIO GROUP COMPONENTS (New Design System)
// NOTE: Composed RadioGroup renamed to avoid conflict with primitive
// Use RadioGroupComposed for full-featured version with RadioOption, RadioCard
// ============================================

export {
  RadioGroup as RadioGroupComposed,
  RadioGroupItem as RadioGroupItemComposed,
  RadioOption,
  RadioCard,
  SimpleRadioGroup,
  radioGroupVariants as radioGroupComposedVariants,
  type RadioGroupProps as RadioGroupComposedProps,
  type RadioGroupItemProps as RadioGroupItemComposedProps,
  type RadioOptionProps,
  type RadioCardProps,
  type SimpleRadioGroupProps,
  type SimpleRadioOption,
} from './RadioGroup';

// ============================================
// CHECKBOX COMPONENTS (New Design System)
// ============================================

// TODO: Fix Checkbox - CheckboxField missing 'label' prop
// export {
//   Checkbox,
//   CheckboxField,
//   CheckboxCard,
//   CheckboxGroup,
//   SimpleCheckboxGroup,
//   checkboxVariants,
//   type CheckboxProps,
//   type CheckboxFieldProps,
//   type CheckboxCardProps,
//   type CheckboxGroupProps,
//   type SimpleCheckboxGroupProps,
//   type SimpleCheckboxOption,
// } from './Checkbox';

// ============================================
// MODAL COMPONENTS (New Design System)
// ============================================

// NOTE: Modal components exported from primitives/
// TODO: Rebuild ModalBody, useModal using primitives as base
// export {
//   ModalBody,
//   useModal,
//   type UseModalReturn,
// } from './Modal';

// ============================================
// DRAWER COMPONENTS (New Design System)
// ============================================

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
  type DrawerContentProps,
} from './Drawer';

// ============================================
// SHEET COMPONENTS (New Design System)
// ============================================

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
  type SheetContentProps,
} from './Sheet';

// ============================================
// DIALOG COMPONENTS (Compatibility Layer)
// ============================================

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Dialog';

// ============================================
// POPOVER COMPONENTS (New Design System)
// ============================================

export {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverBody,
  PopoverFooter,
  PopoverCard,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  type PopoverContentProps,
  type PopoverCardProps,
} from './Popover';

// ============================================
// TOAST COMPONENTS (New Design System)
// ============================================

// NOTE: Toast, ToastProps, toastVariants exported from primitives/
// TODO: Rebuild Toast composed components using primitives as base
// export {
//   ToastProvider,
//   ToastViewport,
//   ToastTitle,
//   ToastDescription,
//   ToastClose,
//   ToastAction,
//   ToastWithIcon,
//   Toaster,
//   useToast,
// } from './Toast';

// ============================================
// ALERT COMPONENTS (New Design System)
// ============================================

export {
  Alert,
  AlertTitle,
  AlertDescription,
  InlineAlert,
  alertVariants,
  type AlertProps,
  type InlineAlertProps,
} from './Alert';

// ============================================
// CALLOUT COMPONENTS (New Design System)
// ============================================

// Callout - FIXED: QuoteCallout now uses HTMLQuoteElement ref type
export {
  Callout,
  CollapsibleCallout,
  QuoteCallout,
  calloutVariants,
  type CalloutProps,
  type CollapsibleCalloutProps,
  type QuoteCalloutProps,
} from './Callout';

// ============================================
// ACCORDION COMPONENTS (New Design System)
// ============================================

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  SimpleAccordion,
  accordionVariants,
  accordionItemVariants,
  accordionTriggerVariants,
  type AccordionProps,
  type AccordionItemProps,
  type AccordionTriggerProps,
  type AccordionContentProps,
  type SimpleAccordionProps,
  type SimpleAccordionItem,
} from './Accordion';

// ============================================
// COLLAPSIBLE COMPONENTS (New Design System)
// ============================================

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  SimpleCollapsible,
  CollapsibleCard,
  collapsibleTriggerVariants,
  type CollapsibleProps,
  type CollapsibleTriggerProps,
  type CollapsibleContentProps,
  type SimpleCollapsibleProps,
  type CollapsibleCardProps,
} from './Collapsible';

// ============================================
// TABS COMPONENTS (New Design System)
// ============================================

// TODO: Fix Tabs - interface extension conflict with orientation, null to undefined
// export {
//   Tabs,
//   TabsList,
//   TabsTrigger,
//   TabsContent,
//   SimpleTabs,
//   CardTabs,
//   tabsListVariants,
//   tabsTriggerVariants,
//   type TabsProps,
//   type TabsListProps,
//   type TabsTriggerProps,
//   type TabsContentProps,
//   type SimpleTabsProps,
//   type SimpleTabItem,
//   type CardTabsProps,
// } from './Tabs';

// ============================================
// SELECT COMPONENTS (New Design System)
// ============================================

// NOTE: Select components exported from primitives/
// TODO: Rebuild SimpleSelect, SelectScrollButtons using primitives as base
// export {
//   SelectScrollUpButton,
//   SelectScrollDownButton,
//   SimpleSelect,
//   type SimpleSelectProps,
//   type SimpleSelectOption,
//   type SimpleSelectGroup,
// } from './Select';

// ============================================
// COMBOBOX COMPONENTS (New Design System)
// ============================================

export {
  // Command re-exports from Combobox removed - use Command component directly
  CommandLoading,
  Combobox,
  comboboxTriggerVariants,
  type ComboboxProps,
  type ComboboxOption,
  type ComboboxGroup,
} from './Combobox';

// ============================================
// PAGINATION COMPONENTS (New Design System)
// ============================================

export {
  Pagination,
  SimplePagination,
  CompactPagination,
  paginationItemVariants,
  type PaginationProps,
  type SimplePaginationProps,
  type CompactPaginationProps,
} from './Pagination';

// ============================================
// STEPPER COMPONENTS (New Design System)
// ============================================

export {
  Stepper,
  DotStepper,
  ProgressStepper,
  stepVariants,
  connectorVariants,
  type StepperProps,
  type Step,
  type DotStepperProps,
  type ProgressStepperProps,
} from './Stepper';

// ============================================
// ASPECT RATIO COMPONENTS (New Design System)
// ============================================

// AspectRatio - FIXED: Properly handles both string presets and numeric ratios
export {
  AspectRatio,
  AspectRatioImage,
  AspectRatioVideo,
  AspectRatioPlaceholder,
  type AspectRatioProps,
  type AspectRatioImageProps,
  type AspectRatioVideoProps,
  type AspectRatioPlaceholderProps,
} from './AspectRatio';

// ============================================
// SEPARATOR COMPONENTS (New Design System)
// ============================================

// TODO: Fix Separator - interface extension conflict with orientation
// export {
//   Separator,
//   LabeledSeparator,
//   IconSeparator,
//   DotSeparator,
//   SlashSeparator,
//   VerticalDivider,
//   separatorVariants,
//   type SeparatorProps,
//   type LabeledSeparatorProps,
//   type IconSeparatorProps,
//   type DotSeparatorProps,
//   type SlashSeparatorProps,
//   type VerticalDividerProps,
// } from './Separator';

// ============================================
// SCROLL AREA COMPONENTS (New Design System)
// ============================================

export {
  ScrollArea,
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaCorner,
  scrollbarVariants,
  thumbVariants,
  type ScrollAreaProps,
} from './ScrollArea';

// ============================================
// LABEL COMPONENTS (New Design System)
// ============================================

// TODO: Fix Label - aria-describedby prop error
// export {
//   Label,
//   InlineLabel,
//   FieldLabel,
//   ScreenReaderLabel,
//   labelVariants,
//   type LabelProps,
//   type InlineLabelProps,
//   type FieldLabelProps,
//   type ScreenReaderLabelProps,
// } from './Label';

// ============================================
// NUMBER INPUT COMPONENTS (New Design System)
// ============================================

export {
  NumberInput,
  SimpleNumberInput,
  CurrencyInput,
  PercentInput,
  numberInputVariants,
  type NumberInputProps,
  type SimpleNumberInputProps,
  type CurrencyInputProps,
  type PercentInputProps,
} from './NumberInput';

// ============================================
// VISUALLY HIDDEN COMPONENTS (New Design System)
// ============================================

export {
  VisuallyHidden,
  VisuallyHiddenInput,
  FocusableVisuallyHidden,
  srOnlyClass,
  notSrOnlyClass,
  type VisuallyHiddenProps,
  type VisuallyHiddenInputProps,
  type FocusableVisuallyHiddenProps,
} from './VisuallyHidden';

// ============================================
// PORTAL COMPONENTS (New Design System)
// ============================================

// NOTE: ModalPortal is already exported from primitives/Modal.tsx
// Only export unique Portal components from this module
export {
  Portal,
  PortalWithContainer,
  // ModalPortal, - exported from primitives/Modal.tsx
  TooltipPortal,
  ToastPortal,
  usePortal,
  type PortalProps,
  type PortalWithContainerProps,
  // type ModalPortalProps, - different from primitives version
  type TooltipPortalProps,
  type ToastPortalProps,
} from './Portal';

// ============================================
// SLOT COMPONENTS (New Design System)
// ============================================

export {
  Slot,
  Slottable,
  SlotClone,
  mergeProps,
  composeRefs,
  useSlot,
  type SlotProps,
  type SlottableProps,
  type SlotCloneProps,
  type AsChildProps,
} from './Slot';

// ============================================
// AUTH COMPONENTS (New Design System)
// For Focus template / Auth flows
// ============================================

export {
  OTPInput,
  type OTPInputProps,
} from './OTPInput';

export {
  EmailInput,
  getFullEmail,
  isValidEmailUsername,
  type EmailInputProps,
} from './EmailInput';

export {
  AuthSuccessState,
  AuthSuccessStateCompact,
  type AuthSuccessStateProps,
} from './AuthSuccessState';

// ============================================
// SPACE HEADER COMPONENTS (New Design System)
// Core space identity display
// ============================================

export {
  SpaceHeader,
  SpaceHeaderCompact,
  type SpaceHeaderProps,
  type SpaceHeaderCompactProps,
  type MembershipState,
} from './SpaceHeader';

// ============================================
// CAMPUS NAVIGATION COMPONENTS (New Design System)
// NOTE: CommandBar and Sidebar are now the primary navigation
// The campus dock components are deprecated in favor of CommandBar + Sidebar
// ============================================

// Campus provider and dock components may be re-added if needed
// For now, use Shell from templates which composes CommandBar + Sidebar

// ============================================
// PROFILE COMPONENTS (New Design System)
// Full profile page rebuild with viral elements
// ============================================

export {
  // 3-Zone Profile Layout (New)
  ProfileIdentityHero,
  ProfileActivityCard,
  ProfileLeadershipCard,
  ProfileEventCard,
  ProfileSpacePill,
  ProfileConnectionFooter,
  ProfileOverflowChip,
  // ProfileBentoCard - Apple-style widget card for bento grid (Legacy)
  ProfileBentoCard,
  ProfileCard as ProfileBentoCardLegacy,
  // Other profile components
  ProfileHero,
  ProfileStatsRow,
  ContextBanner,
  ProfileSpacesCard,
  ProfileToolsCard,
  ProfileConnectionsCard,
  ProfileInterestsCard,
  ProfileToolModal,
} from './profile';

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
  // Legacy Types
  ProfileBentoCardProps,
  ProfileCardProps as ProfileBentoCardLegacyProps,
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
  ProfileActivityHeatmapProps,
  ActivityContribution,
  ProfileToolModalData,
  ProfileToolModalProps,
} from './profile';

// ============================================
// SPACE THEATER MODE COMPONENTS (New Design System)
// Hub + Modes architecture for immersive space experience
// ============================================

export {
  // Hub
  SpaceHub,
  ModeCard,
  ChatModeCard,
  EventsModeCard,
  ToolsModeCard,
  MembersModeCard,
  // Mode Transitions
  ModeTransition,
  ModeHeader,
  FullScreenMode,
  ContextPill,
  ContextPillMobile,
  // Chat Components
  ChatRowMessage,
  SystemMessage,
  DateSeparator,
  ChatTypingDots,
  ChatTypingDotsCompact,
  ChatTypingDotsInline,
  TheaterChatBoard,
  // Full-Screen Modes
  EventsMode,
  ToolsMode,
  MembersMode,
} from './spaces';

export type {
  // Hub Types
  SpaceIdentity,
  SpaceHubProps,
  SpaceMode,
  // Chat Types
  ChatRowMessageProps,
  ChatRowMessageAuthor,
  ChatRowMessageReaction,
  SystemMessageProps,
  DateSeparatorProps,
  ChatTypingDotsProps,
  ChatTypingDotsCompactProps,
  ChatTypingDotsInlineProps,
  TypingUser,
  TheaterChatBoardProps,
  TheaterMessage,
  // Mode Types
  EventsModeProps,
  SpaceEvent,
  ToolsModeProps,
  SpaceTool,
  MembersModeProps,
  SpaceMember,
} from './spaces';

// ============================================
// SPACE MODALS (Phase 2)
// Modal components for space management
// ============================================

export {
  AddTabModal,
  MemberInviteModal,
  EventCreateModal,
  EventDetailsModal,
  AddWidgetModal,
  ChatSearchModal,
} from './spaces';

export type {
  AddTabInput,
  AddTabModalProps,
  InviteableUser,
  MemberInviteInput,
  MemberInviteModalProps,
  EventCreateInput,
  EventCreateModalProps,
  RSVPStatus,
  SpaceEventDetails,
  EventDetailsModalProps,
  AddWidgetInputUI,
  ExistingTool,
  AddWidgetModalProps,
  QuickTemplateUI,
  ChatSearchModalProps,
  SearchResultMessage,
  ChatSearchFilters,
} from './spaces';

// ============================================
// SPACE SIDEBAR & MOBILE (Phase 3)
// Sidebar widgets and mobile navigation
// ============================================

export {
  PinnedMessagesWidget,
  LeaderSetupProgress,
  MobileActionBar,
  MobileDrawer,
} from './spaces';

export type {
  PinnedMessage,
  PinnedMessagesWidgetProps,
  SetupTask,
  LeaderSetupProgressProps,
  MobileDrawerType,
  MobileActionBarProps,
  MobileDrawerProps,
} from './spaces';

// ============================================
// SPACE ONBOARDING & ANIMATION (Phase 4)
// Onboarding modals and entry animations
// ============================================

export {
  SpaceLeaderOnboardingModal,
  SpaceWelcomeModal,
  SpaceEntryAnimation,
  IntentConfirmationInline,
} from './spaces';

export type {
  QuickDeployTemplate,
  SpaceLeaderOnboardingModalProps,
  SpaceLeaderInfo,
  SpaceFeature,
  SpaceWelcomeModalProps,
  SpaceEntryAnimationProps,
  IntentType,
  IntentPreview,
  IntentConfirmationInlineProps,
} from './spaces';

// ============================================
// SPACE PANEL COMPONENTS (Phase 2 - 60/40 Layout)
// The 40% sidebar for Space pages with NOW/NEXT UP/PINNED sections
// ============================================

export {
  SpacePanel,
  SpacePanelSkeleton,
  NowSection,
  NextUpSection,
  PinnedSection,
} from './SpacePanel';

export type {
  SpacePanelProps,
  OnlineMember as SpacePanelOnlineMember,
  UpcomingEvent,
  PinnedItem,
} from './SpacePanel';

// ============================================
// MODERATION COMPONENTS
// User-facing moderation interfaces
// ============================================

export {
  ReportContentModal,
  type ReportContentModalProps,
  type ReportContentInput,
  type ReportContentType,
  type ReportCategory,
} from './moderation';

// ============================================
// CORE PRIMITIVES - REMOVED (Already exported from primitives/)
// These were causing duplicate export errors
// Use: import { Button } from '@hive/ui/design-system/primitives'
// ============================================
// NOTE: The following are exported from primitives/index.ts:
// - Button, Input, Textarea, Card, Avatar, Dialog, Sheet, Progress, Command
// - Do NOT re-export from components to avoid ambiguity
