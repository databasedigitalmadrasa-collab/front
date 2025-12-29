"use client"

import { useState, useEffect } from "react"
import { Search, Plus, MoreVertical, Trash2, Edit, Bell, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface PlatformUpdate {
  id: number
  title: string
  message: string
  channel: string
  published: boolean
  created_at?: string
  updated_at?: string
}

const CHANNELS = [
  { value: "global", label: "Global", icon: Megaphone, color: "blue" },
  { value: "students", label: "Students", icon: Bell, color: "green" },
  { value: "affiliates", label: "Affiliates", icon: Bell, color: "purple" },
  { value: "system", label: "System", icon: Bell, color: "orange" },
]

export default function PlatformUpdatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [updates, setUpdates] = useState<PlatformUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUpdate, setEditingUpdate] = useState<PlatformUpdate | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    channel: "global",
    published: true,
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const API_BASE = "https://srv.digitalmadrasa.co.in/api/v1"

  const fetchUpdates = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/platform-updates`)
      const data = await response.json()

      if (data.success && data.items) {
        setUpdates(data.items)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch platform updates",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching updates:", error)
      toast({
        title: "Error",
        description: "Failed to load platform updates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingUpdate(null)
    setFormData({
      title: "",
      message: "",
      channel: "global",
      published: true,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (update: PlatformUpdate) => {
    setEditingUpdate(update)
    setFormData({
      title: update.title,
      message: update.message,
      channel: update.channel,
      published: update.published,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and message are required",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const url = editingUpdate ? `${API_BASE}/platform-updates/${editingUpdate.id}` : `${API_BASE}/platform-updates`

      const method = editingUpdate ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success || response.ok) {
        toast({
          title: "Success",
          description: editingUpdate ? "Platform update updated successfully" : "Platform update created successfully",
        })
        setIsDialogOpen(false)
        fetchUpdates()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to save platform update",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving update:", error)
      toast({
        title: "Error",
        description: "Failed to save platform update",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this platform update?")) return

    setDeleteLoading(id)
    try {
      const response = await fetch(`${API_BASE}/platform-updates/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success || response.ok) {
        toast({
          title: "Success",
          description: "Platform update deleted successfully",
        })
        fetchUpdates()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete platform update",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting update:", error)
      toast({
        title: "Error",
        description: "Failed to delete platform update",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(null)
    }
  }

  useEffect(() => {
    fetchUpdates()
  }, [])

  const filteredUpdates = updates.filter(
    (update) =>
      update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.message.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getChannelInfo = (channel: string) => {
    return CHANNELS.find((c) => c.value === channel) || CHANNELS[0]
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold mb-2">Platform Updates</h1>
            <p className="text-sm sm:text-base text-white/90">Manage announcements and system messages</p>
          </div>
          <Button onClick={handleCreate} className="bg-white text-blue-600 hover:bg-white/90 font-semibold shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Create Update
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search updates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base border-gray-200 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUpdates.map((update) => {
            const channelInfo = getChannelInfo(update.channel)
            const ChannelIcon = channelInfo.icon

            return (
              <div
                key={update.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`w-12 h-12 bg-${channelInfo.color}-50 rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <ChannelIcon className={`w-6 h-6 text-${channelInfo.color}-600`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-heading font-bold text-gray-900">{update.title}</h3>
                        <Badge
                          variant={update.published ? "default" : "secondary"}
                          className={update.published ? "bg-green-500" : "bg-gray-400"}
                        >
                          {update.published ? "Published" : "Draft"}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {channelInfo.label}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{update.message}</p>

                      {update.created_at && (
                        <p className="text-xs text-gray-400">
                          Created: {new Date(update.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => handleEdit(update)} className="flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(update.id)}
                        disabled={deleteLoading === update.id}
                        className="flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deleteLoading === update.id ? "Deleting..." : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredUpdates.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No platform updates found</p>
          <p className="text-gray-400 text-sm mt-1">Create your first update to get started</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUpdate ? "Edit Platform Update" : "Create Platform Update"}</DialogTitle>
            <DialogDescription>
              {editingUpdate
                ? "Update the platform announcement details"
                : "Create a new announcement for your platform users"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="System Maintenance"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="The system will be down for maintenance tonight from 12am to 2am."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">Channel *</Label>
              <Select value={formData.channel} onValueChange={(value) => setFormData({ ...formData, channel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((channel) => (
                    <SelectItem key={channel.value} value={channel.value}>
                      <div className="flex items-center gap-2">
                        <channel.icon className="w-4 h-4" />
                        {channel.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Select the target audience for this update</p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="published">Published</Label>
                <p className="text-xs text-gray-500">Make this update visible to users</p>
              </div>
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingUpdate ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
