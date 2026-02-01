import { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin-auth";
import { ClaimsQueue } from "@/components/claims-queue";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Leader Claims | HIVE Admin",
  description: "Review and process leader space claims.",
};

export default async function SpaceClaimsPage() {
  const admin = await verifyAdminSession();

  if (!admin) {
    redirect("/auth/login");
  }

  return <ClaimsQueue />;
}
