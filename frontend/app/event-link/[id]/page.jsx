"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function EventSmartLinkPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id
  const { loading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (loading) return

    if (isAuthenticated) {
      router.replace(`/dashboard/events?event=${eventId}`)
      return
    }

    router.replace(`/events/${eventId}`)
  }, [loading, isAuthenticated, eventId, router])

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}
