"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  IndianRupee,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  PlusCircle,
  BanknoteIcon,
} from "lucide-react"
import api from "@/lib/api"
import { getSocket } from "@/lib/socket"

const categories = [
  { value: "all", label: "All Categories" },
  { value: "donation", label: "Donation" },
  { value: "personal_contribution", label: "Personal Contribution" },
  { value: "travel_expense", label: "Travel Expense" },
  { value: "accommodation", label: "Accommodation" },
  { value: "event_material", label: "Event Material" },
  { value: "food_refreshments", label: "Food & Refreshments" },
  { value: "miscellaneous", label: "Miscellaneous" },
]

const statuses = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "reimbursed", label: "Reimbursed" },
]

// Mapping API response to match frontend format
const mapApiExpense = (expense) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
  
  // Helper function to get full bill URL
  const getBillUrl = (billUrl) => {
    if (!billUrl) return null
    if (billUrl.startsWith("http")) return billUrl
    if (billUrl.startsWith("/uploads")) {
      const baseUrl = API_BASE_URL.replace("/api", "")
      return `${baseUrl}${billUrl}`
    }
    return billUrl
  }

  return {
    id: expense._id,
    member: {
      firstName: expense.member?.firstName || 'Unknown',
      lastName: expense.member?.lastName || 'User',
      role: expense.member?.role || 'member',
      _id: expense.member?._id
    },
    event: expense.event?.name || 'No Event',
    category: expense.category,
    amount: expense.amount,
    date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    status: expense.status,
    paymentMode: expense.paymentMode,
    description: expense.description,
    bill: getBillUrl(expense.billUrl),
    rejectionReason: expense.rejectionReason,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt
  }
}

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
    search: "",
  })
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [dialogType, setDialogType] = useState(null) // 'view' | 'reject' | 'delete'
  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true)
        const params = {}
        if (filters.category !== "all") params.category = filters.category
        if (filters.status !== "all") params.status = filters.status
        if (filters.search) params.search = filters.search

        const response = await api.getAllExpenses(params)
        const formattedExpenses = response.data?.map(mapApiExpense) || []
        setExpenses(formattedExpenses)
      } catch (error) {
        console.error("Error fetching expenses:", error)
        setExpenses([])
      } finally {
        setLoading(false)
      }
    }
    
    // Initial fetch
    fetchExpenses()

    // Real-time updates
    const socket = getSocket()
    if (socket) {
      socket.on("new_expense_notification", () => {
        fetchExpenses()
      })
      socket.on("dashboard_update", (data) => {
        if (data.reason?.includes("expense")) {
          fetchExpenses()
        }
      })
      socket.on("refresh_expense_table", () => {
        fetchExpenses()
      })
    }

    return () => {
      if (socket) {
        socket.off("new_expense_notification")
        socket.off("dashboard_update")
        socket.off("refresh_expense_table")
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { className: "border-warning text-warning", icon: Clock },
      approved: { className: "border-primary text-primary", icon: CheckCircle },
      rejected: { className: "border-destructive text-destructive", icon: XCircle },
      reimbursed: { className: "border-success text-success", icon: CheckCircle },
      paid: { className: "border-success text-success", icon: CheckCircle },
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <Badge variant="outline" className={config.className}>
        <config.icon className="mr-1 h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getCategoryLabel = (category) => {
    return categories.find((c) => c.value === category)?.label || category
  }

  const handleApprove = async (expense) => {
    setActionLoading(true)
    try {
      await api.approveExpense(expense.id)
      // Refresh the list to ensure we have the latest data
      const response = await api.getAllExpenses()
      const formattedExpenses = response.data?.map(mapApiExpense) || []
      setExpenses(formattedExpenses)
    } catch (error) {
      console.error("Error approving expense:", error)
      // Show error toast or notification here
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    setActionLoading(true)
    try {
      await api.rejectExpense(selectedExpense.id, rejectReason)
      // Refresh the list to ensure we have the latest data
      const response = await api.getAllExpenses()
      const formattedExpenses = response.data?.map(mapApiExpense) || []
      setExpenses(formattedExpenses)
      closeDialog()
    } catch (error) {
      console.error("Error rejecting expense:", error)
      // Show error toast or notification here
    } finally {
      setActionLoading(false)
    }
  }

  const handleReimburse = async (expense) => {
    setActionLoading(true)
    try {
      await api.reimburseExpense(expense.id)
      // Refresh the list to ensure we have the latest data
      const response = await api.getAllExpenses()
      const formattedExpenses = response.data?.map(mapApiExpense) || []
      setExpenses(formattedExpenses)
    } catch (error) {
      console.error("Error marking as reimbursed:", error)
      // Show error toast or notification here
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await api.deleteExpense(selectedExpense.id)
      // Refresh the list to ensure we have the latest data
      const response = await api.getAllExpenses()
      const formattedExpenses = response.data?.map(mapApiExpense) || []
      setExpenses(formattedExpenses)
      closeDialog()
    } catch (error) {
      console.error("Error deleting expense:", error)
      // Show error toast or notification here
    } finally {
      setActionLoading(false)
    }
  }

  const openDialog = (expense, type) => {
    setSelectedExpense(expense)
    setDialogType(type)
    setRejectReason("")
  }

  const closeDialog = () => {
    setSelectedExpense(null)
    setDialogType(null)
    setRejectReason("")
  }

  // Filtering is now handled by the API
  const filteredExpenses = expenses

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Expense Management</h1>
          <p className="text-muted-foreground">Review and manage all expense submissions</p>
        </div>
        <Button asChild>
          <Link href="/admin/expenses/manual">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Manual Entry
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by member or event..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9 bg-secondary border-border"
              />
            </div>
            <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} className="border-border">
                      <TableCell className="font-medium">
                        {new Date(expense.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                        {expense.member.firstName} {expense.member.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {expense.member.role || 'Member'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{expense.event}</TableCell>
                      <TableCell>{getCategoryLabel(expense.category)}</TableCell>
                      <TableCell className="font-medium">
                        <span className="flex items-center">
                          <IndianRupee className="h-3 w-3 mr-0.5" />
                          {expense.amount.toLocaleString("en-IN")}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem onClick={() => openDialog(expense, "view")}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            {expense.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => handleApprove(expense)}>
                                  <CheckCircle className="mr-2 h-4 w-4 text-success" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDialog(expense, "reject")}>
                                  <XCircle className="mr-2 h-4 w-4 text-destructive" /> Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {expense.status === "approved" && (
                              <DropdownMenuItem onClick={() => handleReimburse(expense)}>
                                <BanknoteIcon className="mr-2 h-4 w-4 text-success" /> Mark Reimbursed
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => openDialog(expense, "delete")}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={dialogType === "view"} onOpenChange={closeDialog}>
        <DialogContent className="bg-card border-border max-w-lg">
          {selectedExpense && (
            <>
              <DialogHeader>
                <DialogTitle>Expense Details</DialogTitle>
                <DialogDescription>
                  Submitted by {selectedExpense.member.firstName} {selectedExpense.member.lastName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Event</p>
                    <p className="font-medium">{selectedExpense.event}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{getCategoryLabel(selectedExpense.category)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium flex items-center">
                      <IndianRupee className="h-4 w-4 mr-0.5" />
                      {selectedExpense.amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(selectedExpense.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Mode</p>
                    <p className="font-medium capitalize">{selectedExpense.paymentMode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedExpense.status)}</div>
                  </div>
                </div>
                {selectedExpense.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{selectedExpense.description}</p>
                  </div>
                )}
                {selectedExpense.bill && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Bill/Receipt</p>
                    <div className="relative aspect-[4/3] max-h-48 rounded-lg overflow-hidden border border-border">
                      <img
                        src={selectedExpense.bill || "/placeholder.svg"}
                        alt="Bill"
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                {selectedExpense.status === "pending" && (
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => openDialog(selectedExpense, "reject")}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button className="flex-1" onClick={() => handleApprove(selectedExpense)}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={dialogType === "reject"} onOpenChange={closeDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this expense.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reason for Rejection</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason..."
                rows={3}
                className="bg-secondary border-border resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || actionLoading}>
              {actionLoading ? "Rejecting..." : "Reject Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialogType === "delete"} onOpenChange={closeDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? "Deleting..." : "Delete Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
