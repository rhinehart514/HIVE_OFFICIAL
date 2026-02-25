import { z } from "zod";
import * as admin from "firebase-admin";
import { dbAdmin } from "@/lib/firebase-admin";
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";

// ============================================================================
// Request Schema
// ============================================================================

const ExecuteActionSchema = z.object({
  toolId: z.string().min(1),
  deploymentId: z.string().optional(), // null/undefined = standalone
  elementId: z.string().min(1),        // element instance ID
  action: z.string().min(1),
  data: z.record(z.unknown()).default({}),
  spaceId: z.string().optional(),
});

// ============================================================================
// State Document Helpers
// ============================================================================

function sharedDocId(toolId: string, deploymentId: string): string {
  return `${toolId}_${deploymentId}_shared`;
}

function userDocId(toolId: string, deploymentId: string, userId: string): string {
  return `${toolId}_${deploymentId}_${userId}`;
}

// Fetch shared state counters and collections for this tool deployment
async function getSharedState(toolId: string, deploymentId: string) {
  const db = dbAdmin;
  const doc = await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).get();
  return doc.exists ? (doc.data() ?? {}) : {};
}

// Fetch user state for this tool deployment
async function getUserState(toolId: string, deploymentId: string, userId: string) {
  const db = dbAdmin;
  const doc = await db.collection("tool_states").doc(userDocId(toolId, deploymentId, userId)).get();
  return doc.exists ? (doc.data() ?? {}) : {};
}

// ============================================================================
// Action Handlers
// ============================================================================

// --- Poll: vote ---
async function handlePollVote(
  toolId: string,
  deploymentId: string,
  elementId: string,
  data: Record<string, unknown>,
  userId: string,
  sharedState: Record<string, unknown>,
  userState: Record<string, unknown>,
  toolConfig: Record<string, unknown>,
): Promise<ExecuteResult> {
  const optionId = data.optionId as string;
  if (!optionId) throw new Error("optionId is required for vote action");

  const allowChangeVote = toolConfig?.allowChangeVote === true;
  const selections = (userState.selections ?? {}) as Record<string, unknown>;
  const prevVote = selections[`${elementId}:selectedOption`] as string | undefined;

  if (prevVote && !allowChangeVote) {
    throw new Error("You have already voted and changing vote is not allowed");
  }

  const db = dbAdmin;
  const now = new Date().toISOString();

  // Build counter deltas
  const counterDeltas: Record<string, number> = {};
  counterDeltas[`${elementId}:${optionId}`] = 1;
  if (prevVote && prevVote !== optionId) {
    counterDeltas[`${elementId}:${prevVote}`] = -1;
  }

  // Persist shared state (atomic counter increments)
  const sharedRef = db.collection("tool_states").doc(sharedDocId(toolId, deploymentId));
  const counterUpdates: Record<string, admin.firestore.FieldValue> = {};
  for (const [key, delta] of Object.entries(counterDeltas)) {
    counterUpdates[`counters.${key}`] = admin.firestore.FieldValue.increment(delta);
  }
  await sharedRef.set(
    { ...counterUpdates, version: admin.firestore.FieldValue.increment(1), lastModified: now },
    { merge: true }
  );

  // Persist user state
  const userRef = db.collection("tool_states").doc(userDocId(toolId, deploymentId, userId));
  await userRef.set(
    {
      [`selections.${elementId}:selectedOption`]: optionId,
      [`participation.${elementId}:voted`]: true,
      lastModified: now,
    },
    { merge: true }
  );

  return {
    sharedStateUpdate: { counterDeltas },
    userStateUpdate: {
      selections: { [`${elementId}:selectedOption`]: optionId },
      participation: { [`${elementId}:voted`]: true },
    },
  };
}

// --- Counter: increment / decrement / reset ---
async function handleCounterAction(
  toolId: string,
  deploymentId: string,
  elementId: string,
  action: string,
  data: Record<string, unknown>,
  userId: string,
  toolConfig: Record<string, unknown>,
): Promise<ExecuteResult> {
  const step = (data.step as number) ?? 1;
  const min = toolConfig?.min as number | undefined;
  const max = toolConfig?.max as number | undefined;

  let delta = 0;
  if (action === "increment") delta = step;
  else if (action === "decrement") delta = -step;
  else if (action === "reset") {
    // For reset, set absolute value — handled separately
    const resetTo = (toolConfig?.initialValue as number) ?? 0;
    const db = dbAdmin;
    const now = new Date().toISOString();

    // Get current value to compute delta
    const sharedState = await getSharedState(toolId, deploymentId);
    const counters = (sharedState.counters ?? {}) as Record<string, number>;
    const current = counters[`${elementId}:value`] ?? 0;
    const resetDelta = resetTo - current;

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`counters.${elementId}:value`]: admin.firestore.FieldValue.increment(resetDelta),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: { counterDeltas: { [`${elementId}:value`]: resetDelta } },
    };
  }

  const db = dbAdmin;
  const now = new Date().toISOString();

  // Atomic bounds check + increment inside a transaction
  if ((min !== undefined || max !== undefined) && delta !== 0) {
    const sharedRef = db.collection("tool_states").doc(sharedDocId(toolId, deploymentId));
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(sharedRef);
      const docData = doc.data() || {};
      const counters = (docData.counters ?? {}) as Record<string, number>;
      const current = counters[`${elementId}:value`] ?? 0;
      const next = current + delta;
      if (min !== undefined && next < min) throw new Error(`Counter minimum is ${min}`);
      if (max !== undefined && next > max) throw new Error(`Counter maximum is ${max}`);

      transaction.set(sharedRef, {
        [`counters.${elementId}:value`]: admin.firestore.FieldValue.increment(delta),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      }, { merge: true });
    });
  } else {
    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`counters.${elementId}:value`]: admin.firestore.FieldValue.increment(delta),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );
  }

  return {
    sharedStateUpdate: { counterDeltas: { [`${elementId}:value`]: delta } },
  };
}

