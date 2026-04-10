"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, UserPlus, Edit, Trash2, GraduationCap, Shield, Mail, Phone, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import api from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Helper function to get full photo URL
const getPhotoUrl = (photo) => {
  if (!photo) return null
  if (photo.startsWith("http")) return photo
  if (photo.startsWith("/uploads")) {
    const baseUrl = API_BASE_URL.replace("/api", "")
    return `${baseUrl}${photo}`
  }
  return photo
}

const adminOnlyRoleValues = ["president", "secretary", "treasurer", "faculty_coordinator"]

const roleOptions = [
  { value: "member", label: "Member" },
  { value: "director", label: "Director" },
  { value: "associate_director", label: "Associate Director" },
  { value: "sergeant_at_arms", label: "Sergeant at Arms" },
  { value: "associate_sergeant_at_arms", label: "Associate Sergeant at Arms" },
  { value: "club_photographer", label: "Club Photographer" },
  { value: "public_relation_officer_pro", label: "Public Relation Officer Pro" },
  { value: "club_editor", label: "Club Editor" },
  { value: "content_writer", label: "Content Writer" },
  { value: "blood_donation_chairman", label: "Blood Donation Chairman" },
  { value: "green_rotaractor", label: "Green Rotaractor" },
  { value: "vice_president", label: "Vice President" },
  { value: "joint_secretary", label: "Joint Secretary" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
  { value: "president", label: "President" },
  { value: "faculty_coordinator", label: "Faculty Coordinator" },
]

const addMemberRoleOptions = roleOptions.filter((role) => !adminOnlyRoleValues.includes(role.value))

// Map API member data to the format expected by the UI
const mapApiMember = (member) => {
  if (!member) return null;
  
  // Handle date safely
  let formattedDate = '';
  if (member.joinedAt) {
    try {
      const date = new Date(member.joinedAt);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.warn('Invalid date format for member:', member._id, e);
    }
  }

  return {
    id: member._id || member.id,
    firstName: member.firstName || '',
    lastName: member.lastName || '',
    email: member.email || '',
    phone: member.phone || '',
    role: member.role || 'member',
    photo: member.photo || member.profilePhoto || null,
    joinedAt: formattedDate,
    isAlumni: member.isAlumni || false,
    status: member.status || 'active'
  };
}

export default function MemberManagementPage() {
  const { isPresident, isTreasurer, isAdmin } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMember, setSelectedMember] = useState(null)
  const [dialogType, setDialogType] = useState(null) // 'add' | 'edit' | 'role' | 'delete' | 'alumni'
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "member",
  })
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true)
        console.log('Fetching members...')
        const response = await api.getAllMembers({ status: 'active' })
        console.log('API Response:', response) // Log the full response
        
        // Handle both direct array response and data property
        const membersData = Array.isArray(response) ? response : (response.data || [])
        console.log('Members data:', membersData)
        
        if (!Array.isArray(membersData)) {
          throw new Error('Invalid members data format received from API')
        }
        
        const formattedMembers = membersData.map(mapApiMember)
        console.log('Formatted members:', formattedMembers)
        
        setMembers(formattedMembers)
      } catch (err) {
        console.error('Error fetching members:', err)
        setError(`Failed to load members: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [])

  const getRoleBadge = (role) => {
    const roleConfig = {
      president: { className: "bg-primary text-primary-foreground", icon: Shield },
      secretary: { className: "bg-accent text-accent-foreground", icon: Shield },
      treasurer: { className: "bg-accent text-accent-foreground", icon: Shield },
      director: { className: "bg-secondary text-secondary-foreground", icon: null },
      associate_director: { className: "bg-secondary text-secondary-foreground", icon: null },
      sergeant_at_arms: { className: "bg-secondary text-secondary-foreground", icon: null },
      associate_sergeant_at_arms: { className: "bg-secondary text-secondary-foreground", icon: null },
      club_photographer: { className: "bg-secondary text-secondary-foreground", icon: null },
      public_relation_officer_pro: { className: "bg-secondary text-secondary-foreground", icon: null },
      club_editor: { className: "bg-secondary text-secondary-foreground", icon: null },
      content_writer: { className: "bg-secondary text-secondary-foreground", icon: null },
      blood_donation_chairman: { className: "bg-secondary text-secondary-foreground", icon: null },
      green_rotaractor: { className: "bg-secondary text-secondary-foreground", icon: null },
      member: { className: "bg-muted text-muted-foreground", icon: null },
      alumni: { className: "bg-muted text-muted-foreground", icon: GraduationCap },
    }
    const config = roleConfig[role] || roleConfig.member
    
    // Format role name: convert snake_case to Title Case
    const formatRoleName = (roleName) => {
      return roleName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
    
    return (
      <Badge className={config.className}>
        {config.icon && <config.icon className="mr-1 h-3 w-3" />}
        {formatRoleName(role)}
      </Badge>
    )
  }

  const openDialog = (member, type) => {
    setError(null) // Clear any previous errors
    setSelectedMember(member)
    setDialogType(type)
    if (type === "edit" && member) {
      setFormData({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        role: member.role,
      })
    } else if (type === "add") {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "member",
      })
    } else if (type === "role" && member) {
      setFormData({ ...formData, role: member.role })
    }
  }

  const closeDialog = () => {
    setError(null) // Clear errors when closing dialog
    setSelectedMember(null)
    setDialogType(null)
    setFormData({ firstName: "", lastName: "", email: "", phone: "", role: "member" })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setActionLoading(true)
    
    try {
      if (dialogType === "add") {
        const response = await api.addMember(formData)
        const newMember = mapApiMember(response.data || response)
        setMembers(prev => [newMember, ...prev])
      } else if (dialogType === "edit") {
        await api.updateMember(selectedMember.id, formData)
        setMembers(prev =>
          prev.map(member =>
            member.id === selectedMember.id ? { ...member, ...formData } : member
          )
        )
      }
      
      closeDialog()
    } catch (err) {
      console.error(`Error ${dialogType === 'add' ? 'adding' : 'updating'} member:`, err)
      
      // Extract error message from the error object
      let errorMessage = err.message || `Failed to ${dialogType === 'add' ? 'add' : 'update'} member. Please try again.`
      
      // If the error has a response with errors array, format them
      if (err.errors && Array.isArray(err.errors)) {
        const errorMessages = err.errors.map(e => `${e.field}: ${e.message}`).join(', ')
        errorMessage = errorMessages || errorMessage
      }
      
      setError(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRoleChange = async (memberId, newRole) => {
    try {
      setLoading(true)
      await api.changeMemberRole(memberId, newRole)
      
      // Update local state
      setMembers(prev =>
        prev.map(member => 
          member.id === memberId ? { ...member, role: newRole } : member
        )
      )
    } catch (err) {
      console.error('Error updating member role:', err)
      setError('Failed to update member role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsAlumni = async (memberId) => {
    try {
      setLoading(true)
      await api.markAsAlumni(memberId)
      
      // Update local state
      setMembers(prev => prev.filter(member => member.id !== memberId))
      closeDialog()
    } catch (err) {
      console.error('Error marking member as alumni:', err)
      setError('Failed to mark member as alumni. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMember = async () => {
    try {
      setLoading(true)
      await api.deleteMember(selectedMember.id)
      setMembers(prev => prev.filter(member => member.id !== selectedMember.id))
      closeDialog()
    } catch (err) {
      console.error('Error deleting member:', err)
      setError('Failed to delete member. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Filter members based on search term (client-side filtering)
  const filteredMembers = members.filter((member) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      (member.firstName?.toLowerCase() || '').includes(searchLower) ||
      (member.lastName?.toLowerCase() || '').includes(searchLower) ||
      (member.email?.toLowerCase() || '').includes(searchLower) ||
      (member.phone || '').includes(searchTerm)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Member Management</h1>
          <p className="text-muted-foreground">Manage club members and roles</p>
        </div>
        <Button onClick={() => openDialog(null, "add")}>
          <UserPlus className="mr-2 h-4 w-4" /> Add Member
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search members..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          {!loading && filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? 'No matching members found' : 'No members found'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={getPhotoUrl(member.photo)} alt={`${member.firstName} ${member.lastName}`} />
                            <AvatarFallback>
                              {member.firstName?.charAt(0) || ''}
                              {member.lastName?.charAt(0) || ''}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : 'Member'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.email || '-'}</TableCell>
                      <TableCell>{member.phone || '-'}</TableCell>
                      <TableCell>
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleRoleChange(member.id, value)}
                          disabled={!isPresident || loading}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((role) => (
                              <SelectItem 
                                key={role.value} 
                                value={role.value}
                                disabled={!isPresident}
                              >
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{member.joinedAt || '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => openDialog(member, "edit")}
                              disabled={!isAdmin && !isPresident && !isTreasurer}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDialog(member, "role")}
                              disabled={!isPresident}
                            >
                              <Shield className="mr-2 h-4 w-4" /> Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDialog(member, "alumni")}
                              disabled={!isAdmin && !isPresident && !isTreasurer}
                            >
                              <GraduationCap className="mr-2 h-4 w-4" /> Mark as Alumni
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => openDialog(member, "delete")}
                              disabled={!isAdmin && !isPresident && !isTreasurer}
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

      {/* Add/Edit Member Dialog */}
      <Dialog open={dialogType === "add" || dialogType === "edit"} onOpenChange={closeDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{dialogType === "add" ? "Add New Member" : "Edit Member"}</DialogTitle>
            <DialogDescription>
              {dialogType === "add" ? "Add a new member to the club" : "Update member information"}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {addMemberRoleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? "Saving..." : dialogType === "add" ? "Add Member" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={dialogType === "role"} onOpenChange={closeDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedMember?.firstName} {selectedMember?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={() => handleRoleChange(selectedMember.id, formData.role)} disabled={actionLoading}>
              {actionLoading ? "Changing..." : "Change Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Alumni Dialog */}
      <Dialog open={dialogType === "alumni"} onOpenChange={closeDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Mark as Alumni</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark {selectedMember?.firstName} {selectedMember?.lastName} as alumni? They will
              no longer have active member privileges.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={() => handleMarkAsAlumni(selectedMember.id)} disabled={actionLoading}>
              {actionLoading ? "Processing..." : "Mark as Alumni"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialogType === "delete"} onOpenChange={closeDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Delete Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedMember?.firstName} {selectedMember?.lastName}? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMember} disabled={actionLoading}>
              {actionLoading ? "Deleting..." : "Delete Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
