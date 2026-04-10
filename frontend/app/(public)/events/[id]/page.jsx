"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react"
import api from "@/lib/api"

const categoryLabels = {
  community_service: "Community Service",
  professional_development: "Professional Development",
  international_service: "International Service",
  club_service: "Club Service",
  fundraising: "Fundraising",
  social: "Social",
  installation: "Installation",
  other: "Other",
}

const statusLabels = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
}

export default function PublicEventDetailPage() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        setError("")
        const response = await api.getPublicEvent(id)
        setEvent(response.data || null)
      } catch (err) {
        console.error("Error fetching public event:", err)
        setError("Unable to load event details.")
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchEvent()
  }, [id])

  if (loading) {
    return (
      <div className="container px-4 py-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="container px-4 py-16 space-y-4">
        <Button variant="outline" className="bg-transparent" asChild>
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        <p className="text-muted-foreground">{error || "Event not found."}</p>
      </div>
    )
  }

  const startDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not available"

  const endDate = event.endDate
    ? new Date(event.endDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : startDate

  const venueText = event.venue
    ? [event.venue.name, event.venue.address, event.venue.city].filter(Boolean).join(", ")
    : "Venue not specified"

  return (
    <div className="container px-4 py-8 lg:py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="outline" className="bg-transparent" asChild>
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>

        <Card className="bg-card border-border">
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{categoryLabels[event.category] || event.category}</Badge>
              {event.status && <Badge variant="secondary">{statusLabels[event.status] || event.status}</Badge>}
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl lg:text-3xl font-bold leading-tight">{event.name}</h1>
              <p className="text-muted-foreground leading-relaxed">
                {event.description || "No description available."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                <p className="text-xs text-muted-foreground mb-1">Date</p>
                <p className="font-medium flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>
                    {startDate}
                    {endDate !== startDate ? ` - ${endDate}` : ""}
                  </span>
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                <p className="text-xs text-muted-foreground mb-1">Venue</p>
                <p className="font-medium flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>{venueText}</span>
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                <p className="text-xs text-muted-foreground mb-1">Attendees</p>
                <p className="font-medium flex items-start gap-2">
                  <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>{event.attendees || 0} members joined</span>
                </p>
              </div>
            </div>

            {Array.isArray(event.tags) && event.tags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