// --- RSVP: rsvp / cancel_rsvp / join_waitlist ---
async function handleRsvpAction(
  toolId: string,
  deploymentId: string,
  elementId: string,
  action: string,
  data: Record<string, unknown>,
  userId: string,
  userState: Record<string, unknown>,
  toolConfig: Record<string, unknown>,
): Promise<ExecuteResult> {
  const maxCapacity = (toolConfig?.maxCapacity as number) ?? Infinity;
  const db = dbAdmin;
  const now = new Date().toISOString();

  if (action === "rsvp") {
    const participation = (userState.participation ?? {}) as Record<string, boolean>;
    if (participation[`${elementId}:rsvped`]) throw new Error("Already RSVPed");

    // Atomic capacity check + increment inside a transaction
    const sharedRef = db.collection("tool_states").doc(sharedDocId(toolId, deploymentId));
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(sharedRef);
      const docData = doc.data() || {};
      const counters = (docData.counters ?? {}) as Record<string, number>;
      const currentCount = counters[`${elementId}:attendees`] ?? 0;
      if (currentCount >= maxCapacity) throw new Error("Event is at capacity");

      transaction.set(sharedRef, {
        [`counters.${elementId}:attendees`]: admin.firestore.FieldValue.increment(1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      }, { merge: true });
    });

    await db.collection("tool_states").doc(userDocId(toolId, deploymentId, userId)).set(
      {
        [`participation.${elementId}:rsvped`]: true,
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: { counterDeltas: { [`${elementId}:attendees`]: 1 } },
      userStateUpdate: { participation: { [`${elementId}:rsvped`]: true } },
    };
  }

  if (action === "cancel_rsvp") {
    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`counters.${elementId}:attendees`]: admin.firestore.FieldValue.increment(-1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    await db.collection("tool_states").doc(userDocId(toolId, deploymentId, userId)).set(
      {
        [`participation.${elementId}:rsvped`]: false,
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: { counterDeltas: { [`${elementId}:attendees`]: -1 } },
      userStateUpdate: { participation: { [`${elementId}:rsvped`]: false } },
    };
  }

  if (action === "join_waitlist") {
    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`counters.${elementId}:waitlist`]: admin.firestore.FieldValue.increment(1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    await db.collection("tool_states").doc(userDocId(toolId, deploymentId, userId)).set(
      {
        [`participation.${elementId}:waitlisted`]: true,
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: { counterDeltas: { [`${elementId}:waitlist`]: 1 } },
      userStateUpdate: { participation: { [`${elementId}:waitlisted`]: true } },
    };
  }

  throw new Error(`Unknown RSVP action: ${action}`);
}

// --- Checklist: toggle_complete ---
async function handleChecklistToggle(
  toolId: string,
  deploymentId: string,
  elementId: string,
  data: Record<string, unknown>,
  userId: string,
): Promise<ExecuteResult> {
  const itemId = data.itemId as string;
  const completed = data.completed as boolean;
  if (!itemId) throw new Error("itemId is required");

  const db = dbAdmin;
  const now = new Date().toISOString();
  const entryKey = `${userId}:${itemId}`;
  const collectionKey = `${elementId}:completions`;

  await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
    {
      [`collections.${collectionKey}.${entryKey}`]: {
        id: entryKey,
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
        data: { itemId, completed, userId },
      },
      version: admin.firestore.FieldValue.increment(1),
      lastModified: now,
    },
    { merge: true }
  );

  return {
    sharedStateUpdate: {
      collectionUpserts: {
        [collectionKey]: {
          [entryKey]: {
            id: entryKey,
            createdAt: now,
            createdBy: userId,
            updatedAt: now,
            data: { itemId, completed, userId },
          },
        },
      },
    },
  };
}

// --- Signup Sheet: signup / withdraw ---
async function handleSignupAction(
  toolId: string,
  deploymentId: string,
  elementId: string,
  action: string,
  data: Record<string, unknown>,
  userId: string,
  userState: Record<string, unknown>,
  toolConfig: Record<string, unknown>,
): Promise<ExecuteResult> {
  const slotId = data.slotId as string;
  if (!slotId) throw new Error("slotId is required");

  const db = dbAdmin;
  const now = new Date().toISOString();
  const collectionKey = `${elementId}:signups`;
  const entryId = `${userId}:${slotId}`;

  if (action === "signup") {
    // Check slot capacity
    const slots = (toolConfig?.slots as Array<{ id: string; capacity?: number }>) ?? [];
    const slot = slots.find((s) => s.id === slotId);
    const capacity = slot?.capacity ?? Infinity;

    // Atomic capacity check + signup inside a transaction
    const sharedRef = db.collection("tool_states").doc(sharedDocId(toolId, deploymentId));
    if (isFinite(capacity)) {
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(sharedRef);
        const docData = doc.data() || {};
        const counters = (docData.counters ?? {}) as Record<string, number>;
        const current = counters[`${elementId}:slot:${slotId}`] ?? 0;
        if (current >= capacity) throw new Error("This slot is full");

        transaction.set(sharedRef, {
          [`collections.${collectionKey}.${entryId}`]: {
            id: entryId,
            createdAt: now,
            createdBy: userId,
            data: { slotId, userId },
          },
          [`counters.${elementId}:slot:${slotId}`]: admin.firestore.FieldValue.increment(1),
          version: admin.firestore.FieldValue.increment(1),
          lastModified: now,
        }, { merge: true });
      });
    } else {
      await sharedRef.set(
        {
          [`collections.${collectionKey}.${entryId}`]: {
            id: entryId,
            createdAt: now,
            createdBy: userId,
            data: { slotId, userId },
          },
          [`counters.${elementId}:slot:${slotId}`]: admin.firestore.FieldValue.increment(1),
          version: admin.firestore.FieldValue.increment(1),
          lastModified: now,
        },
        { merge: true }
      );
    }

    await db.collection("tool_states").doc(userDocId(toolId, deploymentId, userId)).set(
      {
        [`participation.${elementId}:signed_up`]: true,
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionUpserts: {
          [collectionKey]: {
            [entryId]: { id: entryId, createdAt: now, createdBy: userId, data: { slotId, userId } },
          },
        },
        counterDeltas: { [`${elementId}:slot:${slotId}`]: 1 },
      },
      userStateUpdate: {
        participation: { [`${elementId}:signed_up`]: true },
      },
    };
  }

  if (action === "withdraw") {
    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${entryId}`]: admin.firestore.FieldValue.delete(),
        [`counters.${elementId}:slot:${slotId}`]: admin.firestore.FieldValue.increment(-1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    await db.collection("tool_states").doc(userDocId(toolId, deploymentId, userId)).set(
      {
        [`participation.${elementId}:signed_up`]: false,
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionDeletes: { [collectionKey]: [entryId] },
        counterDeltas: { [`${elementId}:slot:${slotId}`]: -1 },
      },
      userStateUpdate: {
        participation: { [`${elementId}:signed_up`]: false },
      },
    };
  }

  throw new Error(`Unknown signup action: ${action}`);
}

// --- Form: submit ---
async function handleFormSubmit(
  toolId: string,
  deploymentId: string,
  elementId: string,
  data: Record<string, unknown>,
  userId: string,
  userState: Record<string, unknown>,
  toolConfig: Record<string, unknown>,
): Promise<ExecuteResult> {
  const allowMultiple = toolConfig?.allowMultipleSubmissions === true;
  const participation = (userState.participation ?? {}) as Record<string, boolean>;

  if (participation[`${elementId}:submitted`] && !allowMultiple) {
    throw new Error("You have already submitted this form");
  }

  const db = dbAdmin;
  const now = new Date().toISOString();
  const entryId = allowMultiple ? `${userId}:${Date.now()}` : userId;
  const collectionKey = `${elementId}:submissions`;

  await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
    {
      [`collections.${collectionKey}.${entryId}`]: {
        id: entryId,
        createdAt: now,
        createdBy: userId,
        data: { ...data, userId },
      },
      [`counters.${elementId}:submissionCount`]: admin.firestore.FieldValue.increment(1),
      version: admin.firestore.FieldValue.increment(1),
      lastModified: now,
    },
    { merge: true }
  );

  await db.collection("tool_states").doc(userDocId(toolId, deploymentId, userId)).set(
    {
      [`participation.${elementId}:submitted`]: true,
      lastModified: now,
    },
    { merge: true }
  );

  return {
    sharedStateUpdate: {
      collectionUpserts: {
        [collectionKey]: {
          [entryId]: { id: entryId, createdAt: now, createdBy: userId, data: { ...data, userId } },
        },
      },
      counterDeltas: { [`${elementId}:submissionCount`]: 1 },
    },
    userStateUpdate: {
      participation: { [`${elementId}:submitted`]: true },
    },
  };
}

// --- Progress Indicator: set_progress / increment_progress / reset_progress ---
async function handleProgressAction(
  toolId: string,
  deploymentId: string,
  elementId: string,
  action: string,
  data: Record<string, unknown>,
  toolConfig: Record<string, unknown>,
): Promise<ExecuteResult> {
  const max = (toolConfig?.max as number) ?? 100;
  const db = dbAdmin;
  const now = new Date().toISOString();

  if (action === "set_progress") {
    const targetValue = Math.max(0, Math.min((data.value as number) ?? 0, max));

    // Atomic read-compute-write inside a transaction
    const sharedRef = db.collection("tool_states").doc(sharedDocId(toolId, deploymentId));
    let delta = 0;
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(sharedRef);
      const docData = doc.data() || {};
      const counters = (docData.counters ?? {}) as Record<string, number>;
      const current = counters[`${elementId}:value`] ?? 0;
      delta = targetValue - current;

      transaction.set(sharedRef, {
        [`counters.${elementId}:value`]: admin.firestore.FieldValue.increment(delta),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      }, { merge: true });
    });

    return {
      sharedStateUpdate: { counterDeltas: { [`${elementId}:value`]: delta } },
    };
  }

  if (action === "increment_progress") {
    const step = (data.step as number) ?? 1;

    // Atomic bounds check + increment inside a transaction
    const sharedRef = db.collection("tool_states").doc(sharedDocId(toolId, deploymentId));
    let effectiveDelta = 0;
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(sharedRef);
      const docData = doc.data() || {};
      const counters = (docData.counters ?? {}) as Record<string, number>;
      const current = counters[`${elementId}:value`] ?? 0;
      effectiveDelta = Math.min(step, max - current);
      if (effectiveDelta <= 0) throw new Error("Progress is already at maximum");

      transaction.set(sharedRef, {
        [`counters.${elementId}:value`]: admin.firestore.FieldValue.increment(effectiveDelta),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      }, { merge: true });
    });

    return {
      sharedStateUpdate: { counterDeltas: { [`${elementId}:value`]: effectiveDelta } },
    };
  }

  if (action === "reset_progress") {
    // Atomic read-compute-write inside a transaction
    const sharedRef = db.collection("tool_states").doc(sharedDocId(toolId, deploymentId));
    let delta = 0;
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(sharedRef);
      const docData = doc.data() || {};
      const counters = (docData.counters ?? {}) as Record<string, number>;
      const current = counters[`${elementId}:value`] ?? 0;
      delta = -current;

      transaction.set(sharedRef, {
        [`counters.${elementId}:value`]: admin.firestore.FieldValue.increment(delta),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      }, { merge: true });
    });

    return {
      sharedStateUpdate: { counterDeltas: { [`${elementId}:value`]: delta } },
    };
  }

  throw new Error(`Unknown progress action: ${action}`);
}

// --- Timer: start / stop / reset / lap ---
async function handleTimerAction(
  toolId: string,
  deploymentId: string,
  elementId: string,
  action: string,
  data: Record<string, unknown>,
  userId: string,
): Promise<ExecuteResult> {
  const db = dbAdmin;
  const now = new Date().toISOString();
  const collectionKey = `${elementId}:laps`;

  if (action === "start") {
    const startedAt = (data.startedAt as string) ?? now;

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`counters.${elementId}:isRunning`]: 1,
        [`collections.${elementId}:meta.startedAt`]: {
          id: "startedAt",
          createdAt: now,
          createdBy: userId,
          data: { startedAt, elapsed: 0 },
        },
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        counterDeltas: { [`${elementId}:isRunning`]: 1 },
        collectionUpserts: {
          [`${elementId}:meta`]: {
            startedAt: {
              id: "startedAt",
              createdAt: now,
              createdBy: userId,
              data: { startedAt, elapsed: 0 },
            },
          },
        },
      },
    };
  }

  if (action === "stop") {
    const elapsed = (data.elapsed as number) ?? 0;

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`counters.${elementId}:isRunning`]: 0,
        [`counters.${elementId}:elapsed`]: elapsed,
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    // Use absolute set for isRunning (not delta) — compute delta from current
    const sharedState = await getSharedState(toolId, deploymentId);
    const counters = (sharedState.counters ?? {}) as Record<string, number>;
    const currentRunning = counters[`${elementId}:isRunning`] ?? 0;
    const currentElapsed = counters[`${elementId}:elapsed`] ?? 0;

    return {
      sharedStateUpdate: {
        counterDeltas: {
          [`${elementId}:isRunning`]: -currentRunning,
          [`${elementId}:elapsed`]: elapsed - currentElapsed,
        },
      },
    };
  }

  if (action === "reset") {
    const sharedState = await getSharedState(toolId, deploymentId);
    const counters = (sharedState.counters ?? {}) as Record<string, number>;
    const currentRunning = counters[`${elementId}:isRunning`] ?? 0;
    const currentElapsed = counters[`${elementId}:elapsed`] ?? 0;

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`counters.${elementId}:isRunning`]: 0,
        [`counters.${elementId}:elapsed`]: 0,
        [`collections.${collectionKey}`]: {},
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        counterDeltas: {
          [`${elementId}:isRunning`]: -currentRunning,
          [`${elementId}:elapsed`]: -currentElapsed,
        },
        collectionDeletes: { [collectionKey]: [] },
      },
    };
  }

  if (action === "lap") {
    const lapTime = (data.lapTime as number) ?? 0;
    const lapNumber = (data.lapNumber as number) ?? 1;
    const entryId = `lap-${lapNumber}`;

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${entryId}`]: {
          id: entryId,
          createdAt: now,
          createdBy: userId,
          data: { lapTime, lapNumber },
        },
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionUpserts: {
          [collectionKey]: {
            [entryId]: {
              id: entryId,
              createdAt: now,
              createdBy: userId,
              data: { lapTime, lapNumber },
            },
          },
        },
      },
    };
  }

  throw new Error(`Unknown timer action: ${action}`);
}

