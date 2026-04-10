"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LogIn, AlertCircle, Eye, EyeOff } from "lucide-react"
import api from "@/lib/api"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    memberId: "",
    password: "",
  })
  const [hasChangedPassword, setHasChangedPassword] = useState(null) // null = not checked, true/false = checked
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  // Check login status when email changes
  useEffect(() => {
    const checkLoginStatus = async () => {
      if (!formData.email || !formData.email.includes("@")) {
        setHasChangedPassword(null)
        return
      }

      setIsCheckingStatus(true)
      try {
        const response = await api.checkLoginStatus(formData.email)
        if (response.data.exists) {
          setHasChangedPassword(response.data.hasChangedPassword)
        } else {
          // User doesn't exist, default to first-time login (memberId mode)
          setHasChangedPassword(false)
        }
      } catch (err) {
        // If check fails, assume not changed (for first-time users)
        setHasChangedPassword(false)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    // Debounce the check
    const timeoutId = setTimeout(checkLoginStatus, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (hasChangedPassword) {
        // Login using email/username and password
        await login({
          email: formData.email,
          password: formData.password,
        })
      } else {
        // Login using email and memberId (first-time login)
      await login({
        email: formData.email,
        memberId: formData.memberId,
      })
      }
      router.push("/dashboard")
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="w-full max-w-md">
      <Card className="bg-card border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Member Login</CardTitle>
          <CardDescription>Welcome back! Sign in to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email / Username</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                className="bg-secondary border-border"
              />
            </div>

            {hasChangedPassword === null && formData.email && isCheckingStatus && (
              <div className="text-xs text-muted-foreground animate-pulse">
                Checking login status...
              </div>
            )}

            {hasChangedPassword === false && (
            <div className="space-y-2">
                <Label htmlFor="memberId">Member ID (Temporary Password)</Label>
              <Input
                id="memberId"
                name="memberId"
                type="text"
                value={formData.memberId}
                onChange={handleChange}
                placeholder="RCAIHT-XXXX"
                required
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">
                Enter your Member ID from the welcome email to login
              </p>
            </div>
            )}

            {hasChangedPassword === true && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    className="bg-secondary border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your password to login
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || hasChangedPassword === null || isCheckingStatus}
            >
              {isLoading ? (
                "Signing in..."
              ) : isCheckingStatus ? (
                "Checking..."
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>
          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Don't have an account? Contact your club admin to get your Member ID.
            </span>
          </div>
          <Link href="/admin-login" className="text-xs text-muted-foreground hover:text-primary text-center">
            Admin Login (Treasurer/President/Secretary)
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
