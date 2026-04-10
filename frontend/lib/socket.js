import { io } from "socket.io-client"

let socket = null

export const getSocket = () => {
  if (typeof window === "undefined") return null

  if (!socket) {
    const token = window.localStorage.getItem("accessToken")
    if (!token) return null

    socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      auth: { token },
      withCredentials: true,
    })
  }

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}


