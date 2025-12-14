import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Event Reminder Scheduler
 *
 * Runs every 5 minutes to check for upcoming events and trigger
 * event_reminder automations for the associated spaces.
 *
 * Flow:
 * 1. Find events starting in the next hour
 * 2. For each event, find automations with event_reminder trigger
 * 3. Check if beforeMinutes matches (30, 15, 5, etc.)
 * 4. Execute the automation action (send message to space chat)
 * 5. Track sent reminders to avoid duplicates
 *
 * @author HIVE Platform Team
 * @version 1.0.0
 */

interface EventDoc {
  id: string;
  spaceId?: string;
  title: string;
  startDate: admin.firestore.Timestamp;
  campusId: string;
}

interface AutomationDoc {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    type: string;
    config?: {
      beforeMinutes?: number;
    };
  };
  action: {
    type: string;
    config: {
      content?: string;
      boardId?: string;
    };
  };
}

interface SentReminder {
  automationId: string;
  eventId: string;
  sentAt: admin.firestore.Timestamp;
}

/**
 * Check if a reminder should be sent based on beforeMinutes and event start time
 */
function shouldSendReminder(
  eventStartTime: admin.firestore.Timestamp,
  beforeMinutes: number,
  now: Date
): boolean {
  const eventStart = eventStartTime.toDate();
  const targetTime = new Date(eventStart.getTime() - beforeMinutes * 60 * 1000);

  // Check if we're within a 5-minute window of the target time
  const diffMs = now.getTime() - targetTime.getTime();
  return diffMs >= 0 && diffMs < 5 * 60 * 1000; // Within 5 minutes past target
}

/**
 * Interpolate variables in message content
 */
function interpolateContent(
  content: string,
  eventTitle: string,
  beforeMinutes: number
): string {
  return content
    .replace(/\{event\}/g, eventTitle)
    .replace(/\{event\.title\}/g, eventTitle)
    .replace(/\{trigger\.beforeMinutes\}/g, String(beforeMinutes));
}

/**
 * Send a message to a space chat board
 */
async function sendMessageToBoard(
  firestore: admin.firestore.Firestore,
  spaceId: string,
  boardId: string,
  content: string,
  automationName: string,
  campusId: string
): Promise<string> {
  // Find the target board (default to "General" if boardId is "general")
  let targetBoardId = boardId;

  if (boardId === "general" || !boardId) {
    // Find the General board
    const boardsSnapshot = await firestore
      .collection("spaces")
      .doc(spaceId)
      .collection("boards")
      .where("name", "==", "General")
      .limit(1)
      .get();

    if (!boardsSnapshot.empty) {
      targetBoardId = boardsSnapshot.docs[0].id;
    } else {
      // Create a General board if it doesn't exist
      const newBoardRef = firestore
        .collection("spaces")
        .doc(spaceId)
        .collection("boards")
        .doc();

      await newBoardRef.set({
        id: newBoardRef.id,
        spaceId,
        name: "General",
        type: "chat",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isLocked: false,
        campusId,
      });

      targetBoardId = newBoardRef.id;
    }
  }

  // Create the message
  const messageRef = firestore
    .collection("spaces")
    .doc(spaceId)
    .collection("boards")
    .doc(targetBoardId)
    .collection("messages")
    .doc();

  await messageRef.set({
    id: messageRef.id,
    boardId: targetBoardId,
    spaceId,
    campusId,
    content,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    // Mark as system message from automation
    isSystem: true,
    metadata: {
      isAutomation: true,
      automationType: "event_reminder",
      automationName,
    },
    // No author (system message) or use a bot ID
    authorId: "system",
    authorName: "HIVE Bot",
    reactions: {},
    editHistory: [],
  });

  return messageRef.id;
}

/**
 * Main scheduler function - runs every 5 minutes
 */
