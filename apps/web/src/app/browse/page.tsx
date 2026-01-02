/**
 * /browse → /spaces/browse
 * Phase 7: Short URL alias for space discovery
 */
import { redirect } from 'next/navigation';

export default function BrowsePage() {
  redirect('/spaces/browse');
}