// --- Announcement: create / pin / unpin / delete ---
async function handleAnnouncementAction(
  toolId: string,
  deploymentId: string,
  elementId: string,
  action: string,
  data: Record<string, unknown>,
  userId: string,
  toolCreatorId: string,
): Promise<ExecuteResult> {
  // Permission: only the tool creator can manage announcements
  if (userId !== toolCreatorId) {
    throw new Error("Only the tool creator can manage announcements");
  }

  const db = dbAdmin;
  const now = new Date().toISOString();
  const collectionKey = `${elementId}:announcements`;

  if (action === "create") {
    const content = data.content as string;
    if (!content) throw new Error("content is required for create action");

    const expiresAt = (data.expiresAt as string) ?? null;
    const pinned = (data.pinned as boolean) ?? false;
    const entryId = `${userId}:${Date.now()}`;

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${entryId}`]: {
          id: entryId,
          createdAt: now,
          createdBy: userId,
          data: { content, pinned, expiresAt },
        },
        [`counters.${elementId}:count`]: admin.firestore.FieldValue.increment(1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionUpserts: {
          [collectionKey]: {
            [entryId]: {
              id: entryId,
              createdAt: now,
              createdBy: userId,
              data: { content, pinned, expiresAt },
            },
          },
        },
        counterDeltas: { [`${elementId}:count`]: 1 },
      },
    };
  }

  if (action === "pin") {
    const announcementId = data.announcementId as string;
    if (!announcementId) throw new Error("announcementId is required for pin action");

    // Verify announcement exists
    const sharedState = await getSharedState(toolId, deploymentId);
    const collections = (sharedState.collections ?? {}) as Record<string, Record<string, unknown>>;
    const announcements = collections[collectionKey] ?? {};
    const existing = announcements[announcementId] as { id: string; createdAt: string; createdBy: string; data: Record<string, unknown> } | undefined;
    if (!existing) throw new Error("Announcement not found");

    const updatedData = { ...existing.data, pinned: true };

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${announcementId}`]: {
          ...existing,
          updatedAt: now,
          data: updatedData,
        },
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionUpserts: {
          [collectionKey]: {
            [announcementId]: {
              ...existing,
              updatedAt: now,
              data: updatedData,
            },
          },
        },
      },
    };
  }

  if (action === "unpin") {
    const announcementId = data.announcementId as string;
    if (!announcementId) throw new Error("announcementId is required for unpin action");

    const sharedState = await getSharedState(toolId, deploymentId);
    const collections = (sharedState.collections ?? {}) as Record<string, Record<string, unknown>>;
    const announcements = collections[collectionKey] ?? {};
    const existing = announcements[announcementId] as { id: string; createdAt: string; createdBy: string; data: Record<string, unknown> } | undefined;
    if (!existing) throw new Error("Announcement not found");

    const updatedData = { ...existing.data, pinned: false };

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${announcementId}`]: {
          ...existing,
          updatedAt: now,
          data: updatedData,
        },
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionUpserts: {
          [collectionKey]: {
            [announcementId]: {
              ...existing,
              updatedAt: now,
              data: updatedData,
            },
          },
        },
      },
    };
  }

  if (action === "delete") {
    const announcementId = data.announcementId as string;
    if (!announcementId) throw new Error("announcementId is required for delete action");

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${announcementId}`]: admin.firestore.FieldValue.delete(),
        [`counters.${elementId}:count`]: admin.firestore.FieldValue.increment(-1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionDeletes: { [collectionKey]: [announcementId] },
        counterDeltas: { [`${elementId}:count`]: -1 },
      },
    };
  }

  throw new Error(`Unknown announcement action: ${action}`);
}

