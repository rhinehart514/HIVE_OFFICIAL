/**
 * HiveLab Templates Module
 *
 * Exports for community tool templates.
 */

export {
  // Entity
  Template,
  // Types
  type TemplateProps,
  type TemplateCategory,
  type TemplateVisibility,
  type TemplateSource,
  type TemplateElement,
  type TemplateConnection,
  type TemplateComposition,
  // DTOs
  type TemplateListItemDTO,
  type TemplateDetailDTO,
  toTemplateListItemDTO,
  toTemplateDetailDTO,
} from './template.entity';

export {
  // Repository
  type ITemplateRepository,
  type TemplateQueryOptions,
  type PaginatedResult,
  FirebaseAdminTemplateRepository,
  getServerTemplateRepository,
  resetServerTemplateRepository,
} from './template.repository';
