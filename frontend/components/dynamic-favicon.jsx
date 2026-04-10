"use client"

import { useEffect } from "react"
import { useClubSettings } from "@/contexts/club-settings-context"

export function DynamicFavicon() {
  const { settings, getLogoSrc } = useClubSettings()

  useEffect(() => {
    const faviconUrl = getLogoSrc(settings?.clubLogo)
    if (!faviconUrl) return

    const updateLink = (relValue) => {
      let link = document.querySelector(`link[rel='${relValue}']`)
      if (!link) {
        link = document.createElement("link")
        link.setAttribute("rel", relValue)
        document.head.appendChild(link)
      }
      link.setAttribute("href", faviconUrl)
    }

    updateLink("icon")
    updateLink("shortcut icon")
    updateLink("apple-touch-icon")
  }, [settings?.clubLogo, getLogoSrc])

  return null
}

