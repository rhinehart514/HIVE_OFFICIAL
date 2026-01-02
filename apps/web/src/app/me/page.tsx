/**
 * /me → /profile
 * Phase 7: Short URL alias for current user's profile
 */
import { redirect } from 'next/navigation';

export default function MePage() {
  redirect('/profile');
}
