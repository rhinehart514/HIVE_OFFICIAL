/**
 * Inngest API Route
 *
 * Serves the Inngest handler for all HiveLab automation functions.
 * Inngest uses this endpoint to:
 * 1. Register functions (on deploy)
 * 2. Execute functions (on event)
 * 3. Handle retries and scheduling
 */

import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import {
  handleToolAction,
  deliverNotification,
  handleToolDeployed,
} from '@/lib/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    handleToolAction,
    deliverNotification,
    handleToolDeployed,
  ],
});
