import { getStorage } from 'firebase-admin/storage';
import { dbAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { logger } from "@/lib/logger";
import { ApiResponseHelper as _ApiResponseHelper, HttpStatus as _HttpStatus } from "@/lib/api-response-types";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { isTestUserId } from "@/lib/security-service";
import { mlContentAnalyzer } from "@/lib/ml-content-analyzer";

// In-memory store for development mode profile data (shared with profile route)
const devProfileStore: Record<string, unknown> = {};

export const POST = withAuthAndErrors(async (
  request,
  context,
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);

    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return respond.error("No photo file provided", "INVALID_INPUT", { status: 400 });
    }

    // Handle development mode (ONLY in development environment)
    if (isTestUserId(userId)) {
      // In development, simulate successful upload with a unique URL
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
      
      // Store the avatar URL in development profile store
      const existingProfile = (devProfileStore[userId] as Record<string, unknown>) || {};
      devProfileStore[userId] = {
        ...existingProfile,
        avatarUrl,
        profilePhoto: avatarUrl,
      };
      
      logger.info('Development mode: Photo upload simulated for file', { data: file.name, endpoint: '/api/profile/upload-photo' });
      
      return respond.success({
        message: 'Photo uploaded successfully (development mode)',
        avatarUrl
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return respond.error("Invalid file type. Only JPEG, PNG, and WebP are allowed.", "INVALID_INPUT", { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return respond.error("File too large. Maximum size is 5MB.", "INVALID_INPUT", { status: 400 });
    }

    // Read file buffer once (used for both moderation and upload)
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // ML Image Moderation Check
    if (mlContentAnalyzer.isImageModerationAvailable()) {
      try {
        const base64Image = fileBuffer.toString('base64');

        const imageAnalysis = await mlContentAnalyzer.analyzeImage(base64Image, {
          contextType: 'profile_photo',
          strictMode: true, // Profile photos require strict moderation
        });

        logger.info('Profile photo moderation result', {
          userId,
          isViolation: imageAnalysis.isViolation,
          suggestedAction: imageAnalysis.suggestedAction,
          confidence: imageAnalysis.confidence,
          processingTime: imageAnalysis.processingTime,
          endpoint: '/api/profile/upload-photo',
        });

        if (imageAnalysis.suggestedAction === 'block') {
          return respond.error(
            "This image cannot be used as a profile photo. Please choose a different image.",
            "CONTENT_POLICY_VIOLATION",
            { status: 400 }
          );
        }

        if (imageAnalysis.suggestedAction === 'flag') {
          // Log for moderator review but allow with warning
          logger.warn('Profile photo flagged for review', {
            userId,
            flags: imageAnalysis.flags,
            scores: imageAnalysis.scores,
            reasoning: imageAnalysis.reasoning,
          });
        }
      } catch (error) {
        // Don't block upload if moderation fails - log and continue
        logger.warn('Image moderation check failed, proceeding with upload', {
          userId,
          error: error instanceof Error ? error.message : String(error),
          endpoint: '/api/profile/upload-photo',
        });
      }
    }

    // Upload to Firebase Storage (Admin SDK)
    const storage = getStorage();
    const bucket = storage.bucket();
    const fileName = `profile-photos/${userId}/${Date.now()}-${file.name}`;
    
    // Upload file to Firebase Storage
    const fileRef = bucket.file(fileName);
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();

    // Get download URL
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Update user document with new avatar URL
    const userRef = dbAdmin.collection('users').doc(userId);
    const currentUserDoc = await userRef.get();
    const currentCampus = (currentUserDoc.exists ? currentUserDoc.data()?.campusId : null) || CURRENT_CAMPUS_ID;
    await userRef.update({
      avatarUrl: downloadURL,
      profilePhoto: downloadURL, // For compatibility
      campusId: currentCampus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return respond.success({
      avatarUrl: downloadURL,
      message: 'Profile photo updated successfully'
    });

});
