/**
 * Automation Templates - Stub (Phase 3.5)
 * TODO: Implement automation template system
 */

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [];

export function getAllTemplates(): AutomationTemplate[] {
  return AUTOMATION_TEMPLATES;
}

export function getTemplatesByCategory(category: string): AutomationTemplate[] {
  return AUTOMATION_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id: string): AutomationTemplate | undefined {
  return AUTOMATION_TEMPLATES.find(t => t.id === id);
}

export function createFromTemplate(_templateId: string, _overrides?: Partial<AutomationTemplate>): AutomationTemplate | null {
  return null;
}

export function getTemplateCategories(): string[] {
  return [...new Set(AUTOMATION_TEMPLATES.map(t => t.category))];
}
