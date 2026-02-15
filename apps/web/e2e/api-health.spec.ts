import { test, expect } from "@playwright/test";

/**
 * API Health Checks — verify critical API endpoints respond without 500s.
 * Auth-protected endpoints return 401/403 which is fine — we just verify no crashes.
 */

test.describe("API Health", () => {
  test("GET /api/health returns 200", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBeDefined();
    expect(["healthy", "degraded", "unhealthy"]).toContain(body.status);
    expect(body.checks).toBeDefined();
  });

  test("GET /api/health?verbose=true includes details", async ({ request }) => {
    const res = await request.get("/api/health?verbose=true");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.details).toBeDefined();
  });

  test("GET /api/feature-flags responds", async ({ request }) => {
    const res = await request.get("/api/feature-flags");
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/auth/csrf returns CSRF token", async ({ request }) => {
    const res = await request.get("/api/auth/csrf");
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe("Auth API Endpoints (unauthenticated)", () => {
  test("POST /api/auth/send-code requires body", async ({ request }) => {
    const res = await request.post("/api/auth/send-code", { data: {} });
    // Should return 400 (bad request) not 500
    expect(res.status()).toBeLessThan(500);
  });

  test("POST /api/auth/verify-code requires body", async ({ request }) => {
    const res = await request.post("/api/auth/verify-code", { data: {} });
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/auth/me without session returns 401", async ({ request }) => {
    const res = await request.get("/api/auth/me");
    expect(res.status()).toBeLessThan(500);
    expect([401, 403]).toContain(res.status());
  });

  test("POST /api/auth/logout responds", async ({ request }) => {
    const res = await request.post("/api/auth/logout");
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/auth/health responds", async ({ request }) => {
    const res = await request.get("/api/auth/health");
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe("Content API Endpoints (unauthenticated)", () => {
  const endpoints = [
    { method: "GET", path: "/api/campus/detect" },
    { method: "GET", path: "/api/tools/browse" },
    { method: "GET", path: "/api/tools/discover" },
  ];

  for (const { method, path } of endpoints) {
    test(`${method} ${path} does not 500`, async ({ request }) => {
      const res = method === "GET"
        ? await request.get(path)
        : await request.post(path, { data: {} });
      expect(res.status()).toBeLessThan(500);
    });
  }
});
