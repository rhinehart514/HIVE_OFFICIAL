import { dbAdmin } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { logger } from "@/lib/structured-logger";
import { withCache } from '../../../lib/cache-headers';

// Local response type aligned with our Firestore shape
type SchoolSummary = {
  id: string;
  name: string;
  domain: string;
  status?: string;
  waitlistCount?: number;
};

async function _GET() {
  try {
    // PRODUCTION: Always use Firebase database
    const schoolsSnapshot = await dbAdmin.collection("schools").get();
    const schools = schoolsSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as SchoolSummary)
    );
    
    // Ensure UB is always present and active (it's our launch school)
    const hasUB = schools.some(s => s.id === 'ub-buffalo');
    if (!hasUB) {
      schools.unshift({
        id: 'ub-buffalo',
        name: 'University at Buffalo',
        domain: 'buffalo.edu',
        status: 'active',
      });
    }
    
    return NextResponse.json(schools);
  } catch (error) {
    logger.error(
      `Firebase connection failed at /api/schools`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    
    // Fallback: return UB as the launch school
    const fallbackSchools: SchoolSummary[] = [
      {
        id: 'ub-buffalo',
        name: 'University at Buffalo',
        domain: 'buffalo.edu',
        status: 'active',
      },
    ];

    return NextResponse.json(fallbackSchools);
  }
}

export const GET = withCache(_GET, 'SHORT');
