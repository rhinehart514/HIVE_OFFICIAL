import { redirect } from 'next/navigation';

/**
 * /spaces/create → /spaces/new redirect
 *
 * DEPRECATED: Use /spaces/new for the new space builder flow
 * This redirect preserves any existing bookmarks or links.
 */
export default function CreateSpacePage() {
  redirect('/spaces/new');
}
