"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"

function ApproveEmailChangeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState("loading")
  const [message, setMessage] = useState("Approving email change...")

  useEffect(() => {
    const approve = async () => {
      const token = searchParams.get("token")
      if (!token) {
        setStatus("error")
        setMessage("Invalid approval link.")
        return
      }

      try {
        const response = await api.approveEmailChange(token)
        setStatus("success")
        setMessage(response.message || "Email changed successfully.")
      } catch (error) {
        setStatus("error")
        setMessage(error.message || "Failed to approve email change.")
      }
    }

    approve()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader>
          <CardTitle>Email Change Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          {status !== "loading" && (
            <Button className="w-full" onClick={() => router.push("/admin-login")}>
              Go to Admin Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ApproveEmailChangePage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen flex items-center justify-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
       </div>
    }>
      <ApproveEmailChangeContent />
    </Suspense>
  )
}

