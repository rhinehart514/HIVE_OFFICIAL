import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Firebase to prevent initialization errors in tests
vi.mock("@hive/firebase", () => ({
  db: {},
  auth: {},
  storage: {},
  rtdb: {},
  getFirebaseApp: vi.fn(() => ({})),
}));

// Mock firebase-admin
vi.mock("firebase-admin", () => ({
  initializeApp: vi.fn(),
  credential: { cert: vi.fn() },
  apps: [],
}));

// Mock the structured logger to prevent Firebase admin initialization
vi.mock("../../../infrastructure/logging/structured-logger", () => ({
  structuredLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the archetypes module to skip schema validation in unit tests
vi.mock("../../../domain/rituals/archetypes", async () => {
  const actual = await vi.importActual("../../../domain/rituals/archetypes");
  return {
    ...actual,
    parseRitualUnion: vi.fn((input) => ({ success: true, data: input })),
  };
});

import { RitualEngineService } from "../../../application/rituals/ritual-engine.service";
import { Result } from "../../../domain/shared/base/Result";
import type { RitualUnion, RitualPhase, RitualArchetype } from "../../../domain/rituals/archetypes";
import type { IRitualConfigRepository } from "../../../infrastructure/repositories/interfaces";

// Mock repository
const createMockRepository = (): IRitualConfigRepository => ({
  findById: vi.fn(),
  findBySlug: vi.fn(),
  findByCampus: vi.fn(),
  findActive: vi.fn(),
  findByArchetype: vi.fn(),
  findActiveByArchetype: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
});

// Test data factory
// Use `as unknown as RitualUnion` since we mock schema validation
const createTestRitual = (overrides: Partial<RitualUnion> = {}): RitualUnion =>
  ({
    id: "rit_test_123",
    campusId: "ub-buffalo",
    title: "Test Ritual",
    subtitle: "A test ritual for unit testing",
    description: "This is a comprehensive test ritual",
    archetype: "founding_class",
    phase: "draft",
    startsAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endsAt: new Date(Date.now() + 86400000 * 7).toISOString(), // Week from now
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    visibility: "public",
    slug: "test-ritual",
    config: {
      founding: {
        limit: 100,
        currentCount: 0,
        deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
        founderBadge: { permanent: true },
      },
    },
    metrics: {
      participants: 0,
    },
    ...overrides,
  }) as unknown as RitualUnion;

describe("RitualEngineService", () => {
  let service: RitualEngineService;
  let mockRepository: IRitualConfigRepository;

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new RitualEngineService(mockRepository, { campusId: "ub-buffalo" });
  });

  describe("getRitual", () => {
    it("should return a ritual by ID", async () => {
      const ritual = createTestRitual();
      vi.mocked(mockRepository.findById).mockResolvedValue(Result.ok(ritual));

      const result = await service.getRitual("rit_test_123");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(ritual);
      expect(mockRepository.findById).toHaveBeenCalledWith("rit_test_123");
    });

    it("should return failure when ritual not found", async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(
        Result.fail("Ritual not found")
      );

      const result = await service.getRitual("nonexistent");

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Ritual not found");
    });
  });

  describe("getRitualBySlug", () => {
    it("should return a ritual by slug and campus", async () => {
      const ritual = createTestRitual({ slug: "founding-class-2025" });
      vi.mocked(mockRepository.findBySlug).mockResolvedValue(Result.ok(ritual));

      const result = await service.getRitualBySlug("founding-class-2025", "ub-buffalo");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().slug).toBe("founding-class-2025");
      expect(mockRepository.findBySlug).toHaveBeenCalledWith("founding-class-2025", "ub-buffalo");
    });
  });

  describe("listRituals", () => {
    it("should list rituals by campus", async () => {
      const rituals = [createTestRitual(), createTestRitual({ id: "rit_test_456" })];
      vi.mocked(mockRepository.findByCampus).mockResolvedValue(Result.ok(rituals));

      const result = await service.listRituals("ub-buffalo");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toHaveLength(2);
    });

    it("should filter by phases", async () => {
      const activeRitual = createTestRitual({ phase: "active" });
      vi.mocked(mockRepository.findByCampus).mockResolvedValue(Result.ok([activeRitual]));

      const result = await service.listRituals("ub-buffalo", ["active"]);

      expect(mockRepository.findByCampus).toHaveBeenCalledWith("ub-buffalo", { phases: ["active"] });
    });
  });

  describe("listActiveRituals", () => {
    it("should list active rituals for a campus", async () => {
      const activeRitual = createTestRitual({ phase: "active" });
      vi.mocked(mockRepository.findActive).mockResolvedValue(Result.ok([activeRitual]));

      const result = await service.listActiveRituals("ub-buffalo");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()[0].phase).toBe("active");
    });

    it("should use provided reference date", async () => {
      const refDate = new Date("2025-06-01");
      vi.mocked(mockRepository.findActive).mockResolvedValue(Result.ok([]));

      await service.listActiveRituals("ub-buffalo", refDate);

      expect(mockRepository.findActive).toHaveBeenCalledWith("ub-buffalo", refDate);
    });
  });

  describe("listRitualsByArchetype", () => {
    it("should list rituals by archetype", async () => {
      const foundingRitual = createTestRitual({ archetype: "founding_class" } as unknown as Partial<RitualUnion>);
      vi.mocked(mockRepository.findByArchetype).mockResolvedValue(Result.ok([foundingRitual]));

      const result = await service.listRitualsByArchetype("ub-buffalo", "founding_class" as unknown as RitualArchetype);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()[0].archetype).toBe("founding_class");
    });
  });

  describe("createRitual", () => {
    it("should create a new ritual with generated ID", async () => {
      vi.mocked(mockRepository.save).mockResolvedValue(Result.ok(undefined));

      const input = {
        campusId: "ub-buffalo",
        title: "New Founding Class",
        archetype: "founding_class" as RitualArchetype,
        phase: "draft" as RitualPhase,
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        endsAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        visibility: "public" as const,
        config: { founding: { limit: 50, currentCount: 0, deadline: new Date().toISOString(), founderBadge: { permanent: true } } },
      } as unknown as Parameters<typeof service.createRitual>[0];

      const result = await service.createRitual(input);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().id).toMatch(/^rit_/);
      expect(result.getValue().title).toBe("New Founding Class");
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it("should use provided ID if given", async () => {
      vi.mocked(mockRepository.save).mockResolvedValue(Result.ok(undefined));

      const input = {
        id: "rit_custom_id",
        campusId: "ub-buffalo",
        title: "Custom ID Ritual",
        archetype: "survival" as RitualArchetype,
        phase: "draft" as RitualPhase,
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        endsAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        visibility: "public" as const,
        config: { survival: { rounds: 5, votingDurationMinutes: 60, eliminationPercentage: 10 } },
      } as unknown as Parameters<typeof service.createRitual>[0];

      const result = await service.createRitual(input);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().id).toBe("rit_custom_id");
    });

    it("should fail when save fails", async () => {
      vi.mocked(mockRepository.save).mockResolvedValue(
        Result.fail("Database error")
      );

      const input = {
        campusId: "ub-buffalo",
        title: "Failed Ritual",
        archetype: "tournament" as RitualArchetype,
        phase: "draft" as RitualPhase,
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        endsAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        visibility: "public" as const,
        config: { tournament: { bracketSize: 32, roundDurationMinutes: 120, seeding: "random" as const } },
      } as unknown as Parameters<typeof service.createRitual>[0];

      const result = await service.createRitual(input);

      expect(result.isFailure).toBe(true);
    });
  });

  describe("updateRitual", () => {
    it("should update an existing ritual", async () => {
      const existing = createTestRitual();
      vi.mocked(mockRepository.findById).mockResolvedValue(Result.ok(existing));
      vi.mocked(mockRepository.save).mockResolvedValue(Result.ok(undefined));

      const result = await service.updateRitual("rit_test_123", {
        title: "Updated Title",
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().title).toBe("Updated Title");
      expect(result.getValue().id).toBe(existing.id);
    });

    it("should preserve original createdAt", async () => {
      const originalCreatedAt = "2025-01-01T00:00:00Z";
      const existing = createTestRitual({ createdAt: originalCreatedAt });
      vi.mocked(mockRepository.findById).mockResolvedValue(Result.ok(existing));
      vi.mocked(mockRepository.save).mockResolvedValue(Result.ok(undefined));

      const result = await service.updateRitual("rit_test_123", {
        title: "New Title",
      });

      expect(result.getValue().createdAt).toBe(originalCreatedAt);
    });

    it("should fail when ritual not found", async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(
        Result.fail("Ritual not found")
      );

      const result = await service.updateRitual("nonexistent", { title: "New" });

      expect(result.isFailure).toBe(true);
    });
  });

  describe("deleteRitual", () => {
    it("should delete an existing ritual", async () => {
      const existing = createTestRitual();
      vi.mocked(mockRepository.findById).mockResolvedValue(Result.ok(existing));
      vi.mocked(mockRepository.delete).mockResolvedValue(Result.ok(undefined));

      const result = await service.deleteRitual("rit_test_123");

      expect(result.isSuccess).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith("rit_test_123");
    });

    it("should fail when ritual not found", async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(
        Result.fail("Ritual not found")
      );

      const result = await service.deleteRitual("nonexistent");

      expect(result.isFailure).toBe(true);
    });
  });

  describe("transitionPhase", () => {
    it("should transition from draft to announced", async () => {
      const ritual = createTestRitual({ phase: "draft" });
      vi.mocked(mockRepository.findById).mockResolvedValue(Result.ok(ritual));
      vi.mocked(mockRepository.save).mockResolvedValue(Result.ok(undefined));

      const result = await service.transitionPhase("rit_test_123", "announced");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().phase).toBe("announced");
    });

    it("should transition from announced to active", async () => {
      const ritual = createTestRitual({ phase: "announced" });
      vi.mocked(mockRepository.findById).mockResolvedValue(Result.ok(ritual));
      vi.mocked(mockRepository.save).mockResolvedValue(Result.ok(undefined));

      const result = await service.transitionPhase("rit_test_123", "active");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().phase).toBe("active");
    });

    it("should transition from active to ended", async () => {
      const ritual = createTestRitual({ phase: "active" });
      vi.mocked(mockRepository.findById).mockResolvedValue(Result.ok(ritual));
      vi.mocked(mockRepository.save).mockResolvedValue(Result.ok(undefined));

      const result = await service.transitionPhase("rit_test_123", "ended");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().phase).toBe("ended");
    });

    it("should not transition if already in target phase", async () => {
      const ritual = createTestRitual({ phase: "active" });
      vi.mocked(mockRepository.findById).mockResolvedValue(Result.ok(ritual));

      const result = await service.transitionPhase("rit_test_123", "active");

      expect(result.isSuccess).toBe(true);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("should fail for invalid transitions", async () => {
      const ritual = createTestRitual({ phase: "ended" });
      vi.mocked(mockRepository.findById).mockResolvedValue(Result.ok(ritual));

      const result = await service.transitionPhase("rit_test_123", "active");

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("Cannot transition from ended to active");
    });

    it("should fail draft to ended directly", async () => {
      const ritual = createTestRitual({ phase: "draft" });
      vi.mocked(mockRepository.findById).mockResolvedValue(Result.ok(ritual));

      const result = await service.transitionPhase("rit_test_123", "ended");

      expect(result.isFailure).toBe(true);
    });
  });

  describe("evaluateScheduledTransitions", () => {
    it("should transition announced rituals to active when start time passed", async () => {
      const announcedRitual = createTestRitual({
        phase: "announced",
        startsAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      });
      vi.mocked(mockRepository.findActive).mockResolvedValue(Result.ok([announcedRitual]));
      vi.mocked(mockRepository.findById).mockResolvedValue(Result.ok(announcedRitual));
      vi.mocked(mockRepository.save).mockResolvedValue(Result.ok(undefined));

      const result = await service.evaluateScheduledTransitions("ub-buffalo");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toHaveLength(1);
      expect(result.getValue()[0].phase).toBe("active");
    });

    it("should transition active rituals to ended when end time passed", async () => {
      const activeRitual = createTestRitual({
        phase: "active",
        endsAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      });
      vi.mocked(mockRepository.findActive).mockResolvedValue(Result.ok([activeRitual]));
      vi.mocked(mockRepository.findById).mockResolvedValue(Result.ok(activeRitual));
      vi.mocked(mockRepository.save).mockResolvedValue(Result.ok(undefined));

      const result = await service.evaluateScheduledTransitions("ub-buffalo");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toHaveLength(1);
      expect(result.getValue()[0].phase).toBe("ended");
    });

    it("should not transition rituals that are not ready", async () => {
      const futureRitual = createTestRitual({
        phase: "announced",
        startsAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      });
      vi.mocked(mockRepository.findActive).mockResolvedValue(Result.ok([futureRitual]));

      const result = await service.evaluateScheduledTransitions("ub-buffalo");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toHaveLength(0);
    });

    it("should handle multiple transitions in one call", async () => {
      const announcedRitual = createTestRitual({
        id: "rit_1",
        phase: "announced",
        startsAt: new Date(Date.now() - 3600000).toISOString(),
      });
      const activeRitual = createTestRitual({
        id: "rit_2",
        phase: "active",
        endsAt: new Date(Date.now() - 3600000).toISOString(),
      });

      vi.mocked(mockRepository.findActive).mockResolvedValue(
        Result.ok([announcedRitual, activeRitual])
      );
      vi.mocked(mockRepository.findById)
        .mockResolvedValueOnce(Result.ok(announcedRitual))
        .mockResolvedValueOnce(Result.ok(activeRitual));
      vi.mocked(mockRepository.save).mockResolvedValue(Result.ok(undefined));

      const result = await service.evaluateScheduledTransitions("ub-buffalo");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toHaveLength(2);
    });
  });

  describe("phase transition rules", () => {
    const testTransition = async (
      from: RitualPhase,
      to: RitualPhase,
      shouldSucceed: boolean
    ) => {
      const ritual = createTestRitual({ phase: from });
      vi.mocked(mockRepository.findById).mockResolvedValue(Result.ok(ritual));
      vi.mocked(mockRepository.save).mockResolvedValue(Result.ok(undefined));

      const result = await service.transitionPhase("rit_test_123", to);

      if (shouldSucceed) {
        expect(result.isSuccess).toBe(true);
      } else {
        expect(result.isFailure).toBe(true);
      }
    };

    it("draft → announced: allowed", () => testTransition("draft", "announced", true));
    it("draft → active: allowed", () => testTransition("draft", "active", true));
    it("draft → cooldown: not allowed", () => testTransition("draft", "cooldown", false));
    it("draft → ended: not allowed", () => testTransition("draft", "ended", false));

    it("announced → active: allowed", () => testTransition("announced", "active", true));
    it("announced → cooldown: allowed", () => testTransition("announced", "cooldown", true));
    it("announced → ended: allowed", () => testTransition("announced", "ended", true));
    it("announced → draft: not allowed", () => testTransition("announced", "draft", false));

    it("active → cooldown: allowed", () => testTransition("active", "cooldown", true));
    it("active → ended: allowed", () => testTransition("active", "ended", true));
    it("active → draft: not allowed", () => testTransition("active", "draft", false));
    it("active → announced: not allowed", () => testTransition("active", "announced", false));

    it("cooldown → ended: allowed", () => testTransition("cooldown", "ended", true));
    it("cooldown → active: not allowed", () => testTransition("cooldown", "active", false));

    it("ended → any: not allowed", async () => {
      await testTransition("ended", "draft", false);
      await testTransition("ended", "announced", false);
      await testTransition("ended", "active", false);
      await testTransition("ended", "cooldown", false);
    });
  });

  describe("archetype-specific rituals", () => {
    it("should create a founding_class ritual with founderSlots", async () => {
      vi.mocked(mockRepository.save).mockResolvedValue(Result.ok(undefined));

      // Use type assertion since we mock schema validation
      const result = await service.createRitual({
        campusId: "ub-buffalo",
        title: "HIVE Founding Class",
        archetype: "founding_class" as RitualArchetype,
        phase: "draft" as RitualPhase,
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        endsAt: new Date(Date.now() + 86400000 * 30).toISOString(),
        visibility: "public",
        config: {
          founding: {
            limit: 100,
            currentCount: 0,
            deadline: new Date(Date.now() + 86400000 * 30).toISOString(),
            founderBadge: { permanent: true },
          },
        },
      } as unknown as Parameters<typeof service.createRitual>[0]);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().archetype).toBe("founding_class");
    });

    it("should create a survival ritual with elimination config", async () => {
      vi.mocked(mockRepository.save).mockResolvedValue(Result.ok(undefined));

      // Use `as unknown` since we mock schema validation and don't need full config
      const result = await service.createRitual({
        campusId: "ub-buffalo",
        title: "Survival Challenge",
        archetype: "survival" as RitualArchetype,
        phase: "draft" as RitualPhase,
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        endsAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        visibility: "public",
        config: {
          survival: {
            rounds: 5,
            votingDurationMinutes: 60,
            eliminationPercentage: 10,
          },
        },
      } as unknown as Parameters<typeof service.createRitual>[0]);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().archetype).toBe("survival");
    });

    it("should create a tournament ritual with bracket config", async () => {
      vi.mocked(mockRepository.save).mockResolvedValue(Result.ok(undefined));

      // Use `as unknown` since we mock schema validation and don't need full config
      const result = await service.createRitual({
        campusId: "ub-buffalo",
        title: "Campus Tournament",
        archetype: "tournament" as RitualArchetype,
        phase: "draft" as RitualPhase,
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        endsAt: new Date(Date.now() + 86400000 * 14).toISOString(),
        visibility: "public",
        config: {
          tournament: {
            bracketSize: 32,
            roundDurationMinutes: 120,
            seeding: "random",
          },
        },
      } as unknown as Parameters<typeof service.createRitual>[0]);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().archetype).toBe("tournament");
    });
  });
});
