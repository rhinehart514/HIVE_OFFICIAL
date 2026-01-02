'use client'

import { useEffect, useState } from 'react'
import { HiveCard as Card, CardContent, CardHeader, CardTitle } from '@hive/ui'
import { Users, TrendingUp, AlertTriangle, Wrench, Loader2 } from 'lucide-react'

interface AdminMetrics {
  totalUsers: number
  conversionRate: number
  onboardingDropOff: number
  activeBuilders: number
  flaggedContent: number
  lastUpdated: string
}

export const MetricCards = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/analytics/comprehensive?timeRange=30d', {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch metrics')
        }

        const data = await response.json()
        const platformMetrics = data.data?.platformMetrics || {}

        // Calculate conversion rate from onboarding completion
        const totalUsers = platformMetrics.totalUsers || 0
        const completedOnboarding = platformMetrics.activeUsers || 0
        const conversionRate = totalUsers > 0
          ? Math.round((completedOnboarding / totalUsers) * 1000) / 10
          : 0

        setMetrics({
          totalUsers: platformMetrics.totalUsers || 0,
          conversionRate,
          onboardingDropOff: 100 - conversionRate,
          activeBuilders: platformMetrics.activeTools || 0,
          flaggedContent: data.data?.violationAnalytics?.pendingViolations || 0,
          lastUpdated: new Date().toISOString(),
        })
      } catch (err) {
        console.error('Failed to fetch admin metrics:', err)
        setError('Failed to load metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="pt-6">
          <p className="text-sm text-red-400">{error || 'Failed to load metrics'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Last Updated */}
      <div className="text-right">
        <p className="text-xs text-gray-500">
          Last updated: {formatLastUpdated(metrics.lastUpdated)}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics.conversionRate}%
            </div>
            <p className="text-xs text-gray-500">
              Onboarding completion
            </p>
          </CardContent>
        </Card>

        {/* Drop-off Rate */}
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Drop-off Rate
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics.onboardingDropOff}%
            </div>
            <p className="text-xs text-gray-500">
              Onboarding abandonment
            </p>
          </CardContent>
        </Card>

        {/* Active Builders */}
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Active Tools
            </CardTitle>
            <Wrench className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics.activeBuilders}
            </div>
            <p className="text-xs text-gray-500">
              Deployed HiveLab tools
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Banner for Flagged Content */}
      {metrics.flaggedContent > 0 && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-400">
                  {metrics.flaggedContent} items require moderation
                </p>
                <p className="text-xs text-red-300/70">
                  Check the Content Flags section below
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 