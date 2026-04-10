"use client"

import { useState, useEffect } from "react"
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
import { Plus, MoreHorizontal, Edit, Trash2, Calendar, MapPin, Users, IndianRupee, Image as ImageIcon } from "lucide-react"
import api from "@/lib/api"

const eventCategories = [
  { value: "community_service", label: "Community Service" },
  { value: "professional_development", label: "Professional Development" },
  { value: "international_service", label: "International Service" },
  { value: "club_service", label: "Club Service" },
  { value: "fundraising", label: "Fundraising" },
  { value: "social", label: "Social" },
  { value: "installation", label: "Installation" },
  { value: "other", label: "Other" },
]

// Event status options
const eventStatuses = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

// Rotaract year options (last 3 years and next year)
const getRotaractYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 2; i >= 0; i--) {
    years.push(`${currentYear - i}-${currentYear - i + 1}`);
  }
  years.push(`${currentYear}-${currentYear + 1}`);
  return years;
};

export default function EventManagementPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [dialogType, setDialogType] = useState(null) // 'add' | 'edit' | 'delete'
  
  // Initialize with default values for all fields
  const initialFormData = {
    name: "",
    category: "community_service",
    startDate: "",
    endDate: "",
    venue: {
      name: "",
      address: "",
      city: ""
    },
    estimatedBudget: "0",
    actualSpending: "0",
    attendees: "0",
    description: "",
    tags: [],
    rotaractYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    status: "upcoming",
    videoLinks: [],
    gallery: [],
    volunteers: []
  };

  const [formData, setFormData] = useState(initialFormData);
  const [actionLoading, setActionLoading] = useState(false)
  const [uploadFiles, setUploadFiles] = useState([])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.getEvents()
        // Map the API response to match our component's expected format
        const formattedEvents = response.data?.map(event => ({
          id: event._id,
          name: event.name,
          category: event.category,
          startDate: event.startDate,
          endDate: event.endDate,
          venue: event.venue || { name: '', address: '', city: '' },
          estimatedBudget: event.estimatedBudget,
          actualSpending: event.actualSpending || 0,
          attendees: event.attendees || 0,
          description: event.description || '',
          status: event.status || 'upcoming',
          rotaractYear: event.rotaractYear,
          tags: event.tags || [],
          videoLinks: event.videoLinks || [],
          gallery: event.gallery || [],
          volunteers: event.volunteers || [],
          createdBy: event.createdBy,
          isArchived: event.isArchived || false,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt
        }));
        
        setEvents(formattedEvents || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [])

  const getCategoryLabel = (category) => {
    return eventCategories.find((c) => c.value === category)?.label || category
  }

  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const openDialog = (event, type) => {
    setSelectedEvent(event);
    setDialogType(type);
    
    if (type === "edit" && event) {
      // Map the event data to form data
      setFormData({
        ...initialFormData, // Start with defaults
        ...event, // Override with event data
        // Ensure proper formatting of dates and numbers
        startDate: event.startDate ? formatDateForInput(event.startDate) : "",
        endDate: event.endDate ? formatDateForInput(event.endDate) : "",
        venue: {
          ...initialFormData.venue,
          ...(event.venue || {})
        },
        estimatedBudget: event.estimatedBudget?.toString() || "0",
        actualSpending: event.actualSpending?.toString() || "0",
        attendees: event.attendees?.toString() || "0",
        // Ensure arrays are properly set
        tags: Array.isArray(event.tags) ? event.tags : [],
        videoLinks: Array.isArray(event.videoLinks) ? event.videoLinks : [],
        gallery: Array.isArray(event.gallery) ? event.gallery : [],
        volunteers: Array.isArray(event.volunteers) ? event.volunteers : []
      });
    } else if (type === "add") {
      // Reset to initial values for a new event
      setFormData({
        ...initialFormData,
        status: "upcoming",
        category: "community_service",
        rotaractYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
      });
    }
  }

  const closeDialog = () => {
    setSelectedEvent(null)
    setDialogType(null)
    setUploadFiles([])
  }

  const handleSaveEvent = async () => {
    setActionLoading(true);
    try {
      // Format dates to ISO strings for backend
      const formatDateForBackend = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString();
      };

      // Prepare event data for API
      const eventData = {
        name: (formData.name || '').trim(),
        category: formData.category || 'community_service',
        startDate: formatDateForBackend(formData.startDate) || new Date().toISOString(),
        endDate: formatDateForBackend(formData.endDate) || new Date().toISOString(),
        description: formData.description || '',
        venue: {
          name: formData.venue?.name || '',
          address: formData.venue?.address || '',
          city: formData.venue?.city || ''
        },
        estimatedBudget: Number(formData.estimatedBudget) || 0,
        actualSpending: Number(formData.actualSpending) || 0,
        attendees: Number(formData.attendees) || 0,
        rotaractYear: formData.rotaractYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        status: formData.status || 'upcoming',
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        videoLinks: Array.isArray(formData.videoLinks) ? formData.videoLinks : [],
        gallery: Array.isArray(formData.gallery) ? formData.gallery : [],
        volunteers: Array.isArray(formData.volunteers) ? formData.volunteers : []
      };

      if (dialogType === "add") {
        const response = await api.createEvent(eventData);
        // Convert the response data to match our frontend format
        const newEvent = {
          ...response.data,
          id: response.data._id,
          venue: response.data.venue || { name: '', address: '', city: '' },
          actualSpending: response.data.actualSpending || 0,
          tags: response.data.tags || [],
          videoLinks: response.data.videoLinks || [],
          gallery: response.data.gallery || [],
          volunteers: response.data.volunteers || [],
          estimatedBudget: response.data.estimatedBudget || 0,
          attendees: response.data.attendees || 0,
          status: response.data.status || 'upcoming'
        };
        setEvents((prev) => [...prev, newEvent]);
      } else {
        await api.updateEvent(selectedEvent.id, eventData);
        setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? { ...e, ...eventData } : e)));
      }
      closeDialog()
    } catch (error) {
      console.error("Error saving event:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteEvent = async () => {
    setActionLoading(true)
    try {
      await api.deleteEvent(selectedEvent.id)
      setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id))
      closeDialog()
    } catch (error) {
      console.error("Error deleting event:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUploadGallery = async () => {
    if (uploadFiles.length === 0) return;
    setActionLoading(true)
    try {
      const data = new FormData();
      uploadFiles.forEach(file => {
        data.append("gallery", file);
      });
      const response = await api.request(`/events/${selectedEvent.id}/gallery`, {
        method: "POST",
        body: data,
      });
      
      const newGallery = response.data || [];
      // If no cover image exists, the backend might handle it or frontend can just rely on gallery. public gallery aggregates them.
      setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? { ...e, gallery: newGallery } : e)));
      closeDialog();
    } catch (err) {
      console.error("Failed to upload gallery:", err);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">Manage club events and activities</p>
        </div>
        <Button onClick={() => openDialog(null, "add")}>
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </div>

      {/* Events Table */}
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
                    <TableHead>Event</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id} className="border-border">
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" /> {event.attendees} attendees
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary text-primary">
                          {getCategoryLabel(event.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(event.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {event.venue?.name || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className="flex items-center">
                          <IndianRupee className="h-3 w-3 mr-0.5" />
                          {event.estimatedBudget ? Number(event.estimatedBudget).toLocaleString("en-IN") : '0'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem onClick={() => openDialog(event, "edit")}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDialog(event, "gallery")}>
                              <ImageIcon className="mr-2 h-4 w-4" /> Manage Album
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDialog(event, "delete")}
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

      {/* Add/Edit Event Dialog */}
      <Dialog open={dialogType === "add" || dialogType === "edit"} onOpenChange={closeDialog}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogType === "add" ? "Add New Event" : "Edit Event"}</DialogTitle>
            <DialogDescription>
              {dialogType === "add" ? "Create a new club event" : "Update event details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {eventCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="venueName">Venue Name</Label>
                <Input
                  id="venueName"
                  value={formData.venue?.name || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    venue: { ...formData.venue, name: e.target.value }
                  })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venueAddress">Venue Address</Label>
                <Input
                  id="venueAddress"
                  value={formData.venue?.address || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    venue: { ...formData.venue, address: e.target.value }
                  })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venueCity">City</Label>
                <Input
                  id="venueCity"
                  value={formData.venue?.city || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    venue: { ...formData.venue, city: e.target.value }
                  })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rotaractYear">Rotaract Year</Label>
                <Input
                  id="rotaractYear"
                  value={formData.rotaractYear}
                  onChange={(e) => setFormData({ ...formData, rotaractYear: e.target.value })}
                  className="bg-secondary border-border"
                  placeholder="YYYY-YYYY"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estimatedBudget">Estimated Budget (INR)</Label>
                <Input
                  id="estimatedBudget"
                  type="number"
                  value={formData.estimatedBudget}
                  onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendees">Attendees</Label>
                <Input
                  id="attendees"
                  type="number"
                  min="0"
                  value={formData.attendees}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    attendees: e.target.value === '' ? '' : e.target.value.replace(/\D/g, '')
                  })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="bg-secondary border-border resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveEvent} disabled={actionLoading}>
              {actionLoading ? "Saving..." : dialogType === "add" ? "Create Event" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialogType === "delete"} onOpenChange={closeDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedEvent?.name}"? This will also remove all associated expenses and
              data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEvent} disabled={actionLoading}>
              {actionLoading ? "Deleting..." : "Delete Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gallery Dialog */}
      <Dialog open={dialogType === "gallery"} onOpenChange={closeDialog}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Event Album - {selectedEvent?.name}</DialogTitle>
            <DialogDescription>
              Upload images to create an event album. The first image uploaded behaves as the cover.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Images</Label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setUploadFiles(Array.from(e.target.files))}
                className="bg-secondary border-border"
              />
              {uploadFiles.length > 0 && (
                <p className="text-sm text-muted-foreground">{uploadFiles.length} file(s) selected.</p>
              )}
            </div>
            {selectedEvent?.gallery?.length > 0 && (
               <div className="mt-4">
                 <p className="font-semibold text-sm mb-2">Existing Photos ({selectedEvent.gallery.length})</p>
                 <div className="max-h-40 overflow-y-auto grid grid-cols-4 gap-2 border border-border p-2 rounded-md bg-secondary/50">
                    {selectedEvent.gallery.map((g, i) => {
                      let url = g.url;
                      if (!url.startsWith('http')) {
                        let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
                        if (baseUrl.endsWith("/api")) baseUrl = baseUrl.replace(/\/api$/, "");
                        url = `${baseUrl}${url}`;
                      }
                      return (
                        <div key={i} className="aspect-square bg-secondary rounded overflow-hidden">
                          <img src={url} alt="Gallery item" className="w-full h-full object-cover" />
                        </div>
                      )
                    })}
                 </div>
               </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleUploadGallery} disabled={actionLoading || uploadFiles.length === 0}>
                 {actionLoading ? "Uploading..." : "Upload Photos"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
