"use client"

import { useEffect } from "react"
import { useClubSettings } from "@/contexts/club-settings-context"

export function DynamicTitle() {
  const { settings } = useClubSettings()

  useEffect(() => {
    if (settings?.clubName) {
      document.title = `${settings.clubName} | Rotaract Club Management System`
    } else {
      document.title = "Rotaract Club Management System"
    }
  }, [settings?.clubName])

  return null
}

