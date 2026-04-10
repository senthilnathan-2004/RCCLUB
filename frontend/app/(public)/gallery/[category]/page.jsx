"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import api from "@/lib/api"
import Link from "next/link"

export default function AlbumDetailPage() {
  const params = useParams()
  const router = useRouter()
  const category = decodeURIComponent(params.category)
  
  const [images, setImages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const response = await api.request("/gallery/public")
      // Filter images by the category from URL
      const filtered = (response.data || []).filter(img => (img.category || "General") === category)
      setImages(filtered)
    } catch (err) {
      console.error("Failed to fetch album images:", err)
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

  const openLightbox = (index) => {
    setSelectedImageIndex(index)
  }

  const closeLightbox = () => {
    setSelectedImageIndex(null)
  }

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <section className="py-12 border-b border-border">
        <div className="container px-4">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/gallery">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl capitalize">
            {category} <span className="text-primary font-normal text-xl ml-2">({images.length} photos)</span>
          </h1>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 flex-1">
        <div className="container px-4">
          {images.length > 0 ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {images.map((img, index) => (
                <Card 
                  key={index} 
                  className="aspect-square relative overflow-hidden group cursor-pointer border-none bg-secondary/20"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={getImageUrl(img.url)}
                    alt={img.caption || category}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-xs px-2 text-center line-clamp-2">{img.caption}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="text-muted-foreground">This album is empty.</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Dialog */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-4xl bg-black/95 p-0 border-none z-[100] h-[90vh] flex flex-col justify-center">
          <DialogHeader className="sr-only">
            <DialogTitle>{category} Image</DialogTitle>
            <DialogDescription>Viewing image from {category}</DialogDescription>
          </DialogHeader>
          
          {selectedImageIndex !== null && (
            <div className="relative w-full h-full flex items-center justify-center p-4">
               <img
                  src={getImageUrl(images[selectedImageIndex].url)}
                  alt={images[selectedImageIndex].caption || category}
                  className="max-w-full max-h-[75vh] object-contain shadow-2xl"
                />
                
                {images.length > 1 && (
                  <>
                    <button
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </button>
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </button>
                  </>
                )}
                
                <div className="absolute bottom-6 left-0 right-0 text-center px-12">
                   <p className="text-white text-lg font-medium drop-shadow-md">
                     {images[selectedImageIndex].caption || ""}
                   </p>
                   <p className="text-white/60 text-sm mt-1">
                     {selectedImageIndex + 1} of {images.length}
                   </p>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
