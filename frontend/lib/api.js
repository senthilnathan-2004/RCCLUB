const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL
  }

  async request(endpoint, options = {}, hasRetried = false) {
    const url = `${this.baseUrl}${endpoint}`
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete config.headers["Content-Type"]
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        // Try one-time token refresh only when access token expired
        if (
          response.status === 401 &&
          !hasRetried &&
          endpoint !== "/auth/refresh-token" &&
          data?.code === "TOKEN_EXPIRED" &&
          typeof window !== "undefined"
        ) {
          const storedRefreshToken = localStorage.getItem("refreshToken")
          if (storedRefreshToken) {
            try {
              const refreshResponse = await fetch(`${this.baseUrl}/auth/refresh-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: storedRefreshToken }),
              })
              const refreshData = await refreshResponse.json()

              if (refreshResponse.ok && refreshData?.data?.accessToken) {
                localStorage.setItem("accessToken", refreshData.data.accessToken)
                if (refreshData.data.refreshToken) {
                  localStorage.setItem("refreshToken", refreshData.data.refreshToken)
                }
                return this.request(endpoint, options, true)
              }
            } catch {
              // Fall through to forced logout below
            }
          }
        }

        // Force logout on invalid session (e.g., password changed)
        if (
          response.status === 401 &&
          typeof window !== "undefined" &&
          (
            data?.message?.includes("Password was recently changed") ||
            data?.message?.includes("Please login again") ||
            data?.message?.includes("Token has expired")
          )
        ) {
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          const isAdminRoute = window.location.pathname.startsWith("/admin")
          window.location.href = isAdminRoute ? "/admin-login" : "/login"
          return
        }

        const error = new Error(data.message || "Something went wrong")
        // Attach validation errors if they exist
        if (data.errors && Array.isArray(data.errors)) {
          error.errors = data.errors
        }
        throw error
      }

      return data
    } catch (error) {
      throw error
    }
  }

  // Event endpoints
  async getEvents() {
    return this.request(`/events`)
  }

  async getEventById(id) {
    return this.request(`/events/${id}`)
  }

  async createEvent(eventData) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  async updateEvent(id, eventData) {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  async deleteEvent(id) {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    })
  }

  async addEventGalleryImages(id, images) {
    const formData = new FormData()
    Array.from(images).forEach((image) => {
      formData.append('gallery', image)
    })
    return this.request(`/events/${id}/gallery`, {
      method: 'POST',
      body: formData,
    })
  }

  // Auth endpoints
  async login(credentials) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async adminLogin(credentials) {
    return this.request("/auth/admin-login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async logout() {
    return this.request("/auth/logout", { method: "POST" })
  }

  async getMe() {
    return this.request("/auth/me")
  }

  async checkLoginStatus(email) {
    return this.request(`/auth/check-login-status?email=${encodeURIComponent(email)}`)
  }

  async forgotPassword(email) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token, password) {
    return this.request(`/auth/reset-password/${token}`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    })
  }

  async changePassword(passwords) {
    return this.request("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(passwords),
    })
  }

  async requestEmailChange(data) {
    return this.request("/auth/email-change/request", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async approveEmailChange(token) {
    return this.request("/auth/email-change/approve", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
  }

  // Member endpoints
  async getMemberDashboard() {
    return this.request("/members/dashboard")
  }

  async getMemberProfile() {
    return this.request("/members/profile")
  }

  async updateMemberProfile(data) {
    return this.request("/members/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async updateProfilePhoto(formData) {
    return this.request("/members/profile/photo", {
      method: "PUT",
      body: formData,
    })
  }

  async getMemberExpenses(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/members/expenses${query ? `?${query}` : ""}`)
  }

  async getMemberExpense(id) {
    return this.request(`/members/expenses/${id}`)
  }

  // Expense endpoints
  async submitExpense(formData) {
    return this.request("/expenses", {
      method: "POST",
      body: formData,
    })
  }

  async getExpense(id) {
    return this.request(`/expenses/${id}`)
  }

  async getAllExpenses(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/expenses/all${query ? `?${query}` : ""}`)
  }

  async updateExpense(id, data) {
    return this.request(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async approveExpense(id) {
    return this.request(`/expenses/${id}/approve`, { method: "PUT" })
  }

  async rejectExpense(id, reason) {
    return this.request(`/expenses/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    })
  }

  async reimburseExpense(id) {
    return this.request(`/expenses/${id}/reimburse`, { method: "PUT" })
  }

  async deleteExpense(id) {
    return this.request(`/expenses/${id}`, { method: "DELETE" })
  }

  async addManualExpense(data) {
    // If data is FormData, don't stringify it
    if (data instanceof FormData) {
      return this.request("/expenses/manual", {
        method: "POST",
        body: data,
      })
    }
    // Otherwise, stringify JSON
    return this.request("/expenses/manual", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Event endpoints
  async getEvents(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/events${query ? `?${query}` : ""}`)
  }

  async getEventsDropdown() {
    return this.request("/events/dropdown")
  }

  async getEvent(id) {
    return this.request(`/events/${id}`)
  }

  async createEvent(data) {
    return this.request("/events", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateEvent(id, data) {
    return this.request(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteEvent(id) {
    return this.request(`/events/${id}`, { method: "DELETE" })
  }

  async addEventGallery(id, formData) {
    return this.request(`/events/${id}/gallery`, {
      method: "POST",
      body: formData,
    })
  }

  // Admin endpoints
  async getAdminDashboard() {
    return this.request("/admin/dashboard")
  }

  async getAdminMessages() {
    return this.request("/admin/messages")
  }

  async replyToMessage(id, replyMessage) {
    return this.request(`/admin/messages/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ replyMessage }),
    })
  }

  async deleteMessage(id) {
    return this.request(`/admin/messages/${id}`, {
      method: "DELETE",
    })
  }

  async getAllMembers(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/admin/members${query ? `?${query}` : ""}`)
  }

  async getMembersDropdown() {
    return this.request("/admin/members/dropdown")
  }

  async getMember(id) {
    return this.request(`/admin/members/${id}`)
  }

  async addMember(data) {
    return this.request("/admin/members", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateMember(id, data) {
    return this.request(`/admin/members/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async changeMemberRole(id, role) {
    return this.request(`/admin/members/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    })
  }

  async markAsAlumni(id) {
    return this.request(`/admin/members/${id}/alumni`, { method: "PUT" })
  }

  async deleteMember(id) {
    return this.request(`/admin/members/${id}`, { method: "DELETE" })
  }

  // Board endpoints
  async getCurrentBoard() {
    return this.request("/board")
  }

  async getBoardHistory() {
    return this.request("/board/history")
  }

  async getBoardByYear(year) {
    return this.request(`/board/${year}`)
  }

  async createOrUpdateBoard(data) {
    return this.request("/board", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateBoardMember(data) {
    if (data instanceof FormData) {
      return this.request("/board/member", {
        method: "PUT",
        body: data,
      })
    }
    return this.request("/board/member", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Settings endpoints
  async getSettings() {
    return this.request("/settings")
  }

  async updateSettings(data) {
    return this.request("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async updateLogos(formData) {
    return this.request("/settings/logos", {
      method: "PUT",
      body: formData,
    })
  }

  // Report endpoints
  async getFinancialSummary(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/reports/financial-summary${query ? `?${query}` : ""}`)
  }

  async getMemberWiseReport(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/reports/member-wise${query ? `?${query}` : ""}`)
  }

  async getEventWiseReport(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/reports/event-wise${query ? `?${query}` : ""}`)
  }

  async getLeaderboard() {
    return this.request("/reports/leaderboard")
  }

  async exportPDF(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/reports/export/pdf${query ? `?${query}` : ""}`)
  }

  async exportExcel(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/reports/export/excel${query ? `?${query}` : ""}`)
  }

  async exportBillsZip(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/reports/export/bills${query ? `?${query}` : ""}`)
  }

  // Archive endpoints
  async getArchives() {
    return this.request("/archive")
  }

  async getArchiveByYear(year) {
    return this.request(`/archive/${year}`)
  }

  async closeYear(data = {}) {
    return this.request("/archive/close-year", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async startNewYear(data) {
    return this.request("/archive/start-new-year", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async addArchiveFile(year, formData) {
    return this.request(`/archive/${year}/files`, {
      method: "POST",
      body: formData,
    })
  }

  // Public endpoints
  async getHomepage() {
    return this.request("/public/homepage")
  }

  async getAboutRotaract() {
    return this.request("/public/about-rotaract")
  }

  async getAboutClub() {
    return this.request("/public/about-club")
  }

  async getPublicGallery() {
    return this.request("/public/gallery")
  }

  async getPublicEvents(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/public/gallery${query ? `?${query}` : ""}`)
  }

  async getPublicEvent(id) {
    return this.request(`/public/events/${id}`)
  }

  async getContactInfo() {
    return this.request("/public/contact")
  }

  async sendContactMessage(data) {
    return this.request("/public/contact/message", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getPublicBoard() {
    return this.request("/public/board")
  }
}

export const api = new ApiService()
export default api
