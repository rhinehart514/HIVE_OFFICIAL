"use strict";
// MINIMAL WORKING BUILD - ESSENTIAL COMPONENTS ONLY
// This is a temporary minimal build to get the package working
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolCategories = exports.rsvpStatuses = exports.eventTypes = exports.postTypes = exports.pinnedContentTypes = exports.HiveMembersSurface = exports.HiveChatSurface = exports.HiveToolsSurface = exports.HiveEventsSurface = exports.HivePostsSurface = exports.HivePinnedSurface = exports.HiveFileUpload = exports.Textarea = exports.Label = exports.CardDescription = exports.AtomicCardTitle = exports.AtomicCardContent = exports.AtomicCardHeader = exports.AtomicCard = exports.Grid = exports.switchVariants = exports.Switch = exports.Stack = exports.AtomicButton = exports.SchoolSearchInput = exports.CircularProgress = exports.Progress = exports.Badge = exports.HiveBadge = exports.HiveLogo = exports.HiveModal = exports.HiveComingSoonModal = exports.hiveSelectVariants = exports.HiveSelect = exports.inputVariants = exports.Input = exports.buttonVariants = exports.Button = exports.EnhancedAppShell = exports.CardTitle = exports.CardHeader = exports.CardContent = exports.HiveCard = exports.Card = exports.useWelcomeMat = exports.WelcomeMat = exports.adaptSmartCalendarProps = exports.CalendarCard = exports.PageContainer = exports.cn = void 0;
exports.LiveToolRuntime = exports.ToolMarketplace = exports.useRouteTransitions = exports.useKeyboardNavigation = exports.useNavigation = exports.initializeElementSystem = exports.TOOL_TEMPLATES = exports.CORE_ELEMENTS = exports.ElementEngine = exports.ElementRegistry = exports.NotificationCenterElement = exports.FormBuilderElement = exports.ChartDisplayElement = exports.MapViewElement = exports.TagCloudElement = exports.UserSelectorElement = exports.DatePickerElement = exports.ResultListElement = exports.FilterSelectorElement = exports.SearchInputElement = exports.renderElement = exports.VisualToolComposer = exports.AlertDescription = exports.Alert = exports.memberStatuses = exports.memberRoles = exports.messageStatuses = exports.messageTypes = exports.toolStatuses = void 0;
// === UTILITIES & TYPES ===
var utils_1 = require("./src/lib/utils");
Object.defineProperty(exports, "cn", { enumerable: true, get: function () { return utils_1.cn; } });
// === ESSENTIAL COMPONENTS ===
var page_container_1 = require("./src/components/shell/page-container");
Object.defineProperty(exports, "PageContainer", { enumerable: true, get: function () { return page_container_1.PageContainer; } });
var profile_1 = require("./src/components/profile");
Object.defineProperty(exports, "CalendarCard", { enumerable: true, get: function () { return profile_1.CalendarCard; } });
Object.defineProperty(exports, "adaptSmartCalendarProps", { enumerable: true, get: function () { return profile_1.adaptSmartCalendarProps; } });
var welcome_mat_1 = require("./src/components/welcome/welcome-mat");
Object.defineProperty(exports, "WelcomeMat", { enumerable: true, get: function () { return welcome_mat_1.WelcomeMat; } });
Object.defineProperty(exports, "useWelcomeMat", { enumerable: true, get: function () { return welcome_mat_1.useWelcomeMat; } });
// TEMPORARILY COMMENTED OUT FOR DEBUGGING
// export { UniversalProfileSystem } from "./src/components/profile/universal-profile-system";
// export type { UniversalProfileUser } from "./src/components/profile/universal-profile-system";
// === DASHBOARD SYSTEM ===
// TEMPORARILY COMMENTED OUT FOR DEBUGGING
// export * from "./src/components/dashboard";
// export { AnalyticsDashboard } from "./src/components/analytics-dashboard/analytics-dashboard";
// === CARD COMPONENTS ===
var hive_card_1 = require("./src/components/hive-card");
Object.defineProperty(exports, "Card", { enumerable: true, get: function () { return hive_card_1.HiveCard; } });
Object.defineProperty(exports, "HiveCard", { enumerable: true, get: function () { return hive_card_1.HiveCard; } });
Object.defineProperty(exports, "CardContent", { enumerable: true, get: function () { return hive_card_1.HiveCardContent; } });
Object.defineProperty(exports, "CardHeader", { enumerable: true, get: function () { return hive_card_1.HiveCardHeader; } });
Object.defineProperty(exports, "CardTitle", { enumerable: true, get: function () { return hive_card_1.HiveCardTitle; } });
// === SHELL COMPONENTS ===
var enhanced_app_shell_1 = require("./src/components/shell/enhanced-app-shell");
Object.defineProperty(exports, "EnhancedAppShell", { enumerable: true, get: function () { return enhanced_app_shell_1.EnhancedAppShell; } });
// === BASIC HIVE COMPONENTS ===
var button_1 = require("./src/atomic/atoms/button");
Object.defineProperty(exports, "Button", { enumerable: true, get: function () { return button_1.Button; } });
Object.defineProperty(exports, "buttonVariants", { enumerable: true, get: function () { return button_1.buttonVariants; } });
var input_1 = require("./src/atomic/atoms/input");
Object.defineProperty(exports, "Input", { enumerable: true, get: function () { return input_1.Input; } });
Object.defineProperty(exports, "inputVariants", { enumerable: true, get: function () { return input_1.inputVariants; } });
var hive_select_1 = require("./src/components/hive-select");
Object.defineProperty(exports, "HiveSelect", { enumerable: true, get: function () { return hive_select_1.HiveSelect; } });
Object.defineProperty(exports, "hiveSelectVariants", { enumerable: true, get: function () { return hive_select_1.hiveSelectVariants; } });
var hive_coming_soon_modal_1 = require("./src/components/hive-coming-soon-modal");
Object.defineProperty(exports, "HiveComingSoonModal", { enumerable: true, get: function () { return hive_coming_soon_modal_1.HiveComingSoonModal; } });
var hive_modal_1 = require("./src/components/hive-modal");
Object.defineProperty(exports, "HiveModal", { enumerable: true, get: function () { return hive_modal_1.HiveModal; } });
var hive_logo_1 = require("./src/components/hive-logo");
Object.defineProperty(exports, "HiveLogo", { enumerable: true, get: function () { return hive_logo_1.HiveLogo; } });
var hive_badge_1 = require("./src/components/hive-badge");
Object.defineProperty(exports, "HiveBadge", { enumerable: true, get: function () { return hive_badge_1.HiveBadge; } });
Object.defineProperty(exports, "Badge", { enumerable: true, get: function () { return hive_badge_1.HiveBadge; } });
// === PROGRESS COMPONENTS ===
var progress_1 = require("./src/atomic/atoms/progress");
Object.defineProperty(exports, "Progress", { enumerable: true, get: function () { return progress_1.Progress; } });
Object.defineProperty(exports, "CircularProgress", { enumerable: true, get: function () { return progress_1.CircularProgress; } });
// Search Input Components
var school_search_input_1 = require("./src/components/welcome/school-search-input");
Object.defineProperty(exports, "SchoolSearchInput", { enumerable: true, get: function () { return school_search_input_1.SchoolSearchInput; } });
// === BASIC ATOMS ===
var button_2 = require("./src/atomic/atoms/button");
Object.defineProperty(exports, "AtomicButton", { enumerable: true, get: function () { return button_2.Button; } });
// Layout components for compatibility
var stack_1 = require("./src/components/elements/stack");
Object.defineProperty(exports, "Stack", { enumerable: true, get: function () { return stack_1.Stack; } });
var input_2 = require("./src/atomic/atoms/input");
Object.defineProperty(exports, "Input", { enumerable: true, get: function () { return input_2.Input; } });
Object.defineProperty(exports, "inputVariants", { enumerable: true, get: function () { return input_2.inputVariants; } });
var switch_enhanced_1 = require("./src/atomic/atoms/switch-enhanced");
Object.defineProperty(exports, "Switch", { enumerable: true, get: function () { return switch_enhanced_1.Switch; } });
Object.defineProperty(exports, "switchVariants", { enumerable: true, get: function () { return switch_enhanced_1.switchVariants; } });
// Badge is exported above as HiveBadge
// === LAYOUT COMPONENTS ===
var Grid_1 = require("./src/components/Grid");
Object.defineProperty(exports, "Grid", { enumerable: true, get: function () { return Grid_1.Grid; } });
// === ATOMIC CARD COMPONENTS ===
var card_1 = require("./src/atomic/ui/card");
Object.defineProperty(exports, "AtomicCard", { enumerable: true, get: function () { return card_1.Card; } });
Object.defineProperty(exports, "AtomicCardHeader", { enumerable: true, get: function () { return card_1.CardHeader; } });
Object.defineProperty(exports, "AtomicCardContent", { enumerable: true, get: function () { return card_1.CardContent; } });
Object.defineProperty(exports, "AtomicCardTitle", { enumerable: true, get: function () { return card_1.CardTitle; } });
Object.defineProperty(exports, "CardDescription", { enumerable: true, get: function () { return card_1.CardDescription; } });
// === FORM COMPONENTS ===
var label_1 = require("./src/atomic/atoms/label");
Object.defineProperty(exports, "Label", { enumerable: true, get: function () { return label_1.Label; } });
var textarea_1 = require("./src/atomic/atoms/textarea");
Object.defineProperty(exports, "Textarea", { enumerable: true, get: function () { return textarea_1.Textarea; } });
// === FILE UPLOAD ===
var hive_file_upload_1 = require("./src/components/hive-file-upload");
Object.defineProperty(exports, "HiveFileUpload", { enumerable: true, get: function () { return hive_file_upload_1.HiveFileUpload; } });
// === SURFACE COMPONENTS ===
var surfaces_1 = require("./src/components/surfaces");
Object.defineProperty(exports, "HivePinnedSurface", { enumerable: true, get: function () { return surfaces_1.HivePinnedSurface; } });
Object.defineProperty(exports, "HivePostsSurface", { enumerable: true, get: function () { return surfaces_1.HivePostsSurface; } });
Object.defineProperty(exports, "HiveEventsSurface", { enumerable: true, get: function () { return surfaces_1.HiveEventsSurface; } });
Object.defineProperty(exports, "HiveToolsSurface", { enumerable: true, get: function () { return surfaces_1.HiveToolsSurface; } });
Object.defineProperty(exports, "HiveChatSurface", { enumerable: true, get: function () { return surfaces_1.HiveChatSurface; } });
Object.defineProperty(exports, "HiveMembersSurface", { enumerable: true, get: function () { return surfaces_1.HiveMembersSurface; } });
Object.defineProperty(exports, "pinnedContentTypes", { enumerable: true, get: function () { return surfaces_1.pinnedContentTypes; } });
Object.defineProperty(exports, "postTypes", { enumerable: true, get: function () { return surfaces_1.postTypes; } });
Object.defineProperty(exports, "eventTypes", { enumerable: true, get: function () { return surfaces_1.eventTypes; } });
Object.defineProperty(exports, "rsvpStatuses", { enumerable: true, get: function () { return surfaces_1.rsvpStatuses; } });
Object.defineProperty(exports, "toolCategories", { enumerable: true, get: function () { return surfaces_1.toolCategories; } });
Object.defineProperty(exports, "toolStatuses", { enumerable: true, get: function () { return surfaces_1.toolStatuses; } });
Object.defineProperty(exports, "messageTypes", { enumerable: true, get: function () { return surfaces_1.messageTypes; } });
Object.defineProperty(exports, "messageStatuses", { enumerable: true, get: function () { return surfaces_1.messageStatuses; } });
Object.defineProperty(exports, "memberRoles", { enumerable: true, get: function () { return surfaces_1.memberRoles; } });
Object.defineProperty(exports, "memberStatuses", { enumerable: true, get: function () { return surfaces_1.memberStatuses; } });
// === ALERT COMPONENTS ===
var alert_1 = require("./src/components/ui/alert");
Object.defineProperty(exports, "Alert", { enumerable: true, get: function () { return alert_1.Alert; } });
Object.defineProperty(exports, "AlertDescription", { enumerable: true, get: function () { return alert_1.AlertDescription; } });
// === HIVE LAB EXPERIENCE ===
__exportStar(require("./src/atomic/templates"), exports);
// === HIVE LAB SYSTEM ===
var visual_tool_composer_1 = require("./src/components/hivelab/visual-tool-composer");
Object.defineProperty(exports, "VisualToolComposer", { enumerable: true, get: function () { return visual_tool_composer_1.VisualToolComposer; } });
var element_renderers_1 = require("./src/components/hivelab/element-renderers");
Object.defineProperty(exports, "renderElement", { enumerable: true, get: function () { return element_renderers_1.renderElement; } });
Object.defineProperty(exports, "SearchInputElement", { enumerable: true, get: function () { return element_renderers_1.SearchInputElement; } });
Object.defineProperty(exports, "FilterSelectorElement", { enumerable: true, get: function () { return element_renderers_1.FilterSelectorElement; } });
Object.defineProperty(exports, "ResultListElement", { enumerable: true, get: function () { return element_renderers_1.ResultListElement; } });
Object.defineProperty(exports, "DatePickerElement", { enumerable: true, get: function () { return element_renderers_1.DatePickerElement; } });
Object.defineProperty(exports, "UserSelectorElement", { enumerable: true, get: function () { return element_renderers_1.UserSelectorElement; } });
Object.defineProperty(exports, "TagCloudElement", { enumerable: true, get: function () { return element_renderers_1.TagCloudElement; } });
Object.defineProperty(exports, "MapViewElement", { enumerable: true, get: function () { return element_renderers_1.MapViewElement; } });
Object.defineProperty(exports, "ChartDisplayElement", { enumerable: true, get: function () { return element_renderers_1.ChartDisplayElement; } });
Object.defineProperty(exports, "FormBuilderElement", { enumerable: true, get: function () { return element_renderers_1.FormBuilderElement; } });
Object.defineProperty(exports, "NotificationCenterElement", { enumerable: true, get: function () { return element_renderers_1.NotificationCenterElement; } });
var element_system_1 = require("./src/lib/hivelab/element-system");
Object.defineProperty(exports, "ElementRegistry", { enumerable: true, get: function () { return element_system_1.ElementRegistry; } });
Object.defineProperty(exports, "ElementEngine", { enumerable: true, get: function () { return element_system_1.ElementEngine; } });
Object.defineProperty(exports, "CORE_ELEMENTS", { enumerable: true, get: function () { return element_system_1.CORE_ELEMENTS; } });
Object.defineProperty(exports, "TOOL_TEMPLATES", { enumerable: true, get: function () { return element_system_1.TOOL_TEMPLATES; } });
Object.defineProperty(exports, "initializeElementSystem", { enumerable: true, get: function () { return element_system_1.initializeElementSystem; } });
// === STYLES ===
// Note: CSS is imported separately in consuming applications
// === CREATOR COMPONENTS - HIVE TOOL BUILDER SYSTEM - TEMPORARILY DISABLED ===
// export {
//   VisualToolBuilder,
//   TemplateToolBuilder,
//   WizardToolBuilder,
//   ElementPicker,
//   ElementConfig,
//   ToolPreview,
//   createEmptyTool,
//   createElementInstance,
//   createDeploymentOptions,
//   validateTool,
//   getBuilderComponent,
//   HiveCreators,
//   ELEMENT_CATEGORIES,
//   HIVE_CREATORS_VERSION,
//   SUPPORTED_BUILDER_MODES,
//   CREATOR_FEATURES
// } from "./src/components/creators";
// Creator Types - TEMPORARILY DISABLED
// export type {
//   Element as CreatorElement,
//   ElementInstance as CreatorElementInstance,
//   Tool as CreatorTool,
//   ToolTemplate,
//   BuilderMode,
//   DeploymentOptions,
//   VisualBuilderProps,
//   TemplateBuilderProps,
//   WizardBuilderProps,
//   ElementPickerProps,
//   ElementConfigProps,
//   ToolPreviewProps,
//   ElementCategory,
//   ToolCategory,
//   ToolConfig,
//   ToolMetadata,
//   HiveElement,
//   HiveElementInstance,
//   HiveTool,
//   HiveToolTemplate,
//   HiveBuilderMode,
//   HiveDeploymentOptions
// } from "./src/components/creators";
// === NAVIGATION HOOKS ===
var hooks_1 = require("./src/hooks");
Object.defineProperty(exports, "useNavigation", { enumerable: true, get: function () { return hooks_1.useNavigation; } });
Object.defineProperty(exports, "useKeyboardNavigation", { enumerable: true, get: function () { return hooks_1.useKeyboardNavigation; } });
Object.defineProperty(exports, "useRouteTransitions", { enumerable: true, get: function () { return hooks_1.useRouteTransitions; } });
// === TOOL COMPONENTS (TEMPORARY STUBS) ===
var tools_marketplace_stub_js_1 = require("./src/components/tools-marketplace-stub.js");
Object.defineProperty(exports, "ToolMarketplace", { enumerable: true, get: function () { return tools_marketplace_stub_js_1.ToolMarketplace; } });
Object.defineProperty(exports, "LiveToolRuntime", { enumerable: true, get: function () { return tools_marketplace_stub_js_1.LiveToolRuntime; } });
