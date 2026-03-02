/**
 * HiveLab Tool Creation Utilities
 *
 * Shared logic for creating tools from AI prompts.
 */

/**
 * Create a new blank tool via API
 */
export async function createBlankTool(
  name: string,
  description?: string,
  toolType: 'visual' | 'code' = 'code'
): Promise<string> {
  const response = await fetch('/api/tools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: name || 'Untitled Tool',
      description: description || '',
      status: 'draft',
      type: toolType,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to create tool');
  }

  const result = await response.json();
  const data = result.data || result;
  return data.tool.id;
}

/**
 * Generate a tool name from an AI prompt
 * Takes the first 3-4 words and title-cases them
 */
export function generateToolName(prompt: string): string {
  const words = prompt.trim().split(/\s+/).slice(0, 4);
  const title = words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return title || 'New Tool';
}

/**
 * Format relative time for tool cards
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
