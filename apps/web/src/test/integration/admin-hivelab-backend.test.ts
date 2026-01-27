import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Admin HiveLab Backend Tests
 *
 * SKIPPED: These tests are for admin routes that haven't been implemented yet.
 * Routes needed:
 * - @/app/api/admin/tools/catalog/export/route
 * - @/app/api/admin/tools/reviews/export/route
 * - @/app/api/admin/tools/deployments/export/route
 * - @/app/api/admin/tools/quality/run/route
 * - @/app/api/admin/tools/catalog/status/route
 * - @/app/api/admin/tools/deployments/action/route
 *
 * Once these routes are implemented, uncomment the tests below.
 */

describe.skip('Admin Hivelab Backend', () => {
  it.todo('exports catalog CSV with filters');
  it.todo('exports reviews CSV (pending only)');
  it.todo('exports deployments CSV with tool names');
  it.todo('requests quality run and logs event');
  it.todo('updates tool status via catalog/status');
  it.todo('changes deployment state via deployments/action');
});