// --- Leaderboard: update_score / increment ---
async function handleLeaderboardAction(
  toolId: string,
  deploymentId: string,
  elementId: string,
  action: string,
  data: Record<string, unknown>,
  userId: string,
): Promise<ExecuteResult> {
  const db = dbAdmin;
  const now = new Date().toISOString();
  const collectionKey = `${elementId}:scores`;

  if (action === "update_score" || action === "increment") {
    const score = (data.score as number) ?? 1;
    const displayName = (data.displayName as string) ?? "User";
    const avatar = data.avatar as string | undefined;

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${userId}`]: {
          id: userId,
          createdAt: now,
          createdBy: userId,
          updatedAt: now,
          data: { displayName, score, avatar, userId },
        },
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionUpserts: {
          [collectionKey]: {
            [userId]: {
              id: userId,
              createdAt: now,
              createdBy: userId,
              updatedAt: now,
              data: { displayName, score, avatar, userId },
            },
          },
        },
      },
    };
  }

  if (action === "reset") {
    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}`]: {},
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );
    return { sharedStateUpdate: { collectionDeletes: { [collectionKey]: [userId] } } };
  }

  throw new Error(`Unknown leaderboard action: ${action}`);
}

// --- Listing Board: post_listing, claim_listing, unclaim, mark_done, flag, delete_listing ---
async function handleListingBoardAction(
  toolId: string,
  deploymentId: string,
  elementId: string,
  action: string,
  data: Record<string, unknown>,
  userId: string,
  sharedState: Record<string, unknown>,
  toolConfig: Record<string, unknown>,
): Promise<ExecuteResult> {
  const db = dbAdmin;
  const now = new Date().toISOString();
  const collectionKey = `${elementId}:listings`;

  if (action === "post_listing") {
    const entryId = `${userId}:${Date.now()}`;
    const title = data.title as string;
    if (!title) throw new Error("title is required");

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${entryId}`]: {
          id: entryId,
          createdAt: now,
          createdBy: userId,
          data: { ...data, status: 'open' },
        },
        [`counters.${elementId}:listingCount`]: admin.firestore.FieldValue.increment(1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    await db.collection("tool_states").doc(userDocId(toolId, deploymentId, userId)).set(
      {
        [`participation.${elementId}:has_posted`]: true,
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionUpserts: {
          [collectionKey]: {
            [entryId]: { id: entryId, createdAt: now, createdBy: userId, data: { ...data, status: 'open' } },
          },
        },
        counterDeltas: { [`${elementId}:listingCount`]: 1 },
      },
      userStateUpdate: { participation: { [`${elementId}:has_posted`]: true } },
    };
  }

  if (action === "claim_listing") {
    const listingId = data.listingId as string;
    if (!listingId) throw new Error("listingId is required");

    const claimBehavior = toolConfig?.claimBehavior as string | undefined;

    // Check if already claimed when first-come mode
    if (claimBehavior === 'first-come') {
      const collections = (sharedState.collections ?? {}) as Record<string, Record<string, { data?: Record<string, unknown> }>>;
      const listings = collections[collectionKey] ?? {};
      const listing = listings[listingId];
      if (listing?.data?.claimedBy) throw new Error("This listing has already been claimed");
    }

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${listingId}.data.claimedBy`]: userId,
        [`collections.${collectionKey}.${listingId}.data.claimedAt`]: now,
        [`collections.${collectionKey}.${listingId}.updatedAt`]: now,
        [`counters.${elementId}:claimedCount`]: admin.firestore.FieldValue.increment(1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        counterDeltas: { [`${elementId}:claimedCount`]: 1 },
      },
    };
  }

  if (action === "unclaim") {
    const listingId = data.listingId as string;
    if (!listingId) throw new Error("listingId is required");

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${listingId}.data.claimedBy`]: admin.firestore.FieldValue.delete(),
        [`collections.${collectionKey}.${listingId}.data.claimedAt`]: admin.firestore.FieldValue.delete(),
        [`collections.${collectionKey}.${listingId}.updatedAt`]: now,
        [`counters.${elementId}:claimedCount`]: admin.firestore.FieldValue.increment(-1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        counterDeltas: { [`${elementId}:claimedCount`]: -1 },
      },
    };
  }

  if (action === "mark_done") {
    const listingId = data.listingId as string;
    if (!listingId) throw new Error("listingId is required");

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${listingId}.data.status`]: 'done',
        [`collections.${collectionKey}.${listingId}.updatedAt`]: now,
        [`counters.${elementId}:listingCount`]: admin.firestore.FieldValue.increment(-1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        counterDeltas: { [`${elementId}:listingCount`]: -1 },
      },
    };
  }

  if (action === "flag") {
    const listingId = data.listingId as string;
    if (!listingId) throw new Error("listingId is required");

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${listingId}.data.flagCount`]: admin.firestore.FieldValue.increment(1),
        [`collections.${collectionKey}.${listingId}.updatedAt`]: now,
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return { sharedStateUpdate: {} };
  }

  if (action === "delete_listing") {
    const listingId = data.listingId as string;
    if (!listingId) throw new Error("listingId is required");

    // Verify ownership
    const collections = (sharedState.collections ?? {}) as Record<string, Record<string, { createdBy?: string }>>;
    const listings = collections[collectionKey] ?? {};
    const listing = listings[listingId];
    if (!listing || listing.createdBy !== userId) {
      throw new Error("You can only delete your own listings");
    }

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${listingId}`]: admin.firestore.FieldValue.delete(),
        [`counters.${elementId}:listingCount`]: admin.firestore.FieldValue.increment(-1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionDeletes: { [collectionKey]: [listingId] },
        counterDeltas: { [`${elementId}:listingCount`]: -1 },
      },
    };
  }

  throw new Error(`Unknown listing-board action: ${action}`);
}

