import { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin-auth";
import { EnhancedSpaceControlDashboard } from "../../components/enhanced-space-control-dashboard";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Space Control Center | HIVE Admin",
  description: "Complete administrative control over all campus spaces - activation, management, analytics, and bulk operations.",
};

export default async function SpacesAdminPage() {
  const admin = await verifyAdminSession();

  if (!admin) {
    redirect("/auth/login");
  }

  return <EnhancedSpaceControlDashboard />;
}