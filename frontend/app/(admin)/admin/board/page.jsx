"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"
import { getSocket } from "@/lib/socket"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Plus, Edit, Trash2, Upload, Crown, Shield, Briefcase, Loader2 } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

const getBackendOrigin = () => {
  if (API_BASE_URL.startsWith("http")) {
    try {
      return new URL(API_BASE_URL).origin
    } catch {
      return "http://localhost:5000"
    }
  }
  return "http://localhost:5000"
}

// Helper function to get full photo URL
const getPhotoUrl = (photo) => {
  if (!photo) return null
  
  // If already a full URL, return as is
  if (photo.startsWith("http")) return photo
  
  // If it's a data URL (base64), return as is
  if (photo.startsWith("data:")) return photo
  
  // Backend photos are stored as /uploads/photos/filename
  // These need to be served from the backend server
  if (photo.startsWith("/uploads/photos/")) {
    const baseUrl = getBackendOrigin()
    return `${baseUrl}${photo}`
  }
  
  // Frontend uploads are stored as /uploads/filename in public folder
  // These can be served directly from Next.js public folder (no base URL needed)
  if (photo.startsWith("/uploads/")) {
    return photo
  }
  
  // If it's just a filename without path, assume backend photos folder
  if (photo && !photo.startsWith("/")) {
    return `${getBackendOrigin()}/uploads/photos/${photo}`
  }
  
  // If it doesn't start with /uploads, assume it's a relative path
  return photo.startsWith("/") ? photo : `/${photo}`
}

// Default empty board structure
const defaultBoard = {
  rotaractYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  theme: "",
  themeDescription: "",
  members: [],
  installationDate: "",
  installationVenue: ""
}

