"use server";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase-admin";
import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from "@/lib/middleware";
import { z } from "zod";

// ============================================================================
// Constants
// ============================================================================

const MAX_PROFILE_TOOLS = 20;

// ============================================================================
// Validation Schemas
// ============================================================================

const UpdateToolSchema = z.object({
  toolId: z.string(),
  visibility: z.enum(["public", "campus", "connections", "private"]).optional(),
  privacyInherit: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const ReorderToolsSchema = z.object({
  toolIds: z.array(z.string()),
});

// ============================================================================
// GET /api/profile/tools
// ============================================================================
// Returns tools deployed to the authenticated user's profile

async function handleGet(request: AuthenticatedRequest): Promise<NextResponse> {
  const userId = getUserId(request);

  // Fetch placed tools
  const placedToolsSnap = await dbAdmin
    .collection("users")
    .doc(userId)
    .collection("placed_tools")
    .orderBy("order", "asc")
    .get();

  const tools = placedToolsSnap.docs.map((doc, index) => {
    const data = doc.data();
    return {
      id: doc.id,
      toolId: data.toolId,
      name: data.name || "Untitled Tool",
      description: data.description || "",
      icon: data.icon || "Wrench",
      deploymentId: doc.id,
      isActive: data.isActive ?? true,
      config: data.config || {},
      visibility: data.visibility || "public",
      privacyInherit: data.privacyInherit ?? true,
      order: data.order ?? index,
      placedAt: data.placedAt?.toDate?.()?.toISOString() || null,
    };
  });

  return NextResponse.json({
    success: true,
    tools,
    count: tools.length,
    maxTools: MAX_PROFILE_TOOLS,
  });
}

export const GET = withAuthAndErrors(handleGet);

// ============================================================================
// PATCH /api/profile/tools
// ============================================================================
// Update a tool's settings (visibility, order, active state)

async function handlePatch(request: AuthenticatedRequest): Promise<NextResponse> {
  const userId = getUserId(request);
  const body = await request.json();

  // Handle reorder operation
  if (body.operation === "reorder") {
    const parseResult = ReorderToolsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid reorder data" },
        { status: 400 }
      );
    }

    const { toolIds } = parseResult.data;
    const batch = dbAdmin.batch();

    toolIds.forEach((toolId, index) => {
      const docRef = dbAdmin
        .collection("users")
        .doc(userId)
        .collection("placed_tools")
        .doc(toolId);
      batch.update(docRef, { order: index, updatedAt: FieldValue.serverTimestamp() });
    });

    await batch.commit();

    return NextResponse.json({ success: true, reordered: toolIds.length });
  }

  // Handle single tool update
  const parseResult = UpdateToolSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: "Invalid update data" },
      { status: 400 }
    );
  }

  const { toolId, ...updates } = parseResult.data;

  // Verify tool exists and belongs to user
  const toolRef = dbAdmin
    .collection("users")
    .doc(userId)
    .collection("placed_tools")
    .doc(toolId);

  const toolSnap = await toolRef.get();
  if (!toolSnap.exists) {
    return NextResponse.json(
      { success: false, error: "Tool not found" },
      { status: 404 }
    );
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (updates.visibility !== undefined) {
    updateData.visibility = updates.visibility;
  }
  if (updates.privacyInherit !== undefined) {
    updateData.privacyInherit = updates.privacyInherit;
  }
  if (updates.order !== undefined) {
    updateData.order = updates.order;
  }
  if (updates.isActive !== undefined) {
    updateData.isActive = updates.isActive;
  }

  await toolRef.update(updateData);

  return NextResponse.json({
    success: true,
    toolId,
    updated: Object.keys(updates),
  });
}

export const PATCH = withAuthAndErrors(handlePatch);

// ============================================================================
// DELETE /api/profile/tools
// ============================================================================
// Remove a tool from the user's profile

async function handleDelete(request: AuthenticatedRequest): Promise<NextResponse> {
  const userId = getUserId(request);
  const { searchParams } = new URL(request.url);
  const toolId = searchParams.get("toolId");

  if (!toolId) {
    return NextResponse.json(
      { success: false, error: "toolId is required" },
      { status: 400 }
    );
  }

  // Verify tool exists and belongs to user
  const toolRef = dbAdmin
    .collection("users")
    .doc(userId)
    .collection("placed_tools")
    .doc(toolId);

  const toolSnap = await toolRef.get();
  if (!toolSnap.exists) {
    return NextResponse.json(
      { success: false, error: "Tool not found" },
      { status: 404 }
    );
  }

  // Delete the tool placement
  await toolRef.delete();

  return NextResponse.json({ success: true, deleted: toolId });
}

export const DELETE = withAuthAndErrors(handleDelete);
