/**
 * /build → /tools/create
 * Phase 7: Short URL alias for HiveLab IDE
 */
import { redirect } from 'next/navigation';

export default function BuildPage() {
  redirect('/tools/create');
}