// --- Match Maker: submit_preferences, accept_match, reject_match, rematch ---
async function handleMatchMakerAction(
  toolId: string,
  deploymentId: string,
  elementId: string,
  action: string,
  data: Record<string, unknown>,
  userId: string,
): Promise<ExecuteResult> {
  const db = dbAdmin;
  const now = new Date().toISOString();
  const poolKey = `${elementId}:pool`;
  const matchesKey = `${elementId}:matches`;

  if (action === "submit_preferences") {
    const entryId = userId;

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${poolKey}.${entryId}`]: {
          id: entryId,
          createdAt: now,
          createdBy: userId,
          data: { ...data, userId },
        },
        [`counters.${elementId}:poolSize`]: admin.firestore.FieldValue.increment(1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    await db.collection("tool_states").doc(userDocId(toolId, deploymentId, userId)).set(
      {
        [`participation.${elementId}:submitted_preferences`]: true,
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionUpserts: {
          [poolKey]: {
            [entryId]: { id: entryId, createdAt: now, createdBy: userId, data: { ...data, userId } },
          },
        },
        counterDeltas: { [`${elementId}:poolSize`]: 1 },
      },
      userStateUpdate: { participation: { [`${elementId}:submitted_preferences`]: true } },
    };
  }

  if (action === "accept_match") {
    const matchId = data.matchId as string;
    if (!matchId) throw new Error("matchId is required");

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${matchesKey}.${matchId}.data.status`]: 'accepted',
        [`collections.${matchesKey}.${matchId}.updatedAt`]: now,
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    await db.collection("tool_states").doc(userDocId(toolId, deploymentId, userId)).set(
      {
        [`participation.${elementId}:matched`]: true,
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {},
      userStateUpdate: { participation: { [`${elementId}:matched`]: true } },
    };
  }

  if (action === "reject_match") {
    const matchId = data.matchId as string;
    if (!matchId) throw new Error("matchId is required");

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${matchesKey}.${matchId}.data.status`]: 'rejected',
        [`collections.${matchesKey}.${matchId}.updatedAt`]: now,
        // Move user back to pool
        [`collections.${poolKey}.${userId}`]: {
          id: userId,
          createdAt: now,
          createdBy: userId,
          data: { userId, rematched: true },
        },
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    await db.collection("tool_states").doc(userDocId(toolId, deploymentId, userId)).set(
      {
        [`participation.${elementId}:matched`]: false,
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {},
      userStateUpdate: { participation: { [`${elementId}:matched`]: false } },
    };
  }

  if (action === "rematch") {
    // Clear current match and re-add to pool
    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${poolKey}.${userId}`]: {
          id: userId,
          createdAt: now,
          createdBy: userId,
          data: { userId, rematched: true },
        },
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    await db.collection("tool_states").doc(userDocId(toolId, deploymentId, userId)).set(
      {
        [`participation.${elementId}:matched`]: false,
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionUpserts: {
          [poolKey]: {
            [userId]: { id: userId, createdAt: now, createdBy: userId, data: { userId, rematched: true } },
          },
        },
      },
      userStateUpdate: { participation: { [`${elementId}:matched`]: false } },
    };
  }

  throw new Error(`Unknown match-maker action: ${action}`);
}

