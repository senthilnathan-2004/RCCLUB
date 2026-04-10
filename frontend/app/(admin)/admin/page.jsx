"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IndianRupee, TrendingUp, Users, Clock, CheckCircle, ArrowRight, BarChart3, Receipt } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import api from "@/lib/api"
import { getSocket } from "@/lib/socket"

// Mock data
const mockDashboardData = {
  totalSpending: 125000,
  totalContributions: 150000,
  pendingReimbursements: 15000,
  totalMembers: 52,
  activeEvents: 8,
  pendingExpenses: 12,
  rotaractYear: "2025-2026",
  monthlySpending: [
    { month: "Aug", amount: 12000 },
    { month: "Sep", amount: 18000 },
    { month: "Oct", amount: 25000 },
    { month: "Nov", amount: 15000 },
    { month: "Dec", amount: 30000 },
    { month: "Jan", amount: 25000 },
  ],
  categoryBreakdown: [
    { name: "Event Material", value: 35000 },
    { name: "Travel", value: 25000 },
    { name: "Food & Refreshments", value: 20000 },
    { name: "Donations", value: 30000 },
    { name: "Miscellaneous", value: 15000 },
  ],
  topContributors: [
    { name: "Rtr. Aditya Kumar", amount: 12500 },
    { name: "Rtr. Sneha Reddy", amount: 10000 },
    { name: "Rtr. Rahul Mehta", amount: 8500 },
    { name: "Rtr. Priya Nair", amount: 7500 },
    { name: "Rtr. Karthik Iyer", amount: 6000 },
  ],
  recentExpenses: [
    { id: 1, member: "Rtr. Aditya Kumar", event: "Blood Donation Camp", amount: 2500, status: "pending" },
    { id: 2, member: "Rtr. Sneha Reddy", event: "Leadership Workshop", amount: 1500, status: "pending" },
    { id: 3, member: "Rtr. Rahul Mehta", event: "Tree Plantation", amount: 3000, status: "approved" },
  ],
}

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"]

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null)
      const response = await api.getAdminDashboard()
      setDashboardData(response.data)
    } catch (err) {
      console.error("Error fetching admin dashboard:", err)
      setError("Failed to load admin dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // Real-time updates for admin dashboard
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    // Any dashboard_update should trigger refresh for admins
    const handleDashboardUpdate = () => {
      fetchDashboard()
    }

    socket.on("dashboard_update", handleDashboardUpdate)

    return () => {
      socket.off("dashboard_update", handleDashboardUpdate)
    }
  }, [fetchDashboard])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-sm text-red-500">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchDashboard}>
          Retry
        </Button>
      </div>
    )
  }

  const data = dashboardData || mockDashboardData
  const isBackendDashboard = !!data?.summary

  const summary = isBackendDashboard
    ? data.summary || {}
    : {
        totalSpending: data.totalSpending,
        totalContributions: data.totalContributions,
        pendingReimbursements: data.pendingReimbursements,
        pendingCount: data.pendingExpenses,
        totalMembers: data.totalMembers,
        totalEvents: data.activeEvents,
      }

  // Safeguard against missing arrays from API to prevent runtime errors
  const monthlySpending = isBackendDashboard
    ? (Array.isArray(data.monthlyExpenses)
        ? data.monthlyExpenses.map((m) => {
            const monthIndex = m._id ?? 1
            const date = new Date(2000, monthIndex - 1, 1)
            return {
              month: date.toLocaleString("en-US", { month: "short" }),
              amount: m.total || 0,
            }
          })
        : [])
    : Array.isArray(data?.monthlySpending)
      ? data.monthlySpending
      : []

  // Category breakdown from backend (expensesByCategory) or fallback to mock data
  const backendCategory = Array.isArray(data?.expensesByCategory) ? data.expensesByCategory : []

  const mapCategoryLabel = (category) => {
    const labels = {
      donation: "Donations",
      personal_contribution: "Personal Contribution",
      travel_expense: "Travel",
      accommodation: "Accommodation",
      event_material: "Event Material",
      food_refreshments: "Food & Refreshments",
      miscellaneous: "Miscellaneous",
    }
    return labels[category] || (category ? category.replace(/_/g, " ") : "Unknown")
  }

  const categoryBreakdown = isBackendDashboard
    ? backendCategory.map((item) => ({
        name: mapCategoryLabel(item._id),
        value: typeof item.total === "number" ? item.total : 0,
      }))
    : Array.isArray(data?.categoryBreakdown)
      ? data.categoryBreakdown
      : []

  const rawTopContributors = Array.isArray(data?.topContributors) ? data.topContributors : []
  const topContributors = rawTopContributors.map((contributor) => {
    if (!isBackendDashboard) return contributor
    const amount = typeof contributor.totalContribution === "number" ? contributor.totalContribution : 0
    const name =
      `${contributor.member?.firstName || ""} ${contributor.member?.lastName || ""}`.trim() ||
      contributor.member?.memberId ||
      "Member"
    return { name, amount }
  })

  const rawRecentExpenses = Array.isArray(data?.recentExpenses) ? data.recentExpenses : []
  const recentExpenses = rawRecentExpenses.map((expense) => {
    if (!isBackendDashboard) return expense
    return {
      id: expense._id || expense.id,
      member:
        `${expense.member?.firstName || ""} ${expense.member?.lastName || ""}`.trim() ||
        expense.member?.fullName ||
        "Member",
      event: expense.event?.name || expense.event || "",
      amount: expense.amount || 0,
      status: expense.status,
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Rotaract Year {data.rotaractYear || new Date().getFullYear()} | Welcome, {user?.firstName}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/admin/reports">
              <BarChart3 className="mr-2 h-4 w-4" /> Reports
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/expenses">
              <Receipt className="mr-2 h-4 w-4" /> Manage Expenses
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spending</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <IndianRupee className="h-5 w-5" />
              {summary.totalSpending?.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This year</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contributions</CardTitle>
            <IndianRupee className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center text-success">
              <IndianRupee className="h-5 w-5" />
              {summary.totalContributions?.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From members</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reimbursements</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center text-warning">
              <IndianRupee className="h-5 w-5" />
              {summary.pendingReimbursements?.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{data.pendingExpenses} entries pending</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary.totalEvents} active events</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch">
        {/* Monthly Spending Chart */}
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader>
            <CardTitle>Monthly Spending</CardTitle>
            <CardDescription className="text-white">Club expenditure over the past 6 months</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <ChartContainer
              config={{
                amount: {
                  label: "Amount",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[250px] w-full min-w-0"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySpending}>
                  <XAxis
                    dataKey="month"
                    stroke="#ffffff"
                    fontSize={12}
                    tick={{ fill: "#ffffff" }}
                  />
                  <YAxis
                    stroke="#ffffff"
                    fontSize={12}
                    tick={{ fill: "#ffffff" }}
                    tickFormatter={(v) => `${v / 1000}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" fill="#ffffff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Distribution across expense categories</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="flex flex-col items-center justify-center lg:flex-row lg:items-center gap-6 lg:gap-8 min-w-0">
              <ChartContainer
                config={{
                  value: { label: "Amount" },
                }}
                className="h-[200px] w-[200px] shrink-0"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="space-y-2 flex-1 min-w-0 w-full">
                {categoryBreakdown.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                    </div>
                    <span className="font-medium flex items-center">
                      <IndianRupee className="h-3 w-3" />
                      {item.value.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Contributors */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Contributors</CardTitle>
              <CardDescription>Highest contributing members</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/reports">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topContributors.map((contributor, index) => {
                const amount = typeof contributor.amount === "number" ? contributor.amount : 0
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium">{contributor.name}</span>
                    </div>
                    <span className="text-sm font-semibold flex items-center">
                      <IndianRupee className="h-3 w-3" />
                      {amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Pending Expenses */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Expenses awaiting your review</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/expenses">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentExpenses
                .filter((e) => e.status === "pending")
                .map((expense) => (
                  <div
                    key={expense.id ?? `${expense.member}-${expense.event}-${expense.amount}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
                        <Clock className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{expense.member}</p>
                        <p className="text-xs text-muted-foreground">{expense.event}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold flex items-center justify-end">
                        <IndianRupee className="h-3 w-3" />
                        {expense.amount.toLocaleString("en-IN")}
                      </p>
                      <Badge variant="outline" className="border-warning text-warning text-xs">
                        Pending
                      </Badge>
                    </div>
                  </div>
                ))}
              {recentExpenses.filter((e) => e.status === "pending").length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="mx-auto h-8 w-8 mb-2" />
                  <p>All caught up! No pending approvals.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
