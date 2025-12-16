import { z } from "zod";
import { checkHandleAvailability } from "@/lib/handle-service";
import { createCrudHandler, type ApiContext } from "@/lib/api-wrapper";
import { ApiResponseHelper as _ApiResponseHelper, HttpStatus as _HttpStatus, ErrorCodes as _ErrorCodes } from "@/lib/api-response-types";
import { SecureSchemas } from "@/lib/secure-input-validation";

// Validation schemas using SecureSchemas for security validation
const checkHandleBodySchema = z.object({
  handle: SecureSchemas.handle
});

const checkHandleQuerySchema = z.object({
  handle: SecureSchemas.handle
});

interface CheckHandleResponse {
  available: boolean;
  reason?: string;
  handle?: string;
}

// Modern API handler using the new wrapper
const handler = createCrudHandler({
  // Handle POST requests with body validation
  post: async (context: ApiContext) => {
    const { handle } = checkHandleBodySchema.parse(context.body);

    // Use centralized handle validation service
    const result = await checkHandleAvailability(handle);

    const response: CheckHandleResponse = {
      available: result.isAvailable,
      reason: result.error,
      handle: result.normalizedHandle,
    };

    return response;
  },

  // Handle GET requests with query validation
  get: async (context: ApiContext) => {
    const { handle } = checkHandleQuerySchema.parse(context.query);

    // Use centralized handle validation service
    const result = await checkHandleAvailability(handle);

    const response: CheckHandleResponse = {
      available: result.isAvailable,
      reason: result.error,
      handle: result.normalizedHandle,
    };

    return response;
  }
}, {
  // Configuration
  public: true, // No authentication required for handle checking
  rateLimit: 'authStrict', // Strict rate limiting to prevent handle enumeration (10/min)
  validation: {
    body: checkHandleBodySchema,
    query: checkHandleQuerySchema
  }
});

export const GET = handler;
export const POST = handler;
