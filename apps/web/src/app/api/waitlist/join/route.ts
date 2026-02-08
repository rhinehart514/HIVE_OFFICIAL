import { NextResponse } from "next/server";
import { z } from 'zod';
import { joinWaitlist } from "@/lib/join-waitlist";
import { ApiResponseHelper as _ApiResponseHelper, HttpStatus, ErrorCodes as _ErrorCodes } from "@/lib/api-response-types";

// Zod schema for waitlist join
const WaitlistJoinSchema = z.object({
  email: z.string().email('Valid email is required'),
  schoolId: z.string().min(1, 'School ID is required'),
});

export async function POST(req: Request) {
  try {
    const { email, schoolId } = WaitlistJoinSchema.parse(await req.json());
    await joinWaitlist(email, schoolId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Invalid input' }, { status: HttpStatus.BAD_REQUEST });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
     if (errorMessage === "Email and school ID are required.") {
      return NextResponse.json({ error: errorMessage }, { status: HttpStatus.BAD_REQUEST });
    }
    if (errorMessage === "School not found.") {
      return NextResponse.json({ error: errorMessage }, { status: HttpStatus.NOT_FOUND });
    }
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
} 