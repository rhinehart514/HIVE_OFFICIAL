/**
 * Element Validation API
 *
 * POST /api/elements/validate - Validate element configuration before save
 *
 * Request body:
 * - elementId: string - The element type ID
 * - config: Record<string, unknown> - The configuration to validate
 *
 * Response:
 * - valid: boolean
 * - errors?: Array<{ path: string; message: string }>
 * - normalized?: Record<string, unknown> - Config with defaults applied
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getElementById,
  getRequiredFields,
  validateHiveLabElementConfig,
} from '@hive/core';

// ============================================================================
// Request Schema
// ============================================================================

const ValidateRequestSchema = z.object({
  elementId: z.string().min(1, 'Element ID is required'),
  config: z.record(z.unknown()),
});

// ============================================================================
// Response Helpers
// ============================================================================

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// ============================================================================
// Validation Error Formatting
// ============================================================================

interface ValidationErrorDTO {
  path: string;
  message: string;
  code: string;
}

function formatZodErrors(zodError: z.ZodError): ValidationErrorDTO[] {
  return zodError.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

// ============================================================================
// POST /api/elements/validate
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const parseResult = ValidateRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return jsonResponse(
        {
          valid: false,
          errors: formatZodErrors(parseResult.error),
        },
        400,
      );
    }

    const { elementId, config } = parseResult.data;

    // Check element exists
    const element = getElementById(elementId);
    if (!element) {
      return jsonResponse(
        {
          valid: false,
          errors: [
            {
              path: 'elementId',
              message: `Unknown element type: ${elementId}`,
              code: 'unknown_element',
            },
          ],
        },
        400,
      );
    }

    // Get required fields
    const requiredFields = getRequiredFields(elementId);

    // Check for missing required fields
    const missingRequired = requiredFields.filter(field => {
      const value = config[field];
      return value === undefined || value === null || value === '';
    });

    if (missingRequired.length > 0) {
      return jsonResponse({
        valid: false,
        errors: missingRequired.map(field => ({
          path: field,
          message: `${field} is required for ${element.name}`,
          code: 'required',
        })),
      });
    }

    // Validate config against schema
    const validationResult = validateHiveLabElementConfig(elementId, config);

    if (!validationResult.success) {
      return jsonResponse({
        valid: false,
        errors: formatZodErrors(validationResult.errors),
      });
    }

    // Return success with normalized config (defaults applied)
    return jsonResponse({
      valid: true,
      normalized: validationResult.data,
      element: {
        id: element.id,
        name: element.name,
        category: element.category,
      },
    });
  } catch (error) {
    console.error('Error validating element config:', error);
    return errorResponse('Failed to validate element configuration', 500);
  }
}
