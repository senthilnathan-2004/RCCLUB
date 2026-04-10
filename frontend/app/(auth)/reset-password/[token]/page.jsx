"use client"

import { useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react"
import api from "@/lib/api"

export default function ResetPasswordPage({ params }) {
  const unwrappedParams = use(params)
  const token = unwrappedParams.token
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirm: false,
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    setIsLoading(true)

    try {
      const response = await api.resetPassword(token, formData.password)
      setSuccess(response.message || "Password reset successfully. You can now log in.")
      setFormData({ password: "", confirmPassword: "" })
      // Delay navigation a bit so they can read the success message
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err) {
      setError(err.message || "Failed to reset password. The link might be invalid or expired.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="w-full max-w-md">
      <Card className="bg-card border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create New Password</CardTitle>
          <CardDescription>
            Please enter your new password below.
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
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPasswords.password ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    required
                    className="bg-secondary border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => ({ ...p, password: !p.password }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    className="bg-secondary border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  "Resetting..."
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" /> Reset Password
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
        {success && (
          <CardFooter className="flex justify-center">
            <Link href="/login" className="flex items-center text-sm text-primary hover:underline">
              Go to Login
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
