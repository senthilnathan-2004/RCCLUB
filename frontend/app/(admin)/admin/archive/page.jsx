"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  FolderArchive,
  Lock,
  Unlock,
  Download,
  Upload,
  PlayCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Users,
  IndianRupee,
} from "lucide-react"
import api from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const FILE_BASE_URL = API_BASE_URL.replace(/\/api$/, "")

export default function ArchivePage() {
  const [archives, setArchives] = useState([])
  const [currentYearData, setCurrentYearData] = useState({
    year: "",
    status: "active",
    totalContributions: 0,
    totalExpenses: 0,
    members: 0,
    events: 0,
    pendingReimbursements: 0,
    pendingApprovals: 0,
  })
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedArchiveFiles, setSelectedArchiveFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const [isCloseYearDialogOpen, setIsCloseYearDialogOpen] = useState(false)
  const [isNewYearDialogOpen, setIsNewYearDialogOpen] = useState(false)
  const [confirmations, setConfirmations] = useState({
    exportData: false,
    verifyAmounts: false,
    notifyMembers: false,
    backupComplete: false,
  })
  const [newYearData, setNewYearData] = useState({
    year: "",
    theme: "",
    carryOverMembers: true,
    resetContributions: true, // kept for UI only
  })
  const fileInputRef = useRef(null)

  const allConfirmed = Object.values(confirmations).every(Boolean)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }
  const formatDate = (date) => {
    if (!date) return "Not available"
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const loadArchiveForYear = async (year) => {
    if (!year) return
    try {
      const response = await api.getArchiveByYear(year)
      const archive = response.data
      setSelectedArchiveFiles(archive?.files || [])
    } catch (err) {
      // If archive not found, just clear files but don't break UI
      setSelectedArchiveFiles([])
    }
  }

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [archivesResponse, settingsResponse, dashboardResponse] = await Promise.all([
        api.getArchives(),
        api.getSettings().catch(() => null),
        api.getAdminDashboard().catch(() => null),
      ])

      const archiveList = archivesResponse.data || []
      setArchives(archiveList)

      const activeArchive = archiveList.find((a) => a.status === "active") || archiveList[0]
      const settingsData = settingsResponse?.data
      const dashboardData = dashboardResponse?.data
      const fallbackYear =
        activeArchive?.rotaractYear || settingsData?.currentRotaractYear || new Date().getFullYear().toString()

      // Prefer live dashboard stats for the current year to avoid stale or zeroed archive summaries
      if (dashboardData && dashboardData.rotaractYear === fallbackYear) {
        const summary = dashboardData.summary || {}
        setCurrentYearData((prev) => ({
          ...prev,
          year: dashboardData.rotaractYear,
          status: "active",
          totalContributions: summary.totalContributions || 0,
          totalExpenses: summary.totalSpending || 0,
          members: summary.totalMembers || 0,
          events: summary.totalEvents || 0,
          pendingReimbursements: summary.pendingReimbursements || 0,
          pendingApprovals: summary.pendingCount || 0,
        }))
      } else if (activeArchive) {
        const summary = activeArchive.summary || {}
        setCurrentYearData((prev) => ({
          ...prev,
          year: activeArchive.rotaractYear,
          status: activeArchive.status,
          totalContributions: summary.totalContributions || 0,
          totalExpenses: summary.totalExpenses || 0,
          members: summary.totalMembers || 0,
          events: summary.totalEvents || 0,
        }))
      } else {
        // No archive and no dashboard – still show the current Rotaract year from settings/calendar
        setCurrentYearData((prev) => ({
          ...prev,
          year: fallbackYear,
        }))
      }

      // Override total expenses with sum of event budgets from admin event details for the same year
      try {
        // Use backend's default financial year logic for event-wise report
        const eventReport = (await api.getEventWiseReport()).data

        const totalBudget =
          eventReport?.events?.reduce((sum, event) => sum + (event.estimatedBudget || 0), 0) || 0

        setCurrentYearData((prev) => ({
          ...prev,
          totalExpenses: totalBudget,
        }))
      } catch {
        // If event-wise report fails, keep whatever totalExpenses we already have
      }

      // Always ensure the files tab has a year selected and its files loaded
      setSelectedYear(fallbackYear)
      await loadArchiveForYear(fallbackYear)
    } catch (err) {
      setError(err.message || "Failed to load archive data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCloseYear = async () => {
    if (!allConfirmed) return

    try {
      setActionLoading(true)
      await api.closeYear({
        notes: "",
        carryOverMembers: newYearData.carryOverMembers,
      })
      await loadInitialData()
      setIsCloseYearDialogOpen(false)
      setConfirmations({ exportData: false, verifyAmounts: false, notifyMembers: false, backupComplete: false })
    } catch (err) {
      alert(err.message || "Failed to close year")
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartNewYear = async () => {
    if (!newYearData.year) {
      alert("Please enter a valid Rotaract year before starting a new year.")
      return
    }

    try {
      setActionLoading(true)
      await api.startNewYear({
        newYear: newYearData.year,
        theme: newYearData.theme,
        carryOverMembers: newYearData.carryOverMembers,
      })
      await loadInitialData()
      setIsNewYearDialogOpen(false)
    } catch (err) {
      alert(err.message || "Failed to start new year")
    } finally {
      setActionLoading(false)
    }
  }

  const handleYearChange = async (value) => {
    setSelectedYear(value)
    await loadArchiveForYear(value)
  }

  const handleDownloadReport = async (year) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
      const response = await fetch(
        `${API_BASE_URL}/reports/export/pdf?rotaractYear=${encodeURIComponent(year)}`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to download report")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `financial-report-${year}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message || "Failed to download report")
    }
  }

  const handleDownloadFile = async (file) => {
    if (!file?.url) return

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
      const downloadUrl = file.url.startsWith("http") ? file.url : `${FILE_BASE_URL}${file.url}`

      const response = await fetch(downloadUrl, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        throw new Error("Failed to download file")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = file.name || "archive-file"
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message || "Failed to download file")
    }
  }

  const handleUploadFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !selectedYear) return

    try {
      setActionLoading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", file.name)
      const extension = file.name.split(".").pop()?.toLowerCase()
      let type = "other"
      if (extension === "pdf") type = "financial_report"
      if (extension === "xlsx" || extension === "xls") type = "member_list"
      if (extension === "zip") type = "bills_archive"
      formData.append("type", type)

      const response = await api.addArchiveFile(selectedYear, formData)
      setSelectedArchiveFiles(response.data || [])
    } catch (err) {
      alert(err.message || "Failed to upload file")
    } finally {
      setActionLoading(false)
      if (event.target) {
        event.target.value = ""
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight">Year-End Archive</h1>
          <p className="text-muted-foreground">Manage financial year transitions and archives</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Year Status */}
      <Card className="border-primary/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Current Year: {currentYearData.year || "Loading..."}</CardTitle>
                <CardDescription>Active financial year</CardDescription>
              </div>
            </div>
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 w-fit">
              <Unlock className="mr-1 h-3 w-3" />
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <IndianRupee className="h-4 w-4" />
                <span className="text-sm">Total Contributions</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(currentYearData.totalContributions)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <IndianRupee className="h-4 w-4" />
                <span className="text-sm">Total Expenses</span>
              </div>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(currentYearData.totalExpenses)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Active Members</span>
              </div>
              <p className="text-2xl font-bold">{currentYearData.members}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Events Completed</span>
              </div>
              <p className="text-2xl font-bold">{currentYearData.events}</p>
            </div>
          </div>

          {(currentYearData.pendingReimbursements > 0 || currentYearData.pendingApprovals > 0) && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Pending Items</AlertTitle>
              <AlertDescription>
                You have {currentYearData.pendingApprovals} pending expense approvals and{" "}
                {formatCurrency(currentYearData.pendingReimbursements)} in pending reimbursements. Please resolve these
                before closing the year.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-center gap-3">
            <Dialog open={isCloseYearDialogOpen} onOpenChange={setIsCloseYearDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Lock className="mr-2 h-4 w-4" />
                  Close Current Year
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Close Financial Year {currentYearData.year}</DialogTitle>
                  <DialogDescription>
                    This action will lock all financial data for this year. Please complete the checklist before
                    proceeding.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                      Once closed, financial data cannot be modified. Make sure all expenses are approved and
                      reimbursements are complete.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="export"
                        checked={confirmations.exportData}
                        onCheckedChange={(checked) => setConfirmations((prev) => ({ ...prev, exportData: checked }))}
                      />
                      <Label htmlFor="export" className="cursor-pointer">
                        Export all financial reports
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="verify"
                        checked={confirmations.verifyAmounts}
                        onCheckedChange={(checked) => setConfirmations((prev) => ({ ...prev, verifyAmounts: checked }))}
                      />
                      <Label htmlFor="verify" className="cursor-pointer">
                        Verify all amounts are correct
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="notify"
                        checked={confirmations.notifyMembers}
                        onCheckedChange={(checked) => setConfirmations((prev) => ({ ...prev, notifyMembers: checked }))}
                      />
                      <Label htmlFor="notify" className="cursor-pointer">
                        Notify all members about year-end
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="backup"
                        checked={confirmations.backupComplete}
                        onCheckedChange={(checked) =>
                          setConfirmations((prev) => ({ ...prev, backupComplete: checked }))
                        }
                      />
                      <Label htmlFor="backup" className="cursor-pointer">
                        Backup all data and bills
                      </Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCloseYearDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleCloseYear} disabled={!allConfirmed || actionLoading}>
                    <Lock className="mr-2 h-4 w-4" />
                    Close Year
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isNewYearDialogOpen} onOpenChange={setIsNewYearDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start New Year
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Start New Rotaract Year</DialogTitle>
                  <DialogDescription>Configure the new financial year settings</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="newYear">Rotaract Year</Label>
                    <Input
                      id="newYear"
                      value={newYearData.year}
                      onChange={(e) => setNewYearData((prev) => ({ ...prev, year: e.target.value }))}
                      placeholder="2026-2027"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="theme">Theme of the Year</Label>
                    <Input
                      id="theme"
                      value={newYearData.theme}
                      onChange={(e) => setNewYearData((prev) => ({ ...prev, theme: e.target.value }))}
                      placeholder="Enter Rotary International theme"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="carryOver"
                        checked={newYearData.carryOverMembers}
                        onCheckedChange={(checked) =>
                          setNewYearData((prev) => ({ ...prev, carryOverMembers: checked }))
                        }
                      />
                      <Label htmlFor="carryOver" className="cursor-pointer">
                        Carry over existing members
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="resetContributions"
                        checked={newYearData.resetContributions}
                        onCheckedChange={(checked) =>
                          setNewYearData((prev) => ({ ...prev, resetContributions: checked }))
                        }
                      />
                      <Label htmlFor="resetContributions" className="cursor-pointer">
                        Reset contribution counts
                      </Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewYearDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleStartNewYear} disabled={actionLoading}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Year
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Past Archives */}
      <Tabs defaultValue="archives" className="space-y-4">
        <TabsList>
          <TabsTrigger value="archives">Past Archives</TabsTrigger>
          <TabsTrigger value="files">Archived Files</TabsTrigger>
        </TabsList>

        <TabsContent value="archives" className="space-y-4">
          <div className="grid gap-4">
            {archives.map((archive) => (
              <Card key={archive._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <FolderArchive className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{archive.rotaractYear}</CardTitle>
                        <CardDescription>
                          Locked on {formatDate(archive.closedAt || archive.createdAt)}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <Lock className="mr-1 h-3 w-3" />
                      Archived
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Contributions</p>
                      <p className="text-lg font-semibold text-green-500">
                        {formatCurrency(archive.summary?.totalContributions || 0)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Expenses</p>
                      <p className="text-lg font-semibold text-red-500">
                        {formatCurrency(archive.summary?.totalExpenses || 0)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Members</p>
                      <p className="text-lg font-semibold">{archive.summary?.totalMembers || 0}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Events</p>
                      <p className="text-lg font-semibold">{archive.summary?.totalEvents || 0}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadReport(archive.rotaractYear)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Report
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Archived Files</CardTitle>
                  <CardDescription>Download archived documents by year</CardDescription>
                </div>
                <Select value={selectedYear} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {archives.map((a) => (
                      <SelectItem key={a._id} value={a.rotaractYear}>
                        {a.rotaractYear}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedArchiveFiles.map((file, index) => (
                    <TableRow key={file._id || index}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {file.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{file.type?.toUpperCase() || "FILE"}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">-</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadFile(file)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Upload additional archive files</p>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.xlsx,.xls,.zip"
                    />
                    <Button variant="outline" size="sm" onClick={handleUploadFileClick} disabled={actionLoading}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

