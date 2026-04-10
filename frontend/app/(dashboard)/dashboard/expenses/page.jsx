"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { IndianRupee, PlusCircle, Search, Eye, Download, Clock, CheckCircle, XCircle, FileText } from "lucide-react"
import api from "@/lib/api"

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

const months = [
  { value: "all", label: "All Months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]

// Map API expense data to frontend format
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
    id: expense._id || expense.id,
    event: expense.event?.name || expense.event || "No Event",
    category: expense.category,
    amount: expense.amount,
    date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    status: expense.status,
    paymentMode: expense.paymentMode,
    description: expense.description || "",
    bill: getBillUrl(expense.billUrl),
    rejectionReason: expense.rejectionReason || null,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  }
}

export default function MyExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
    month: "all",
    search: "",
  })
  const [selectedExpense, setSelectedExpense] = useState(null)

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true)
        const params = {}
        if (filters.category !== "all") params.category = filters.category
        if (filters.status !== "all") params.status = filters.status
        if (filters.month !== "all") {
          const currentYear = new Date().getFullYear()
          params.month = filters.month
          params.year = currentYear
        }

        const response = await api.getMemberExpenses(params)
        // API returns expenses in response.data array
        const expensesData = Array.isArray(response.data) ? response.data : (response.data?.data || [])
        const formattedExpenses = expensesData.map(mapApiExpense)
        setExpenses(formattedExpenses)
      } catch (error) {
        console.error("Error fetching expenses:", error)
        setExpenses([])
      } finally {
        setLoading(false)
      }
    }
    fetchExpenses()
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

  const filteredExpenses = expenses.filter((expense) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        expense.event.toLowerCase().includes(searchLower) || expense.description?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Expenses</h1>
          <p className="text-muted-foreground">View and track your expense submissions</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/expenses/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Submit Expense
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
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
            <Select value={filters.month} onValueChange={(value) => setFilters({ ...filters, month: value })}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
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
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No expenses found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.category !== "all" || filters.status !== "all"
                  ? "Try adjusting your filters"
                  : "You haven't submitted any expenses yet"}
              </p>
              <Button asChild>
                <Link href="/dashboard/expenses/new">Submit your first expense</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Date</TableHead>
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
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{expense.event}</TableCell>
                      <TableCell>{getCategoryLabel(expense.category)}</TableCell>
                      <TableCell className="font-medium">
                        <span className="flex items-center">
                          <IndianRupee className="h-3 w-3 mr-0.5" />
                          {expense.amount.toLocaleString("en-IN")}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedExpense(expense)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {expense.bill && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={expense.bill} download>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Detail Dialog */}
      <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          {selectedExpense && (
            <>
              <DialogHeader>
                <DialogTitle>Expense Details</DialogTitle>
                <DialogDescription>
                  Submitted on{" "}
                  {new Date(selectedExpense.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
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
                    <p className="text-sm text-muted-foreground">Payment Mode</p>
                    <p className="font-medium capitalize">{selectedExpense.paymentMode}</p>
                  </div>
                  <div className="col-span-2">
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
                {selectedExpense.rejectionReason && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-muted-foreground">Rejection Reason</p>
                    <p className="font-medium text-destructive">{selectedExpense.rejectionReason}</p>
                  </div>
                )}
                {selectedExpense.bill && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Bill/Receipt</p>
                    <div className="relative aspect-[3/4] max-h-64 rounded-lg overflow-hidden border border-border">
                      <img
                        src={selectedExpense.bill || "/placeholder.svg"}
                        alt="Bill"
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <Button variant="outline" className="w-full mt-2 bg-transparent" asChild>
                      <a href={selectedExpense.bill} download>
                        <Download className="mr-2 h-4 w-4" /> Download Bill
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
