"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react"
import api from "@/lib/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const response = await api.forgotPassword(email)
      setSuccess(response.message || "A password reset link has been sent to your email.")
      setEmail("") // Clear the field on success
    } catch (err) {
      setError(err.message || "Failed to process your request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card className="bg-card border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your registered email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert className="border-success bg-success/10 mb-4">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">{success}</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="bg-secondary border-border"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !email}>
                {isLoading ? (
                  "Sending..."
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" /> Send Reset Link
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="flex items-center text-sm text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
