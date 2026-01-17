'use client';

/**
 * Portal Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Renders children into a different part of the DOM tree.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CONCEPT:
 *
 * Without Portal:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ <App>                                                                   │
 * │   ┌───────────────────────────────────────────────────────────────────┐ │
 * │   │ <Card> (overflow: hidden)                                         │ │
 * │   │   ┌─────────────────────────────────────────────────────────────┐ │ │
 * │   │   │ <Dropdown>                                                  │ │ │
 * │   │   │   ┌─────────────┐ ← Dropdown gets clipped by Card's overflow│ │ │
 * │   │   │   │ Menu Item 1 │                                           │ │ │
 * │   │   │   │ Menu Item 2 │                                           │ │ │
 * │   │   │   │ Menu Ite... │ ← Content cut off                         │ │ │
 * │   │   │   └─────────────┘                                           │ │ │
 * │   │   └─────────────────────────────────────────────────────────────┘ │ │
 * │   └───────────────────────────────────────────────────────────────────┘ │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * With Portal:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ <body>                                                                  │
 * │   <App>                                                                 │
 * │     ┌─────────────────────────────────────────────────────────────────┐ │
 * │     │ <Card> (overflow: hidden)                                       │ │
 * │     │   <Dropdown> (trigger only, content portaled)                   │ │
 * │     └─────────────────────────────────────────────────────────────────┘ │
 * │   </App>                                                                │
 * │                                                                         │
 * │   <Portal container=document.body>                                      │
 * │     ┌─────────────┐ ← Dropdown content renders at body level           │
 * │     │ Menu Item 1 │   Not affected by Card's overflow                  │
 * │     │ Menu Item 2 │                                                    │
 * │     │ Menu Item 3 │                                                    │
 * │     └─────────────┘                                                    │
 * │   </Portal>                                                            │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * COMMON USE CASES:
 *
 * 1. Modals/Dialogs:
 *    Portal to body to escape stacking contexts
 *
 * 2. Dropdowns/Menus:
 *    Portal to avoid overflow clipping
 *
 * 3. Tooltips:
 *    Portal to ensure proper z-index layering
 *
 * 4. Toasts/Notifications:
 *    Portal to fixed position container
 *
 * 5. Popovers:
 *    Portal to avoid position issues
 *
 * PORTAL TARGET OPTIONS:
 *
 * document.body (default):
 * ┌────────────────────────────────────────┐
 * │ <body>                                 │
 * │   <div id="root">App</div>             │
 * │   <div>Portaled content</div> ← HERE   │
 * │ </body>                                │
 * └────────────────────────────────────────┘
 *
 * Custom container:
 * ┌────────────────────────────────────────┐
 * │ <body>                                 │
 * │   <div id="root">App</div>             │
 * │   <div id="portal-root">              │
 * │     <div>Portaled content</div> ← HERE │
 * │   </div>                               │
 * │ </body>                                │
 * └────────────────────────────────────────┘
 *
 * STACKING CONTEXT:
 *
 * Portals create new stacking contexts. Use z-index to control layering:
 *
 * z-50:  Dropdowns, tooltips
 * z-100: Modals, dialogs
 * z-150: Toasts, notifications
 * z-200: Critical alerts
 *
 * ACCESSIBILITY:
 * - Focus management must be handled separately
 * - aria-hidden on background content for modals
 * - Focus trap for modal dialogs
 * - Return focus to trigger on close
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import * as PortalPrimitive from '@radix-ui/react-portal';
import { cn } from '../../lib/utils';

export interface PortalProps extends React.ComponentPropsWithoutRef<typeof PortalPrimitive.Root> {
  /** Container element to render portal into */
  container?: Element | null;
  /** Force mount (useful for exit animations) */
  forceMount?: boolean;
}

/**
 * Portal - Renders children into a different DOM node
 */
const Portal = React.forwardRef<
  React.ElementRef<typeof PortalPrimitive.Root>,
  PortalProps
>(({ container, ...props }, ref) => (
  <PortalPrimitive.Root
    ref={ref}
    container={container}
    {...props}
  />
));
Portal.displayName = PortalPrimitive.Root.displayName;

/**
 * PortalWithContainer - Portal with auto-created container element
 */
export interface PortalWithContainerProps {
  /** Container ID */
  containerId?: string;
  /** Container class name */
  containerClassName?: string;
  /** Children to portal */
  children: React.ReactNode;
}

const PortalWithContainer: React.FC<PortalWithContainerProps> = ({
  containerId = 'portal-root',
  containerClassName,
  children,
}) => {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    let element = document.getElementById(containerId);

    if (!element) {
      element = document.createElement('div');
      element.id = containerId;
      if (containerClassName) {
        element.className = containerClassName;
      }
      document.body.appendChild(element);
    }

    setContainer(element);

    return () => {
      // Only remove if we created it and it's empty
      if (element && element.childNodes.length === 0) {
        element.remove();
      }
    };
  }, [containerId, containerClassName]);

  if (!container) return null;

  return <Portal container={container}>{children}</Portal>;
};
PortalWithContainer.displayName = 'PortalWithContainer';

/**
 * ModalPortal - Portal optimized for modals with fixed positioning
 */
export interface ModalPortalProps {
  /** Children to portal */
  children: React.ReactNode;
  /** Additional class names for the container */
  className?: string;
}

const ModalPortal: React.FC<ModalPortalProps> = ({ children, className }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Portal>
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          className
        )}
      >
        {children}
      </div>
    </Portal>
  );
};
ModalPortal.displayName = 'ModalPortal';

/**
 * TooltipPortal - Portal optimized for tooltips with higher z-index
 */
export interface TooltipPortalProps {
  /** Children to portal */
  children: React.ReactNode;
}

const TooltipPortal: React.FC<TooltipPortalProps> = ({ children }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Portal>
      <div className="relative z-[60]">{children}</div>
    </Portal>
  );
};
TooltipPortal.displayName = 'TooltipPortal';

/**
 * ToastPortal - Portal for toast notifications
 */
export interface ToastPortalProps {
  /** Children to portal */
  children: React.ReactNode;
  /** Position */
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
}

const ToastPortal: React.FC<ToastPortalProps> = ({
  children,
  position = 'bottom-right',
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  if (!mounted) return null;

  return (
    <Portal>
      <div className={cn('fixed z-[100]', positionClasses[position])}>
        {children}
      </div>
    </Portal>
  );
};
ToastPortal.displayName = 'ToastPortal';

/**
 * usePortal - Hook for creating portal containers
 */
function usePortal(id: string = 'portal-root'): HTMLElement | null {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    let element = document.getElementById(id);
    let created = false;

    if (!element) {
      element = document.createElement('div');
      element.id = id;
      document.body.appendChild(element);
      created = true;
    }

    setContainer(element);

    return () => {
      if (created && element) {
        element.remove();
      }
    };
  }, [id]);

  return container;
}

export {
  Portal,
  PortalWithContainer,
  ModalPortal,
  TooltipPortal,
  ToastPortal,
  usePortal,
};
