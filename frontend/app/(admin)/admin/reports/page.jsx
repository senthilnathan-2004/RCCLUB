"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"
import {
  FileText,
  Download,
  FileSpreadsheet,
  FolderArchive,
  TrendingUp,
  Users,
  Calendar,
  IndianRupee,
  Trophy,
  Medal,
  Award,
} from "lucide-react"
import api from "@/lib/api"

export default function ReportsPage() {
  const [selectedYear, setSelectedYear] = useState("2025-2026")
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const [financialSummary, setFinancialSummary] = useState(null)
  const [memberReport, setMemberReport] = useState(null)
  const [eventReport, setEventReport] = useState(null)
  const [leaderboardData, setLeaderboardData] = useState(null)

  const selectedRotaractYear = useMemo(() => {
    // Backend uses a single year value like "2024-25" in helpers; here we pass the full label
    return selectedYear
  }, [selectedYear])

  useEffect(() => {
    let isMounted = true

    const fetchReports = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [financialRes, memberRes, eventRes, leaderboardRes] = await Promise.all([
          api.getFinancialSummary({ rotaractYear: selectedRotaractYear }),
          api.getMemberWiseReport({ rotaractYear: selectedRotaractYear }),
          api.getEventWiseReport({ rotaractYear: selectedRotaractYear }),
          api.getLeaderboard({ rotaractYear: selectedRotaractYear }),
        ])

        if (!isMounted) return

        setFinancialSummary(financialRes?.data || null)
        setMemberReport(memberRes?.data || null)
        setEventReport(eventRes?.data || null)
        setLeaderboardData(leaderboardRes?.data || null)
      } catch (err) {
        if (!isMounted) return
        setError(err.message || "Failed to load reports")
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchReports()

    return () => {
      isMounted = false
    }
  }, [selectedRotaractYear])

  const monthlyData =
    financialSummary?.expensesByMonth?.map((item) => {
      const monthIndex = item._id?.month ?? 1
      const date = new Date(2000, monthIndex - 1, 1)
      return {
        month: date.toLocaleString("en-US", { month: "short" }),
        // For now, treat total as expenses; income not tracked separately in backend
        income: item.total,
        expenses: item.total,
      }
    }) || []

  const categoryColorPalette = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#6b7280", "#0ea5e9", "#a855f7"]

  const categoryData =
    financialSummary?.expensesByCategory?.map((item, index) => ({
      name: item._id || "Uncategorized",
      value: item.total,
      color: categoryColorPalette[index % categoryColorPalette.length],
    })) || []

  const memberWiseData =
    memberReport?.members?.map((m) => ({
      name: `${m.member?.firstName || ""} ${m.member?.lastName || ""}`.trim() || m.member?.memberId || "Unknown Member",
      contributions: m.approvedAmount || 0,
      expenses: m.totalAmount || 0,
      events: m.expenseCount || 0,
    })) || []

  const eventWiseData =
    eventReport?.events?.map((e) => ({
      name: e.name,
      budget: e.estimatedBudget || 0,
      spent: e.totalExpenses || 0,
      status: e.status || "unknown",
    })) || []

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-muted-foreground font-bold">#{rank}</span>
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleDownload = async (type) => {
    try {
      setError(null)
      const params = { rotaractYear: selectedRotaractYear }

      // Use the same buttons and layout, just trigger real downloads
      let endpoint = ""
      if (type === "financial-pdf") endpoint = "/reports/export/pdf"
      if (type === "excel") endpoint = "/reports/export/excel"
      if (type === "bills-zip") endpoint = "/reports/export/bills"
      if (type === "member-pdf") endpoint = "/reports/export/pdf?scope=member"
      if (type === "event-pdf") endpoint = "/reports/export/pdf?scope=event"
      if (type === "category-pdf") endpoint = "/reports/export/pdf?scope=category"

      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
      const query = new URLSearchParams({ ...params }).toString()
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}${endpoint}${
        query ? (endpoint.includes("?") ? "&" : "?") + query : ""
      }`

      const res = await fetch(url, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Download failed")
      }

      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download =
        type === "excel"
          ? "report.xlsx"
          : type === "bills-zip"
            ? "bills.zip"
            : type.includes("pdf")
              ? "report.pdf"
              : "download"
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      setError(err.message || "Failed to download report")
    }
  }

  const leaderboard =
    leaderboardData?.leaderboard?.map((item) => ({
      rank: item.rank,
      name: `${item.member?.firstName || ""} ${item.member?.lastName || ""}`.trim() || item.member?.memberId || "Member",
      amount: item.totalContribution || 0,
      events: item.eventsCount || 0,
    })) || []

  const totals = financialSummary?.totals

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Financial reports and contribution analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-2026">2025-2026</SelectItem>
              <SelectItem value="2024-2025">2024-2025</SelectItem>
              <SelectItem value="2023-2024">2023-2024</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              <SelectItem value="1">January</SelectItem>
              <SelectItem value="2">February</SelectItem>
              <SelectItem value="3">March</SelectItem>
              <SelectItem value="4">April</SelectItem>
              <SelectItem value="5">May</SelectItem>
              <SelectItem value="6">June</SelectItem>
              <SelectItem value="7">July</SelectItem>
              <SelectItem value="8">August</SelectItem>
              <SelectItem value="9">September</SelectItem>
              <SelectItem value="10">October</SelectItem>
              <SelectItem value="11">November</SelectItem>
              <SelectItem value="12">December</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals ? formatCurrency(totals.totalApproved || 0) : isLoading ? "Loading..." : "₹0"}
            </div>
            <p className="text-xs text-muted-foreground">Approved expenses for selected year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals ? formatCurrency(totals.totalExpenses || 0) : isLoading ? "Loading..." : "₹0"}
            </div>
            <p className="text-xs text-muted-foreground">Overall expenses for selected year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {memberReport ? memberReport.members.length : isLoading ? "Loading..." : "0"}
            </div>
            <p className="text-xs text-muted-foreground">Members with expenses in selected year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Events Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {eventReport ? eventReport.events.length : isLoading ? "Loading..." : "0"}
            </div>
            <p className="text-xs text-muted-foreground">Events with recorded expenses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="member">Member-wise</TabsTrigger>
          <TabsTrigger value="event">Event-wise</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Overview</CardTitle>
                <CardDescription>Income vs Expenses trend</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Contributions" />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                      formatter={(value) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="member" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member-wise Contributions</CardTitle>
              <CardDescription>Individual member financial summary</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Name</TableHead>
                    <TableHead className="text-right">Contributions</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Events Attended</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberWiseData.map((member, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="text-right text-green-500">
                        {formatCurrency(member.contributions)}
                      </TableCell>
                      <TableCell className="text-right text-red-500">{formatCurrency(member.expenses)}</TableCell>
                      <TableCell className="text-right">{member.events}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(member.contributions - member.expenses)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Contribution Distribution</CardTitle>
              <CardDescription>Visual comparison of member contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={memberWiseData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" tickFormatter={(value) => `₹${value / 1000}k`} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Bar dataKey="contributions" fill="#3b82f6" name="Contributions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="event" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event-wise Financial Report</CardTitle>
              <CardDescription>Budget vs actual spending per event</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventWiseData.map((event, index) => {
                    const utilization = (event.spent / event.budget) * 100
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(event.budget)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(event.spent)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={utilization} className="w-20 h-2" />
                            <span className="text-sm text-muted-foreground">{utilization.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.status === "completed" ? "default" : "secondary"}>{event.status}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Budget Comparison</CardTitle>
              <CardDescription>Budget vs Actual spending chart</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={eventWiseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9ca3af" tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                  <Bar dataKey="spent" fill="#22c55e" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contribution Leaderboard</CardTitle>
              <CardDescription>Top contributors for {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((member) => (
                  <div
                    key={member.rank}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      member.rank === 1
                        ? "bg-yellow-500/10 border border-yellow-500/20"
                        : member.rank === 2
                          ? "bg-gray-500/10 border border-gray-500/20"
                          : member.rank === 3
                            ? "bg-amber-600/10 border border-amber-600/20"
                            : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10">{getRankIcon(member.rank)}</div>
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.events} events participated</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">{formatCurrency(member.amount)}</p>
                      <p className="text-sm text-muted-foreground">Total contribution</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <FileText className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Financial Summary PDF</CardTitle>
                    <CardDescription>Complete financial report</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-transparent"
                  variant="outline"
                  onClick={() => handleDownload("financial-pdf")}
                  disabled={isLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <FileSpreadsheet className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Excel Report</CardTitle>
                    <CardDescription>Detailed spreadsheet</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-transparent"
                  variant="outline"
                  onClick={() => handleDownload("excel")}
                  disabled={isLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Excel
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <FolderArchive className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Bills Archive</CardTitle>
                    <CardDescription>All bills in ZIP format</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-transparent"
                  variant="outline"
                  onClick={() => handleDownload("bills-zip")}
                  disabled={isLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download ZIP
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <Users className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Member Report</CardTitle>
                    <CardDescription>Member-wise breakdown</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-transparent"
                  variant="outline"
                  onClick={() => handleDownload("member-pdf")}
                  disabled={isLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Event Report</CardTitle>
                    <CardDescription>Event-wise breakdown</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-transparent"
                  variant="outline"
                  onClick={() => handleDownload("event-pdf")}
                  disabled={isLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-cyan-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Category Report</CardTitle>
                    <CardDescription>Category-wise breakdown</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-transparent"
                  variant="outline"
                  onClick={() => handleDownload("category-pdf")}
                  disabled={isLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
