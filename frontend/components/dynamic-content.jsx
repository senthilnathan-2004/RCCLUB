"use client"

import { useClubSettings } from "@/contexts/club-settings-context"

export function DynamicContent({ field, defaultText, as: Component = "span", ...props }) {
  const { settings, loading } = useClubSettings()

  let text = defaultText
  if (!loading && settings && settings[field]) {
    text = settings[field]
  }

  // Handle multi-line text if component is 'p' or 'div' by rendering white-space pre-line
  if (Component === "p" || Component === "div") {
    props.style = { ...props.style, whiteSpace: "pre-line" }
  }

  return <Component {...props}>{text}</Component>
}