// --- Workflow Pipeline: submit, approve, reject, request_changes, move_stage ---
async function handleWorkflowAction(
  toolId: string,
  deploymentId: string,
  elementId: string,
  action: string,
  data: Record<string, unknown>,
  userId: string,
  toolConfig: Record<string, unknown>,
): Promise<ExecuteResult> {
  const db = dbAdmin;
  const now = new Date().toISOString();
  const collectionKey = `${elementId}:requests`;

  if (action === "submit") {
    const entryId = `${userId}:${Date.now()}`;
    const stages = (toolConfig?.stages as Array<{ id: string }>) ?? [];
    const firstStageId = stages[0]?.id || 'stage_1';

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${entryId}`]: {
          id: entryId,
          createdAt: now,
          createdBy: userId,
          data: { ...data, stage: firstStageId, status: 'pending', userId },
        },
        [`counters.${elementId}:totalRequests`]: admin.firestore.FieldValue.increment(1),
        [`counters.${elementId}:stage:${firstStageId}`]: admin.firestore.FieldValue.increment(1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionUpserts: {
          [collectionKey]: {
            [entryId]: { id: entryId, createdAt: now, createdBy: userId, data: { ...data, stage: firstStageId, status: 'pending', userId } },
          },
        },
        counterDeltas: {
          [`${elementId}:totalRequests`]: 1,
          [`${elementId}:stage:${firstStageId}`]: 1,
        },
      },
    };
  }

  if (action === "approve") {
    const requestId = data.requestId as string;
    if (!requestId) throw new Error("requestId is required");

    const currentStageId = data.currentStageId as string;
    const nextStageId = data.nextStageId as string;
    if (!currentStageId || !nextStageId) throw new Error("currentStageId and nextStageId are required");

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${requestId}.data.stage`]: nextStageId,
        [`collections.${collectionKey}.${requestId}.data.status`]: 'pending',
        [`collections.${collectionKey}.${requestId}.updatedAt`]: now,
        [`counters.${elementId}:stage:${currentStageId}`]: admin.firestore.FieldValue.increment(-1),
        [`counters.${elementId}:stage:${nextStageId}`]: admin.firestore.FieldValue.increment(1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        counterDeltas: {
          [`${elementId}:stage:${currentStageId}`]: -1,
          [`${elementId}:stage:${nextStageId}`]: 1,
        },
      },
    };
  }

  if (action === "reject") {
    const requestId = data.requestId as string;
    const currentStageId = data.currentStageId as string;
    if (!requestId) throw new Error("requestId is required");
    if (!currentStageId) throw new Error("currentStageId is required");

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${requestId}.data.status`]: 'rejected',
        [`collections.${collectionKey}.${requestId}.updatedAt`]: now,
        [`counters.${elementId}:stage:${currentStageId}`]: admin.firestore.FieldValue.increment(-1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        counterDeltas: { [`${elementId}:stage:${currentStageId}`]: -1 },
      },
    };
  }

  if (action === "request_changes") {
    const requestId = data.requestId as string;
    if (!requestId) throw new Error("requestId is required");

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${requestId}.data.status`]: 'changes_requested',
        [`collections.${collectionKey}.${requestId}.updatedAt`]: now,
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return { sharedStateUpdate: {} };
  }

  if (action === "move_stage") {
    const requestId = data.requestId as string;
    const currentStageId = data.currentStageId as string;
    const targetStageId = data.targetStageId as string;
    if (!requestId || !currentStageId || !targetStageId) {
      throw new Error("requestId, currentStageId, and targetStageId are required");
    }

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${requestId}.data.stage`]: targetStageId,
        [`collections.${collectionKey}.${requestId}.updatedAt`]: now,
        [`counters.${elementId}:stage:${currentStageId}`]: admin.firestore.FieldValue.increment(-1),
        [`counters.${elementId}:stage:${targetStageId}`]: admin.firestore.FieldValue.increment(1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        counterDeltas: {
          [`${elementId}:stage:${currentStageId}`]: -1,
          [`${elementId}:stage:${targetStageId}`]: 1,
        },
      },
    };
  }

  throw new Error(`Unknown workflow action: ${action}`);
}

// --- Data Table: add_row, edit_row, delete_row ---
async function handleDataTableAction(
  toolId: string,
  deploymentId: string,
  elementId: string,
  action: string,
  data: Record<string, unknown>,
  userId: string,
  sharedState: Record<string, unknown>,
): Promise<ExecuteResult> {
  const db = dbAdmin;
  const now = new Date().toISOString();
  const collectionKey = `${elementId}:rows`;

  if (action === "add_row") {
    const entryId = `${userId}:${Date.now()}`;

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${entryId}`]: {
          id: entryId,
          createdAt: now,
          createdBy: userId,
          data: { ...data, userId },
        },
        [`counters.${elementId}:rowCount`]: admin.firestore.FieldValue.increment(1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    await db.collection("tool_states").doc(userDocId(toolId, deploymentId, userId)).set(
      {
        [`participation.${elementId}:has_added_row`]: true,
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionUpserts: {
          [collectionKey]: {
            [entryId]: { id: entryId, createdAt: now, createdBy: userId, data: { ...data, userId } },
          },
        },
        counterDeltas: { [`${elementId}:rowCount`]: 1 },
      },
      userStateUpdate: { participation: { [`${elementId}:has_added_row`]: true } },
    };
  }

  if (action === "edit_row") {
    const rowId = data.rowId as string;
    if (!rowId) throw new Error("rowId is required");

    // Verify ownership or edit permission
    const collections = (sharedState.collections ?? {}) as Record<string, Record<string, { createdBy?: string }>>;
    const rows = collections[collectionKey] ?? {};
    const row = rows[rowId];
    const hasEditPermission = (data.hasEditPermission as boolean) === true;
    if (row && row.createdBy !== userId && !hasEditPermission) {
      throw new Error("You can only edit your own rows");
    }

    const rowData = { ...data };
    delete rowData.rowId;
    delete rowData.hasEditPermission;

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${rowId}.data`]: { ...rowData, userId: row?.createdBy || userId },
        [`collections.${collectionKey}.${rowId}.updatedAt`]: now,
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionUpserts: {
          [collectionKey]: {
            [rowId]: { updatedAt: now, data: { ...rowData, userId: row?.createdBy || userId } },
          },
        },
      },
    };
  }

  if (action === "delete_row") {
    const rowId = data.rowId as string;
    if (!rowId) throw new Error("rowId is required");

    // Verify ownership
    const collections = (sharedState.collections ?? {}) as Record<string, Record<string, { createdBy?: string }>>;
    const rows = collections[collectionKey] ?? {};
    const row = rows[rowId];
    if (row && row.createdBy !== userId) {
      throw new Error("You can only delete your own rows");
    }

    await db.collection("tool_states").doc(sharedDocId(toolId, deploymentId)).set(
      {
        [`collections.${collectionKey}.${rowId}`]: admin.firestore.FieldValue.delete(),
        [`counters.${elementId}:rowCount`]: admin.firestore.FieldValue.increment(-1),
        version: admin.firestore.FieldValue.increment(1),
        lastModified: now,
      },
      { merge: true }
    );

    return {
      sharedStateUpdate: {
        collectionDeletes: { [collectionKey]: [rowId] },
        counterDeltas: { [`${elementId}:rowCount`]: -1 },
      },
    };
  }

  throw new Error(`Unknown data-table action: ${action}`);
}

// ============================================================================
// Types
// ============================================================================

interface ExecuteResult {
  sharedStateUpdate?: {
    counterDeltas?: Record<string, number>;
    collectionUpserts?: Record<string, Record<string, unknown>>;
    collectionDeletes?: Record<string, string[]>;
    timelineAppend?: unknown[];
    computedUpdates?: Record<string, unknown>;
  };
  userStateUpdate?: {
    selections?: Record<string, unknown>;
    participation?: Record<string, boolean>;
  };
}

// ============================================================================
// Route Handler
// ============================================================================

export const POST = withAuthAndErrors(async (
  request,
  _context,
  respond,
) => {
  const userId = getUserId(request as AuthenticatedRequest);

  // Validate body
  const body = await request.json().catch(() => null);
  const parsed = ExecuteActionSchema.safeParse(body);
  if (!parsed.success) {
    return respond.error(
      "Invalid request: " + parsed.error.issues.map((i) => i.message).join(", "),
      "INVALID_INPUT",
      { status: 400 }
    );
  }

  const { toolId, deploymentId, elementId, action, data, spaceId } = parsed.data;
  const effectiveDeploymentId = deploymentId || "standalone";

  const db = dbAdmin;

  // 1. Look up the tool
  const toolDoc = await db.collection("tools").doc(toolId).get();
  if (!toolDoc.exists) {
    return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  const tool = toolDoc.data()!;

  // 2. For space-deployed tools, verify deployment exists
  if (spaceId && effectiveDeploymentId !== "standalone") {
    const deploymentDoc = await db.collection("tool_deployments").doc(effectiveDeploymentId).get();
    if (!deploymentDoc.exists) {
      return respond.error("Tool deployment not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }
  }

  // 3. Find the element in the tool composition
  const composition = tool.config?.composition ?? tool;
  const elements = (composition.elements ?? tool.elements ?? []) as Array<{
    instanceId: string;
    elementId: string;
    config: Record<string, unknown>;
  }>;

  const element = elements.find(
    (el) => el.instanceId === elementId || el.elementId === elementId
  );

  if (!element) {
    return respond.error(`Element ${elementId} not found in tool`, "RESOURCE_NOT_FOUND", { status: 404 });
  }

  const elementType = element.elementId;
  const elementConfig = element.config ?? {};

  // 4. Load current state for actions that need it
  const [sharedState, userState] = await Promise.all([
    getSharedState(toolId, effectiveDeploymentId),
    getUserState(toolId, effectiveDeploymentId, userId),
  ]);

  // 5. Execute action
  let result: ExecuteResult;

  try {
    switch (elementType) {
      // Registry ID: poll-element
      case "poll-element":
      case "poll":
        result = await handlePollVote(
          toolId, effectiveDeploymentId, elementId,
          data as Record<string, unknown>, userId,
          sharedState, userState, elementConfig
        );
        break;

      // Registry ID: counter
      case "counter":
        result = await handleCounterAction(
          toolId, effectiveDeploymentId, elementId,
          action, data as Record<string, unknown>, userId, elementConfig
        );
        break;

      // Registry ID: rsvp-button
      case "rsvp-button":
      case "rsvp_button":
        result = await handleRsvpAction(
          toolId, effectiveDeploymentId, elementId,
          action, data as Record<string, unknown>, userId,
          userState, elementConfig
        );
        break;

      // Registry ID: countdown-timer
      case "countdown-timer":
      case "countdown_timer":
        // Countdown is display-only — no server-side action needed
        result = { sharedStateUpdate: undefined };
        break;

      // Registry ID: checklist-tracker
      case "checklist-tracker":
      case "checklist_tracker":
        result = await handleChecklistToggle(
          toolId, effectiveDeploymentId, elementId,
          data as Record<string, unknown>, userId
        );
        break;

      // Registry ID: signup-sheet
      case "signup-sheet":
      case "signup_sheet":
        result = await handleSignupAction(
          toolId, effectiveDeploymentId, elementId,
          action, data as Record<string, unknown>, userId,
          userState, elementConfig
        );
        break;

      // Registry ID: form-builder
      case "form-builder":
      case "form_builder":
        result = await handleFormSubmit(
          toolId, effectiveDeploymentId, elementId,
          data as Record<string, unknown>, userId,
          userState, elementConfig
        );
        break;

      // Registry ID: leaderboard
      case "leaderboard":
        result = await handleLeaderboardAction(
          toolId, effectiveDeploymentId, elementId,
          action, data as Record<string, unknown>, userId
        );
        break;

      // Registry ID: progress-indicator
      case "progress-indicator":
      case "progress_indicator":
        result = await handleProgressAction(
          toolId, effectiveDeploymentId, elementId,
          action, data as Record<string, unknown>, elementConfig
        );
        break;

      // Registry ID: timer
      case "timer":
        result = await handleTimerAction(
          toolId, effectiveDeploymentId, elementId,
          action, data as Record<string, unknown>, userId
        );
        break;

      // Registry ID: announcement
      case "announcement": {
        const toolCreatorId = (tool.createdBy || tool.ownerId) as string | undefined;
        if (!toolCreatorId) {
          throw new Error("Only the tool creator can manage announcements");
        }
        result = await handleAnnouncementAction(
          toolId, effectiveDeploymentId, elementId,
          action, data as Record<string, unknown>, userId,
          toolCreatorId
        );
        break;
      }

      // Registry ID: listing-board
      case "listing-board":
      case "listing_board":
        result = await handleListingBoardAction(
          toolId, effectiveDeploymentId, elementId,
          action, data as Record<string, unknown>, userId,
          sharedState, elementConfig
        );
        break;

      // Registry ID: match-maker
      case "match-maker":
      case "match_maker":
        result = await handleMatchMakerAction(
          toolId, effectiveDeploymentId, elementId,
          action, data as Record<string, unknown>, userId
        );
        break;

      // Registry ID: workflow-pipeline
      case "workflow-pipeline":
      case "workflow_pipeline":
        result = await handleWorkflowAction(
          toolId, effectiveDeploymentId, elementId,
          action, data as Record<string, unknown>, userId,
          elementConfig
        );
        break;

      // Registry ID: data-table
      case "data-table":
      case "data_table":
        result = await handleDataTableAction(
          toolId, effectiveDeploymentId, elementId,
          action, data as Record<string, unknown>, userId,
          sharedState
        );
        break;

      default:
        // Generic fallback: record action in timeline
        result = {
          sharedStateUpdate: {
            timelineAppend: [{
              elementInstanceId: elementId,
              eventType: action,
              userId,
              timestamp: new Date().toISOString(),
              data,
            }],
          },
        };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Action failed";
    return respond.error(message, "ACTION_FAILED", { status: 400 });
  }

  return respond.success({ result });
});
