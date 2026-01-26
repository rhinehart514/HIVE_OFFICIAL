'use client';

/**
 * Universal HiveLab Elements - Re-exports
 *
 * This file now re-exports from modular files in the universal/ directory.
 * Each element has been extracted to its own file for better maintainability.
 *
 * Import from here for backward compatibility, or import directly from
 * the individual element files for optimal code splitting.
 */

export {
  SearchInputElement,
  FilterSelectorElement,
  ResultListElement,
  DatePickerElement,
  TagCloudElement,
  ChartDisplayElement,
  FormBuilderElement,
  NotificationCenterElement,
  UserSelectorElement,
  MapViewElement,
  PhotoGalleryElement,
} from './universal/index';
