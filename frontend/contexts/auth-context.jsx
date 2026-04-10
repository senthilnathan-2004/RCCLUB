"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        setLoading(false)
        return
      }
      const response = await api.getMe()
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (credentials) => {
    const response = await api.login(credentials)
    localStorage.setItem("accessToken", response.data.accessToken)
    localStorage.setItem("refreshToken", response.data.refreshToken)
    setUser(response.data.user)
    return response
  }

  const adminLogin = async (credentials) => {
    const response = await api.adminLogin(credentials)
    localStorage.setItem("accessToken", response.data.accessToken)
    localStorage.setItem("refreshToken", response.data.refreshToken)
    setUser(response.data.user)
    return response
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      setUser(null)
      router.push("/")
    }
  }

  const isAdmin = user?.role && ["treasurer", "president", "secretary", "faculty_coordinator"].includes(user.role)
  const isTreasurer = user?.role === "treasurer"
  const isPresident = user?.role === "president"

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        adminLogin,
        logout,
        checkAuth,
        isAdmin,
        isTreasurer,
        isPresident,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
