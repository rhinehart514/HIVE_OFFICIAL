/**
 * Spaces Layout
 *
 * Shell is hidden for /spaces via AppShell prefix exclusion.
 * This layout just passes children through.
 */
export default function SpacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