const roles = [
  { value: "president", label: "President" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
  { value: "director", label: "Director" },
  { value: "sergeant", label: "Sergeant at Arms" },
  { value: "editor", label: "Club Editor" },
]

const departments = [
  "Community Service",
  "Professional Development",
  "International Service",
  "Club Service",
  "Public Relations",
  "Membership",
]

export default function BoardManagementPage() {
  const { toast } = useToast()
  const [board, setBoard] = useState(defaultBoard)
  const [pastBoards, setPastBoards] = useState([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberToDelete, setMemberToDelete] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    department: "",
    email: "",
    phone: "",
    photo: "",
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  // Fetch board data on component mount
  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        setIsLoading(true)
        const [currentBoardRes, historyRes] = await Promise.all([
          api.getCurrentBoard(),
          api.getBoardHistory()
        ])
        
        if (currentBoardRes.data) {
          setBoard(currentBoardRes.data)
        } else {
          // If no current board exists, create a new one with default values
          const newBoard = { ...defaultBoard }
          await api.createOrUpdateBoard(newBoard)
          setBoard(newBoard)
        }
        
        if (historyRes.data) {
          setPastBoards(historyRes.data)
        }
      } catch (error) {
        console.error("Error fetching board data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load board data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBoardData()
  }, [toast])

  // Socket.io: listen for board and dashboard updates
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleBoardUpdated = () => {
      // Re-fetch current board when updated elsewhere
      // Reuse the same logic as initial fetch by calling the API again
      const refreshBoard = async () => {
        try {
          const currentBoardRes = await api.getCurrentBoard()
          if (currentBoardRes.data) {
            setBoard(currentBoardRes.data)
          }
        } catch (error) {
          console.error("Error refreshing board after socket update:", error)
        }
      }

      refreshBoard()

      toast({
        title: "Board updated",
        description: "The board information has been updated.",
      })
    }

    const handleDashboardUpdate = (payload) => {
      if (payload?.reason === "board_updated") {
        handleBoardUpdated()
      }
    }

    socket.on("board_updated", handleBoardUpdated)
    socket.on("dashboard_update", handleDashboardUpdate)

    return () => {
      socket.off("board_updated", handleBoardUpdated)
      socket.off("dashboard_update", handleDashboardUpdate)
    }
  }, [toast])

  const getRoleIcon = (role) => {
    switch (role) {
      case "president":
        return <Crown className="h-4 w-4 text-yellow-500" />
      case "secretary":
        return <Shield className="h-4 w-4 text-blue-500" />
      case "treasurer":
        return <Briefcase className="h-4 w-4 text-green-500" />
      default:
        return <Users className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Map frontend roles to backend position values
  const getBackendPosition = (role, department = '') => {
    const roleMap = {
      'president': 'president',
      'secretary': 'secretary',
      'treasurer': 'treasurer',
      'director': department ? `director_${department.toLowerCase().replace(/\s+/g, '_')}` : 'director_club_service',
      'vice_president': 'vice_president',
      'joint_secretary': 'joint_secretary',
      'sergeant': 'sergeant_at_arms',
      'editor': 'editor',
      'webmaster': 'webmaster'
    };
    
    return roleMap[role] || role; // Return the mapped value or the original if not found
  };

  const handleAdd = async () => {
    try {
      setIsSaving(true);

      // Map the role to a valid backend position
      const position = getBackendPosition(formData.role, formData.department);

      const payload = new FormData()
      payload.append("position", position)
      payload.append("name", formData.name)
      payload.append("email", formData.email || `${formData.name.toLowerCase().replace(/\s+/g, ".")}@rotaract.com`)
      payload.append("phone", formData.phone || "Not provided")
      payload.append("linkedIn", "")
      if (photoFile) {
        payload.append("photo", photoFile)
      } else if (formData.photo && !formData.photo.startsWith("data:")) {
        payload.append("photo", formData.photo)
      }

      await api.updateBoardMember(payload)

      // Show success message
      toast({
        title: "Success",
        description: "Board member added successfully",
      });

      // Reset form and close dialog
      setFormData({
        name: "",
        role: "",
        department: "",
        email: "",
        phone: "",
        photo: ""
      });
      setPhotoFile(null);
      setIsAddDialogOpen(false);

      // Refresh the board data
      const { data: updatedBoard } = await api.getCurrentBoard();
      setBoard(updatedBoard);
      
    } catch (error) {
      console.error("Error adding board member:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to add board member. Please try again.";
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  }

  const handleEdit = async () => {
    if (!selectedMember) return;

    try {
      setIsSaving(true);
      
      // Map the role to a valid backend position
      const position = getBackendPosition(formData.role, formData.department);

      const payload = new FormData()
      payload.append("position", position)
      payload.append(
        "name",
        formData.name
      )
      payload.append("email", formData.email || selectedMember.email || `${formData.name.toLowerCase().replace(/\s+/g, ".")}@rotaract.com`)
      payload.append("phone", formData.phone || selectedMember.phone || "Not provided")
      payload.append("linkedIn", selectedMember.linkedIn || "")
      if (selectedMember.userId) {
        payload.append("userId", selectedMember.userId)
      }
      if (photoFile) {
        payload.append("photo", photoFile)
      } else if (formData.photo && !formData.photo.startsWith("data:")) {
        payload.append("photo", formData.photo)
      }

      await api.updateBoardMember(payload)

      // Show success message
      toast({
        title: "Success",
        description: "Board member updated successfully",
      });

      // Refresh the board data
      const { data: updatedBoard } = await api.getCurrentBoard();
      setBoard(updatedBoard);
      
      // Close the dialog
      setIsEditDialogOpen(false);
      setSelectedMember(null);
      
    } catch (error) {
      console.error("Error updating board member:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to update board member. Please try again.";
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  }

  const handleDelete = async () => {
    if (!memberToDelete) return
    try {
      setIsSaving(true);
      
      // First, get the current board data
      const { data: currentBoard } = await api.getCurrentBoard();
      
      // Filter out the member to be deleted
      const updatedMembers = currentBoard.members.filter(
        m => m.position !== memberToDelete.position
      );
      
      // Update the board with the filtered members
      await api.createOrUpdateBoard({
        ...currentBoard,
        members: updatedMembers
      });

      // Show success message
      toast({
        title: "Success",
        description: "Board member removed successfully",
      });

      setIsDeleteDialogOpen(false)
      setMemberToDelete(null)

      // Refresh the board data to get the latest from the server
      const { data: updatedBoard } = await api.getCurrentBoard();
      setBoard(updatedBoard);
      
    } catch (error) {
      console.error("Error removing board member:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to remove board member. Please try again.";
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Map backend position to frontend role and department
  const parseBackendPosition = (position) => {
    if (!position) return { role: '', department: '' };
    
    // Handle director positions (e.g., 'director_club_service' -> { role: 'director', department: 'Club Service' })
    if (position.startsWith('director_')) {
      const department = position
        .replace('director_', '')
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return { role: 'director', department };
    }
    
    // Map other positions
    const positionMap = {
      'president': { role: 'president', department: '' },
      'vice_president': { role: 'vice_president', department: '' },
      'secretary': { role: 'secretary', department: '' },
      'joint_secretary': { role: 'joint_secretary', department: '' },
      'treasurer': { role: 'treasurer', department: '' },
      'sergeant_at_arms': { role: 'sergeant', department: '' },
      'editor': { role: 'editor', department: '' },
      'webmaster': { role: 'webmaster', department: '' }
    };
    
    return positionMap[position] || { role: position, department: '' };
  };

  const openEditDialog = (member) => {
    setSelectedMember(member);
    setPhotoFile(null); // Reset photo file when opening the dialog
    // Parse the backend position into role and department
    const { role, department } = parseBackendPosition(member.position);
    
    setFormData({
      name: member.name,
      role: role,
      department: department,
      email: member.email || '',
      phone: member.phone || '',
      photo: member.photo || '',
    });
    
    setIsEditDialogOpen(true);
  }

  const handleBoardUpdate = async (field, value) => {
    try {
      setIsSaving(true)
      const updatedBoard = { ...board, [field]: value }
      await api.createOrUpdateBoard(updatedBoard)
      setBoard(updatedBoard)
      
      toast({
        title: "Success",
        description: "Board updated successfully",
      })
    } catch (error) {
      console.error("Error updating board:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update board",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Board Management</h1>
          <p className="text-muted-foreground">
            {board.rotaractYear} • {board.theme || "No theme set"}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading}>
              <Plus className="mr-2 h-4 w-4" />
              Add Board Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Board Member</DialogTitle>
              <DialogDescription>Add a new member to the board</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Rtr. John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="role">Position</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.role === "director" && (
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="member@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <div className="space-y-2">
                  <Label htmlFor="photo">Photo</Label>
                  <div className="flex items-center gap-4">
                    {formData.photo && (
                      <div className="relative h-16 w-16 overflow-hidden rounded-full border">
                        <img
                          src={getPhotoUrl(formData.photo) || formData.photo}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.error("Image load error:", formData.photo);
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setPhotoFile(file);
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setFormData(prev => ({ ...prev, photo: event.target.result }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Recommended size: 400x400px, JPG, PNG, or WebP. Max 2MB.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAdd} 
                disabled={isSaving || !formData.name || !formData.role}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : 'Add Member'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">
            Current Board {isLoading && "(Loading...)"}
          </TabsTrigger>
          <TabsTrigger value="history">Past Boards</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Board Members</CardTitle>
                  <CardDescription>
                    {board.rotaractYear} • {board.theme || "No theme set"}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const newTheme = prompt("Enter theme:", board.theme);
                      if (newTheme !== null) {
                        handleBoardUpdate("theme", newTheme);
                      }
                    }}
                    disabled={isSaving || isLoading}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {board.theme ? "Edit Theme" : "Set Theme"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isSaving || isLoading}
                    onClick={() => {
                      const description = prompt("Enter theme description:", board.themeDescription || "");
                      if (description !== null) {
                        handleBoardUpdate("themeDescription", description);
                      }
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {board.themeDescription ? "Edit Description" : "Add Description"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {board.members.length > 0 ? (
                      board.members
                        .sort((a, b) => {
                          const positionOrder = { 
                            'president': 1,
                            'vice_president': 2,
                            'secretary': 3,
                            'joint_secretary': 4,
                            'treasurer': 5,
                            'sergeant_at_arms': 6,
                            'director_club_service': 7,
                            'director_community_service': 8,
                            'director_professional_development': 9,
                            'director_international_service': 10,
                            'director_public_relations': 11,
                            'editor': 12,
                            'webmaster': 13
                          };
                          
                          const aOrder = positionOrder[a.position] || 99;
                          const bOrder = positionOrder[b.position] || 99;
                          
                          return aOrder - bOrder || a.name.localeCompare(b.name);
                        })
                        .map((member) => (
                          <TableRow key={member._id || `${member.position}-${member.name}`}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  {member.photo ? (
                                    <AvatarImage 
                                      src={getPhotoUrl(member.photo)} 
                                      alt={member.name}
                                      onError={(e) => {
                                        console.error("Avatar image load error:", member.photo, "Full URL:", getPhotoUrl(member.photo));
                                        // Hide the image and show fallback
                                        e.target.style.display = 'none';
                                        const parent = e.target.closest('.relative') || e.target.parentElement;
                                        if (parent) {
                                          const fallback = parent.querySelector('[class*="AvatarFallback"]');
                                          if (fallback) fallback.style.display = 'flex';
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <AvatarFallback>
                                    {member.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{member.name}</div>
                                  {member.department && (
                                    <div className="text-sm text-muted-foreground">{member.department}</div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getRoleIcon(member.position)}
                                <span>
                                  {member.position 
                                    ? member.position
                                        .split('_')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ')
                                    : 'No position'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">{member.email}</div>
                              <div className="text-sm text-muted-foreground">{member.phone}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(member)}
                                  disabled={isSaving}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setMemberToDelete(member)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                  disabled={isSaving}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No board members added yet. Click "Add Board Member" to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Past Boards</CardTitle>
              <CardDescription>Previous board members and their positions</CardDescription>
            </CardHeader>
            <CardContent>
              {pastBoards.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>President</TableHead>
                      <TableHead>Secretary</TableHead>
                      <TableHead>Treasurer</TableHead>
                      <TableHead>Theme</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastBoards.map((board) => {
                      const president = board.members?.find(m => m.role === 'president')?.name || 'N/A';
                      const secretary = board.members?.find(m => m.role === 'secretary')?.name || 'N/A';
                      const treasurer = board.members?.find(m => m.role === 'treasurer')?.name || 'N/A';
                      
                      return (
                        <TableRow key={board.rotaractYear}>
                          <TableCell className="font-medium">{board.rotaractYear}</TableCell>
                          <TableCell>{president}</TableCell>
                          <TableCell>{secretary}</TableCell>
                          <TableCell>{treasurer}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={board.theme}>
                            {board.theme || 'No theme set'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No past board data available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Board Member</DialogTitle>
            <DialogDescription>Update member details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Position</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.role === "director" && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="space-y-2">
                <Label htmlFor="photo">Photo</Label>
                <div className="flex items-center gap-4">
                  {formData.photo && (
                    <div className="relative h-16 w-16 overflow-hidden rounded-full border">
                      <img
                        src={getPhotoUrl(formData.photo) || formData.photo}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          console.error("Image load error in edit dialog:", formData.photo);
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setPhotoFile(file);
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setFormData(prev => ({ ...prev, photo: event.target.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Recommended size: 400x400px, JPG, PNG, or WebP. Max 2MB.
                    </p>
                  </div>
                </div>
                <Button variant="outline" type="button" disabled>
                  <Upload className="mr-2 h-4 w-4" />
                  {formData.photo ? "Change Photo" : "Upload Photo"}
                </Button>
                {formData.photo && (
                  <span className="text-sm text-muted-foreground">
                    {formData.photo.split("/").pop()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEdit} 
              disabled={isSaving || !formData.name || !formData.role}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open)
        if (!open) setMemberToDelete(null)
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Remove board member</DialogTitle>
            <DialogDescription>
              {memberToDelete
                ? `Are you sure you want to remove ${memberToDelete.name} from the board?`
                : "Are you sure you want to remove this board member?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setMemberToDelete(null)
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
