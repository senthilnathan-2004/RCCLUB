"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload, X, IndianRupee, AlertCircle, CheckCircle, Users, Calendar } from "lucide-react"
import api from "@/lib/api"

const categories = [
  { value: "donation", label: "Donation" },
  { value: "personal_contribution", label: "Personal Contribution" },
  { value: "travel_expense", label: "Travel Expense" },
  { value: "accommodation", label: "Accommodation" },
  { value: "event_material", label: "Event Material" },
  { value: "food_refreshments", label: "Food & Refreshments" },
  { value: "miscellaneous", label: "Miscellaneous" },
]

const paymentModes = [
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
]

const statuses = [
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "reimbursed", label: "Reimbursed" },
  { value: "paid", label: "Paid" },
]

export default function AdminManualExpensePage() {
  const router = useRouter()
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [formData, setFormData] = useState({
    member: "",
    event: "",
    category: "",
    amount: "",
    date: "",
    paymentMode: "",
    description: "",
    notes: "",
    status: "approved",
  })
  const [billFile, setBillFile] = useState(null)
  const [billPreview, setBillPreview] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [membersRes, eventsRes] = await Promise.all([api.getMembersDropdown(), api.getEventsDropdown()])
        setMembers(membersRes.data || [])
        setEvents(eventsRes.data || [])
      } catch (err) {
        console.error("Error fetching dropdown data:", err)
        setError("Failed to load members or events. Please refresh and try again.")
      }
    }
    fetchDropdowns()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size should be less than 5MB")
        return
      }
      setBillFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBillPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeBill = () => {
    setBillFile(null)
    setBillPreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!formData.member || !formData.event || !formData.category || !formData.amount || !formData.date || !formData.paymentMode) {
      setError("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      const submitData = new FormData()
      submitData.append("member", formData.member)
      submitData.append("event", formData.event)
      submitData.append("category", formData.category)
      submitData.append("amount", formData.amount)
      submitData.append("date", formData.date)
      submitData.append("paymentMode", formData.paymentMode)
      submitData.append("description", formData.description)
      submitData.append("notes", formData.notes)
      if (formData.status) {
        submitData.append("status", formData.status)
      }
      if (billFile) {
        submitData.append("bill", billFile)
      }

      await api.addManualExpense(submitData)
      setSuccess(true)
      setTimeout(() => {
        router.push("/admin/expenses")
      }, 2000)
    } catch (err) {
      setError(err.message || "Failed to add manual expense. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Manual Expense Added!</h2>
              <p className="text-muted-foreground mb-4">
                The expense has been recorded successfully.
              </p>
              <p className="text-sm text-muted-foreground">Redirecting to expense management...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/expenses">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Manual Expense</h1>
          <p className="text-muted-foreground">Record an expense on behalf of a member</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Member & Event */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="member">Member *</Label>
                  <Select value={formData.member} onValueChange={(value) => handleSelectChange("member", value)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {m.firstName} {m.lastName} {m.memberId ? `(${m.memberId})` : ""}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event">Event *</Label>
                  <Select value={formData.event} onValueChange={(value) => handleSelectChange("event", value)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event._id || event.id} value={event._id || event.id}>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>{event.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (INR) *</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="pl-9 bg-secondary border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    max={new Date().toISOString().split("T")[0]}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div className="space-y-2">
                <Label htmlFor="paymentMode">Payment Mode *</Label>
                <Select
                  value={formData.paymentMode}
                  onValueChange={(value) => handleSelectChange("paymentMode", value)}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentModes.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description & Notes */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Short description of the expense..."
                  rows={3}
                  className="bg-secondary border-border resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes (optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional internal notes..."
                  rows={3}
                  className="bg-secondary border-border resize-none"
                />
              </div>

              {/* Bill Upload */}
              <div className="space-y-2">
                <Label>Bill/Receipt (Optional)</Label>
                {billPreview ? (
                  <div className="relative">
                    <div className="relative aspect-[4/3] max-h-48 rounded-lg overflow-hidden border border-border">
                      <img
                        src={billPreview || "/placeholder.svg"}
                        alt="Bill preview"
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeBill}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Upload bill or receipt (Max 5MB)</p>
                    <p className="text-xs text-muted-foreground mb-4">Supported formats: JPG, PNG, PDF</p>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="bill-upload-admin"
                    />
                    <Button type="button" variant="outline" asChild>
                      <label htmlFor="bill-upload-admin" className="cursor-pointer">
                        Choose File
                      </label>
                    </Button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Expense"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/expenses">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


