import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppBreadcrumb, AppSurface, Skeleton } from "@hive/ui";

interface AppPageProps {
  params: Promise<{
    spaceId: string;
    deploymentId: string;
  }>;
}

async function fetchAppDeployment(spaceId: string, deploymentId: string) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return { ok: false as const, status: 401, error: "Not authenticated" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = await fetch(
    `${baseUrl}/api/spaces/${spaceId}/apps/${deploymentId}`,
    {
      headers: {
        Cookie: `session=${sessionCookie}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    return {
      ok: false as const,
      status: response.status,
      error: data.error || "Failed to load app",
    };
  }

  const data = await response.json();
  return { ok: true as const, data: data.data };
}

export default async function AppPage({ params }: AppPageProps) {
  const { spaceId, deploymentId } = await params;

  const result = await fetchAppDeployment(spaceId, deploymentId);

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/enter?redirect=/spaces/${spaceId}/apps/${deploymentId}`);
    }
    if (result.status === 404) {
      notFound();
    }
    // For 403 or other errors, show access denied within space context
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <h2 className="text-xl font-medium text-white/90">Access Denied</h2>
            <p className="text-white/60 mt-2">{result.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { deployment, tool, space, grantedCapabilities } = result.data;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Breadcrumb with return to chat */}
      <AppBreadcrumb
        spaceName={space.name}
        spaceId={spaceId}
        appName={deployment.appConfig?.breadcrumbLabel || tool.name}
      />

      {/* App Surface */}
      <Suspense fallback={<AppSurfaceSkeleton />}>
        <AppSurface
          deployment={deployment}
          tool={tool}
          capabilities={grantedCapabilities}
          layout={deployment.appConfig?.layout || "full"}
        />
      </Suspense>
    </div>
  );
}

function AppSurfaceSkeleton() {
  return (
    <div className="flex-1 p-4">
      <Skeleton className="w-full h-full rounded-lg bg-[#141414]" />
    </div>
  );
}

export async function generateMetadata({ params }: AppPageProps) {
  const { spaceId, deploymentId } = await params;
  const result = await fetchAppDeployment(spaceId, deploymentId);

  if (!result.ok) {
    return {
      title: "App Not Found - HIVE",
    };
  }

  return {
    title: `${result.data.tool.name} - ${result.data.space.name} - HIVE`,
    description: result.data.tool.description,
  };
}
