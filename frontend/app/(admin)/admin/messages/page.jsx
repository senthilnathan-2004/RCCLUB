"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Mail, Phone, User, Trash2, Send } from "lucide-react"
import api from "@/lib/api"
import { getSocket } from "@/lib/socket"

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [sending, setSending] = useState(false)

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await api.getAdminMessages()
      setMessages(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Failed to load messages:", error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()

    const socket = getSocket()
    if (socket) {
      socket.on("new_contact_message", () => {
        loadMessages()
      })
      socket.on("contact_message_updated", () => {
        loadMessages()
      })
    }

    return () => {
      if (socket) {
        socket.off("new_contact_message")
        socket.off("contact_message_updated")
      }
    }
  }, [])

  const handleReply = async () => {
    if (!selectedMessage?._id || !replyMessage.trim()) return
    try {
      setSending(true)
      await api.replyToMessage(selectedMessage._id, replyMessage.trim())
      setReplyMessage("")
      setSelectedMessage(null)
      await loadMessages()
    } catch (error) {
      console.error("Failed to send reply:", error)
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    try {
      await api.deleteMessage(id)
      setMessages((prev) => prev.filter((msg) => msg._id !== id))
      if (selectedMessage?._id === id) {
        setSelectedMessage(null)
      }
    } catch (error) {
      console.error("Failed to delete message:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contact Messages</h1>
        <p className="text-muted-foreground">View and reply to website contact form submissions.</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-28">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-semibold">{msg.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <Badge variant={msg.status === "replied" ? "secondary" : "outline"}>
                    {msg.status === "replied" ? "Replied" : "New"}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4" /> {msg.name}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {msg.email}
                  </p>
                  {msg.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" /> {msg.phone}
                    </p>
                  )}
                </div>

                <p className="text-sm border-l-2 border-primary/20 pl-3 italic text-muted-foreground/90 mb-4">{msg.message}</p>

                {msg.replies && msg.replies.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Reply History</p>
                    {msg.replies.map((reply, idx) => (
                      <div key={idx} className="bg-secondary/40 p-3 rounded-md space-y-2 border border-primary/10">
                        <p className="text-xs font-semibold flex items-center gap-2 text-primary">
                          <Send className="h-3 w-3" /> Replied by {reply.repliedBy?.firstName || "Admin"} on {new Date(reply.repliedAt).toLocaleString("en-IN")}
                        </p>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(msg._id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedMessage(msg)
                      setReplyMessage("")
                    }}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Reply to {selectedMessage?.name}</DialogTitle>
            <DialogDescription>
              Your reply will be sent to {selectedMessage?.email}.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            rows={7}
            placeholder="Type your response..."
            className="bg-secondary border-border"
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMessage(null)}>
              Cancel
            </Button>
            <Button onClick={handleReply} disabled={sending || !replyMessage.trim()}>
              {sending ? "Sending..." : "Send Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
