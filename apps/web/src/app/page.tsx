import { WindowLanding } from '@/components/landing/window-landing';

export const dynamic = 'force-dynamic';

/**
 * Home Page - The Entrance
 *
 * Uses the WindowLanding experience:
 * - Fragments of HIVE appearing with rhythm
 * - No scroll, no explanation
 * - Just the world, and a door in
 *
 * Legacy landing available at /landing/classic
 */
export default function HomePage() {
  return <WindowLanding />;
}
