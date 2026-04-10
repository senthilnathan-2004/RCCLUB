"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"

export default function GalleryPage() {
  const [generalImages, setGeneralImages] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await api.request("/gallery/public")
      setGeneralImages(response.data || [])
    } catch (err) {
      console.error("Failed to fetch gallery data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const getImageUrl = (path) => {
    if (!path) return "/placeholder.svg"
    if (path.startsWith("http")) return path
    let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
    if (apiBaseUrl.endsWith("/api")) {
      apiBaseUrl = apiBaseUrl.replace(/\/api$/, "")
    }
    return `${apiBaseUrl}${path}`
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const categorizedAlbums = generalImages.reduce((acc, img) => {
    const album = img.category || "General";
    if (!acc[album]) acc[album] = [];
    acc[album].push(img);
    return acc;
  }, {});

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Club <span className="text-primary">Gallery</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Explore our journey through service, leadership, and community impact.
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Content */}
      <section className="py-16">
        <div className="container px-4">
          {generalImages.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(categorizedAlbums).map(([albumName, albumImages]) => (
                <Link key={albumName} href={`/gallery/${encodeURIComponent(albumName)}`}>
                  <Card className="bg-card border-border overflow-hidden group cursor-pointer h-full">
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={getImageUrl(albumImages[0].url)}
                        alt={albumName}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-background/80">
                          {albumImages.length} photos
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-semibold text-lg text-foreground truncate drop-shadow-md">{albumName}</h3>
                        <p className="text-xs text-muted-foreground mt-1">Click to view all photos</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No photos in the gallery yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