export const eventReminders = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async (context) => {
    const firestore = admin.firestore();
    const now = new Date();
    const nowTimestamp = admin.firestore.Timestamp.now();

    // Look for events starting in the next 60 minutes
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    try {
      // Find upcoming events that have a spaceId (space-linked events)
      const eventsSnapshot = await firestore
        .collection("events")
        .where("spaceId", "!=", null)
        .where("startDate", ">=", nowTimestamp)
        .where("startDate", "<=", admin.firestore.Timestamp.fromDate(oneHourFromNow))
        .get();

      if (eventsSnapshot.empty) {
        functions.logger.info("No upcoming events in the next hour");
        return null;
      }

      functions.logger.info(`Found ${eventsSnapshot.size} upcoming events`);

      let remindersSent = 0;

      for (const eventDoc of eventsSnapshot.docs) {
        const event = eventDoc.data() as EventDoc;
        const eventId = eventDoc.id;
        const spaceId = event.spaceId;

        if (!spaceId) continue;

        // Find automations for this space with event_reminder trigger
        const automationsSnapshot = await firestore
          .collection("spaces")
          .doc(spaceId)
          .collection("automations")
          .where("trigger.type", "==", "event_reminder")
          .where("enabled", "==", true)
          .get();

        if (automationsSnapshot.empty) continue;

        for (const automationDoc of automationsSnapshot.docs) {
          const automation = automationDoc.data() as AutomationDoc;
          const automationId = automationDoc.id;
          const beforeMinutes = automation.trigger.config?.beforeMinutes || 30;

          // Check if this reminder should be sent now
          if (!shouldSendReminder(event.startDate, beforeMinutes, now)) {
            continue;
          }

          // Check if we already sent this reminder
          const reminderKey = `${automationId}_${eventId}_${beforeMinutes}`;
          const sentReminderDoc = await firestore
            .collection("sentReminders")
            .doc(reminderKey)
            .get();

          if (sentReminderDoc.exists) {
            functions.logger.info(`Reminder already sent: ${reminderKey}`);
            continue;
          }

          // Execute the automation action
          if (automation.action.type === "send_message") {
            const content = interpolateContent(
              automation.action.config.content || `🔔 Reminder: ${event.title} is starting soon!`,
              event.title,
              beforeMinutes
            );

            const boardId = automation.action.config.boardId || "general";

            try {
              const messageId = await sendMessageToBoard(
                firestore,
                spaceId,
                boardId,
                content,
                automation.name,
                event.campusId
              );

              // Record that we sent this reminder
              await firestore.collection("sentReminders").doc(reminderKey).set({
                automationId,
                eventId,
                beforeMinutes,
                spaceId,
                messageId,
                sentAt: nowTimestamp,
              });

              // Update automation stats
              await automationDoc.ref.update({
                "stats.timesTriggered": admin.firestore.FieldValue.increment(1),
                "stats.successCount": admin.firestore.FieldValue.increment(1),
                "stats.lastTriggered": nowTimestamp,
              });

              remindersSent++;

              functions.logger.info(`Sent reminder for event ${event.title}`, {
                eventId,
                spaceId,
                automationId,
                beforeMinutes,
                messageId,
              });
            } catch (error) {
              functions.logger.error(`Failed to send reminder for event ${eventId}`, error);

              // Update automation failure stats
              await automationDoc.ref.update({
                "stats.timesTriggered": admin.firestore.FieldValue.increment(1),
                "stats.failureCount": admin.firestore.FieldValue.increment(1),
                "stats.lastTriggered": nowTimestamp,
              });
            }
          }
        }
      }

      functions.logger.info(`Event reminders complete: ${remindersSent} reminders sent`);
      return null;
    } catch (error) {
      functions.logger.error("Error in eventReminders scheduler:", error);
      throw error;
    }
  });

/**
 * Cleanup old sent reminders (runs weekly)
 * Removes reminder records older than 7 days to prevent collection bloat
 */
export const cleanupSentReminders = functions.pubsub
  .schedule("every monday 03:00")
  .timeZone("America/New_York")
  .onRun(async (context) => {
    const firestore = admin.firestore();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    try {
      const oldRemindersSnapshot = await firestore
        .collection("sentReminders")
        .where("sentAt", "<", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
        .limit(500) // Process in batches
        .get();

      if (oldRemindersSnapshot.empty) {
        functions.logger.info("No old reminders to clean up");
        return null;
      }

      const batch = firestore.batch();
      oldRemindersSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      functions.logger.info(`Cleaned up ${oldRemindersSnapshot.size} old reminder records`);
      return null;
    } catch (error) {
      functions.logger.error("Error cleaning up sent reminders:", error);
      throw error;
    }
  });
