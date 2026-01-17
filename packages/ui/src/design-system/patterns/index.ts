/**
 * HIVE Design System - Patterns
 * Source: docs/design-system/COMPONENTS.md
 *
 * Patterns are reusable layout compositions that solve common UI problems.
 * They sit between primitives/components and full page templates.
 *
 * The Pattern Hierarchy:
 * - FormLayout: Form field arrangements (vertical, horizontal, inline)
 * - ListLayout: List displays (basic, grouped, dense, card)
 * - GridLayout: Grid arrangements (fixed, autoFit, masonry, bento)
 * - SplitView: Split pane layouts (horizontal, vertical, master-detail)
 */

export {
  FormLayout,
  FormField,
  FormActions,
  FormSection,
  FormDivider,
  formLayoutVariants,
  formFieldVariants,
  formLabelVariants,
  formHelperVariants,
  type FormLayoutProps,
  type FormFieldProps,
  type FormActionsProps,
  type FormSectionProps,
} from './FormLayout';

export {
  ListLayout,
  ListItem,
  ListGroup,
  ListHeader,
  ListDivider,
  ListSkeleton,
  listLayoutVariants,
  listItemVariants,
  listGroupVariants,
  type ListLayoutProps,
  type ListItemProps,
  type ListGroupProps,
  type ListHeaderProps,
} from './ListLayout';

export {
  GridLayout,
  GridItem,
  GridSkeleton,
  BentoGrid,
  BentoItem,
  gridLayoutVariants,
  gridItemVariants,
  type GridLayoutProps,
  type GridItemProps,
  type BentoGridProps,
  type BentoItemProps,
} from './GridLayout';

export {
  SplitView,
  SplitPanel,
  SplitToggle,
  SplitHandle,
  splitViewVariants,
  splitPanelVariants,
  type SplitViewProps,
  type SplitPanelProps,
  type SplitRatio,
} from './SplitView';
