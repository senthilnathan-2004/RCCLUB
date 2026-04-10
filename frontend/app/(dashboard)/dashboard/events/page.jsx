"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar, MapPin, PlusCircle, Search, Users } from "lucide-react"
import api from "@/lib/api"
import { getSocket } from "@/lib/socket"

const statusStyle = {
  upcoming: "border-primary text-primary",
  ongoing: "border-success text-success",
  completed: "border-muted-foreground text-muted-foreground",
  cancelled: "border-destructive text-destructive",
}

export default function MemberEventsPage() {
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await api.getEvents({ limit: 100 })
      const list = Array.isArray(response.data) ? response.data : []
      setEvents(list)
    } catch (error) {
      console.error("Error fetching events:", error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()

    const socket = getSocket()
    if (socket) {
      socket.on("new_event_added", () => {
        fetchEvents()
      })
    }

    return () => {
      if (socket) {
        socket.off("new_event_added")
      }
    }
  }, [])

  const filteredEvents = useMemo(() => {
    if (!search.trim()) return events
    const query = search.toLowerCase()
    return events.filter((event) => {
      const name = event.name?.toLowerCase() || ""
      const category = event.category?.toLowerCase() || ""
      return name.includes(query) || category.includes(query)
    })
  }, [events, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">All Events</h1>
          <p className="text-muted-foreground">Pick an event and submit your expense directly.</p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by event name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">No events found.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((event) => (
            <Card key={event._id} className="bg-card border-border">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{event.name}</CardTitle>
                  <Badge variant="outline" className={statusStyle[event.status] || statusStyle.upcoming}>
                    {event.status}
                  </Badge>
                </div>
                <Badge variant="secondary" className="w-fit capitalize">
                  {event.category?.replaceAll("_", " ")}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(event.endDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {event.venue?.name || event.venue?.city || "Venue not specified"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {event.attendees || 0} attendees
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3">
                  {event.description || "No event description available."}
                </p>

                {Array.isArray(event.tags) && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {event.tags.slice(0, 5).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button className="w-full" asChild>
                  <Link href={`/dashboard/expenses/new?event=${event._id}`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Submit Expense
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
