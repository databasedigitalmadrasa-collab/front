"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Mail,
  Calendar,
  MapPin,
  MoreHorizontal,
  FileDown,
  Plus,
  CreditCard,
  Loader2,
  KeyRound,
  UserPlus,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { getAuthToken } from "@/lib/auth"

interface User {
  id: number
  full_name: string
  email: string
  contact: string
  country?: string
  state?: string
  profile_pic_url?: string
  is_student: boolean
  is_affiliate: boolean
  is_subscribed: boolean
  subscription_id?: number | null
  plan_id?: number | null
  platform_id?: number
  created_at: string
  updated_at: string
}

interface Plan {
  id: number
  title: string
  monthly_amount: number
  yearly_amount: number
  currency: string
  subscription_type: "monthly" | "annual" | "both"
}


const ITEMS_PER_PAGE = 10

export default function ManageUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [subscriptionFilter, setSubscriptionFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<Partial<User>>({})
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    password: "",
    contact: "",
    is_student: false,
    is_affiliate: false,
  })
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan_id: "",
    subscription_type: "monthly",
  })

  const fetchUsers = async () => {
    setLoading(true)
    const token = getAuthToken()
    const response = await apiClient.get<{ success: boolean; items: User[] }>("/users", token || undefined)

    if (response.success && response.data?.items) {
      setUsers(response.data.items)
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to fetch users",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.contact.includes(searchQuery)

    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "student" && user.is_student) ||
      (roleFilter === "affiliate" && user.is_affiliate)

    const matchesSubscription =
      subscriptionFilter === "all" ||
      (subscriptionFilter === "subscribed" && user.is_subscribed) ||
      (subscriptionFilter === "unsubscribed" && !user.is_subscribed)

    return matchesSearch && matchesRole && matchesSubscription
  })

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(paginatedUsers.map((u) => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  // Handle select user
  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    }
  }

  const handleCreateUser = async () => {
    if (!createForm.full_name || !createForm.email || !createForm.password || !createForm.contact) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const token = getAuthToken()
    const response = await apiClient.post("/users", createForm, token || undefined)

    if (response.success) {
      toast({
        title: "Success",
        description: "User created successfully",
      })
      setIsCreateDialogOpen(false)
      setCreateForm({ full_name: "", email: "", password: "", contact: "", is_student: false, is_affiliate: false })
      fetchUsers()
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to create user",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setLoading(true)
    const token = getAuthToken()
    const response = await apiClient.delete(`/users/${selectedUser.id}`, token || undefined)

    if (response.success) {
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to delete user",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    setLoading(true)
    const token = getAuthToken()
    const response = await apiClient.put(`/users/${selectedUser.id}`, editForm, token || undefined)

    if (response.success) {
      toast({
        title: "Success",
        description: "User updated successfully",
      })
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      setEditForm({})
      fetchUsers()
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to update user",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select users to perform bulk actions.",
        variant: "destructive",
      })
      return
    }

    switch (action) {
      case "export":
        handleExportUsers(selectedUsers)
        break
      case "email":
        toast({
          title: "Email Feature",
          description: `Sending email to ${selectedUsers.length} users...`,
        })
        break
      case "delete":
        // Bulk delete would require multiple API calls
        toast({
          title: "Bulk Delete",
          description: "Please delete users individually for now",
        })
        break
    }
  }

  // Export users to CSV
  const handleExportUsers = (userIds?: number[]) => {
    const usersToExport = userIds ? users.filter((u) => userIds.includes(u.id)) : filteredUsers

    const csv = [
      ["ID", "Name", "Email", "Contact", "Role", "Subscribed", "Country", "State", "Created"].join(","),
      ...usersToExport.map((u) =>
        [
          u.id,
          u.full_name,
          u.email,
          u.contact,
          `${u.is_student ? "Student" : ""}${u.is_affiliate ? " Affiliate" : ""}`,
          u.is_subscribed ? "Yes" : "No",
          u.country || "N/A",
          u.state || "N/A",
          new Date(u.created_at).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `users-export-${Date.now()}.csv`
    a.click()

    toast({
      title: "Export Successful",
      description: `Exported ${usersToExport.length} users to CSV.`,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleResetPassword = async (userId: number) => {
    setLoading(true)
    const token = getAuthToken()
    const response = await apiClient.post(`/users/${userId}/reset-password`, {}, token || undefined)

    if (response.success) {
      toast({
        title: "Success",
        description: "Password reset email sent to user",
      })
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to reset password",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleConvertToAffiliate = async (userId: number) => {
    setLoading(true)
    const token = getAuthToken()
    const response = await apiClient.put(`/users/to-affiliate/${userId}`, {}, token || undefined)

    if (response.success) {
      toast({
        title: "Success",
        description: "User converted to affiliate successfully",
      })
      fetchUsers()
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to convert user to affiliate",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const fetchPlans = async () => {
    const token = getAuthToken()
    const response = await apiClient.get<{ items: Plan[] }>("/subscription-plans", token || undefined)
    if (response.success && response.data?.items) {
      setPlans(response.data.items)
    }
  }

  const handleOpenSubscriptionDialog = async (user: User) => {
    setSelectedUser(user)
    await fetchPlans()
    setIsSubscriptionDialogOpen(true)
    setSubscriptionForm({ plan_id: "", subscription_type: "monthly" })
  }

  const handleAddSubscription = async () => {
    if (!selectedUser || !subscriptionForm.plan_id) return

    setLoading(true)
    const token = getAuthToken()
    const payload = {
      user_id: selectedUser.id,
      plan_id: parseInt(subscriptionForm.plan_id),
      subscription_type: subscriptionForm.subscription_type,
    }

    const response = await apiClient.post("/subscriptions/user", payload, token || undefined)

    if (response.success) {
      toast({
        title: "Success",
        description: "Subscription added successfully",
      })
      setIsSubscriptionDialogOpen(false)
      fetchUsers()
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to add subscription",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] rounded-3xl p-6 lg:p-8 mb-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-heading font-bold">Manage Users</h1>
              <p className="text-white/80 text-sm mt-1">View, manage, and control all platform users</p>
            </div>
          </div>

          <div className="flex gap-2 w-full lg:w-auto">
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-white text-[#0066ff] hover:bg-white/90 gap-2 flex-1 lg:flex-none shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Add User
            </Button>
            <Button
              onClick={() => handleExportUsers()}
              className="bg-white/20 text-white hover:bg-white/30 gap-2 flex-1 lg:flex-none"
            >
              <Download className="w-4 h-4" />
              Export All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
          <div>
            <div className="text-3xl font-bold">{users.length}</div>
            <div className="text-sm text-white/80">Total Users</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{users.filter((u) => u.is_student).length}</div>
            <div className="text-sm text-white/80">Students</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{users.filter((u) => u.is_affiliate).length}</div>
            <div className="text-sm text-white/80">Affiliates</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{users.filter((u) => u.is_subscribed).length}</div>
            <div className="text-sm text-white/80">Subscribed</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, or contact..."
              className="pl-10 h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Students Only</SelectItem>
              <SelectItem value="affiliate">Affiliates Only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Filter by subscription" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="subscribed">Subscribed</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{selectedUsers.length}</span> users selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBulkAction("email")} className="gap-2">
                <Mail className="w-4 h-4" />
                Send Email
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction("export")} className="gap-2">
                <FileDown className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0066ff]" />
          </div>
        )}

        {!loading && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">User Details</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Subscription</TableHead>
                  <TableHead className="font-semibold">Location</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No users found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.profile_pic_url || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] text-white">
                              {user.full_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{user.full_name}</p>
                            <p className="text-xs text-gray-500">{user.contact}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.is_student && <Badge className="bg-blue-100 text-blue-700 text-xs">Student</Badge>}
                          {user.is_affiliate && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">Affiliate</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.is_subscribed ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">Subscribed</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Not Subscribed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.country || user.state ? (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            <span>
                              {user.state}
                              {user.state && user.country && ", "}
                              {user.country}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(user.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setIsViewDialogOpen(true)
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>


                            {!user.is_affiliate && (
                              <DropdownMenuItem onClick={() => handleConvertToAffiliate(user.id)}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Convert to Affiliate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setIsDeleteDialogOpen(true)
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                            {!user.is_subscribed && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleOpenSubscriptionDialog(user)}>
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Add Subscription
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the platform</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                placeholder="Enter full name"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact *</Label>
              <Input
                id="contact"
                placeholder="Enter contact number"
                value={createForm.contact}
                onChange={(e) => setCreateForm({ ...createForm, contact: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label>User Roles *</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="create_is_student"
                    checked={createForm.is_student}
                    onCheckedChange={(checked) => setCreateForm({ ...createForm, is_student: checked as boolean })}
                  />
                  <label
                    htmlFor="create_is_student"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Student
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="create_is_affiliate"
                    checked={createForm.is_affiliate}
                    onCheckedChange={(checked) => setCreateForm({ ...createForm, is_affiliate: checked as boolean })}
                  />
                  <label
                    htmlFor="create_is_affiliate"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Affiliate
                  </label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={loading} className="bg-[#0066ff] hover:bg-[#0052cc]">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.profile_pic_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] text-white text-xl">
                    {selectedUser.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.full_name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Contact</Label>
                  <p className="font-medium">{selectedUser.contact}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Location</Label>
                  <p className="font-medium">
                    {selectedUser.state && selectedUser.country
                      ? `${selectedUser.state}, ${selectedUser.country}`
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Roles</Label>
                  <div className="flex gap-1 mt-1">
                    {selectedUser.is_student && <Badge className="bg-blue-100 text-blue-700">Student</Badge>}
                    {selectedUser.is_affiliate && <Badge className="bg-purple-100 text-purple-700">Affiliate</Badge>}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Subscription Status</Label>
                  <div className="mt-1">
                    {selectedUser.is_subscribed ? (
                      <Badge className="bg-green-100 text-green-700">Subscribed</Badge>
                    ) : (
                      <Badge variant="outline">Not Subscribed</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Created At</Label>
                  <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Last Updated</Label>
                  <p className="font-medium">{formatDate(selectedUser.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Full Name</Label>
              <Input
                id="edit_full_name"
                value={editForm.full_name || ""}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={editForm.email || ""}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_contact">Contact</Label>
              <Input
                id="edit_contact"
                value={editForm.contact || ""}
                onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_country">Country</Label>
              <Input
                id="edit_country"
                value={editForm.country || ""}
                onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_state">State</Label>
              <Input
                id="edit_state"
                value={editForm.state || ""}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label>User Roles</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit_is_student"
                    checked={editForm.is_student || false}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, is_student: checked as boolean })}
                  />
                  <label
                    htmlFor="edit_is_student"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Student
                  </label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={loading} className="bg-[#0066ff] hover:bg-[#0052cc]">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user <strong>{selectedUser?.full_name}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={loading} className="bg-red-600 hover:bg-red-700">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Subscription</DialogTitle>
            <DialogDescription>Select a plan to subscribe the user to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <Select
                value={subscriptionForm.plan_id}
                onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, plan_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.title} ({plan.currency} {plan.monthly_amount}/mo)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subscription Type</Label>
              <Select
                value={subscriptionForm.subscription_type}
                onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, subscription_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubscriptionDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAddSubscription} disabled={loading || !subscriptionForm.plan_id} className="bg-[#0066ff] hover:bg-[#0052cc]">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
