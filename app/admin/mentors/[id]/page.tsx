"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Save, ArrowLeft, Calendar, BookOpen, Linkedin, Github, Globe, Plus, X, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useParams } from "next/navigation"

interface Mentor {
  id: number
  full_name: string
  title: string
  bio: string
  profile_pic_url?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
  courses_count: number
  created_at: string
  updated_at: string
}

interface Course {
  id: number
  title: string
  students: number
}

const STORAGE_KEY = "digital_madarsa_mentors"

// Helper function
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function MentorProfilePage() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const mentorId = Number.parseInt(params.id as string)

  const [mentor, setMentor] = useState<Mentor | null>(null)
  const [editForm, setEditForm] = useState<Partial<Mentor>>({})
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([
    { id: 1, title: "Full Stack Web Development", students: 120 },
    { id: 2, title: "React & Next.js Masterclass", students: 85 },
  ])

  // Load mentor data
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const mentors: Mentor[] = JSON.parse(stored)
      const foundMentor = mentors.find((m) => m.id === mentorId)
      if (foundMentor) {
        setMentor(foundMentor)
        setEditForm(foundMentor)
      } else {
        toast({
          title: "Mentor Not Found",
          description: "The mentor you're looking for doesn't exist.",
          variant: "destructive",
        })
        router.push("/admin/mentors")
      }
    }
  }, [mentorId, router, toast])

  // Save changes
  const handleSaveChanges = () => {
    if (!editForm.full_name || !editForm.title || !editForm.bio) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const mentors: Mentor[] = JSON.parse(stored)
      const updatedMentors = mentors.map((m) =>
        m.id === mentorId
          ? {
              ...m,
              ...editForm,
              updated_at: new Date().toISOString(),
            }
          : m,
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMentors))
      setMentor(updatedMentors.find((m) => m.id === mentorId) || null)
      toast({
        title: "Changes Saved",
        description: "Mentor profile has been updated successfully.",
      })
    }
  }

  // Handle image upload (placeholder for actual implementation)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, upload to R2/S3 here
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditForm({ ...editForm, profile_pic_url: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066ff] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mentor profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/admin/mentors")} className="gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Mentors
        </Button>

        <div className="bg-gradient-to-r from-[#0066ff] to-[#0052cc] rounded-2xl p-8 text-white shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-heading font-bold">{mentor.full_name}</h1>
              <p className="text-white/80 text-sm mt-1">Edit mentor profile and manage course assignments</p>
            </div>
            <Button
              onClick={handleSaveChanges}
              className="bg-white text-[#0066ff] hover:bg-white/90 gap-2 font-semibold"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Mentor Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update the mentor's profile image</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={editForm.profile_pic_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-[#0066ff] to-[#0052cc] text-white text-3xl">
                    {editForm.full_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <input
                    type="file"
                    id="profile-pic"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("profile-pic")?.click()}
                    className="gap-2 mb-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload New Picture
                  </Button>
                  <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size 5MB.</p>
                  <div className="mt-2">
                    <Label className="text-xs">Or paste image URL:</Label>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={editForm.profile_pic_url || ""}
                      onChange={(e) => setEditForm({ ...editForm, profile_pic_url: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update mentor's name and title</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={editForm.full_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-title"
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  maxLength={120}
                />
                <p className="text-xs text-gray-500">{editForm.title?.length || 0}/120 characters</p>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle>Biography</CardTitle>
              <CardDescription>Describe the mentor's expertise and experience</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editForm.bio || ""}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={6}
                maxLength={2000}
              />
              <p className="text-xs text-gray-500 mt-2">{editForm.bio?.length || 0}/2000 characters</p>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Add mentor's professional social profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-linkedin" className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn URL
                </Label>
                <Input
                  id="edit-linkedin"
                  placeholder="https://linkedin.com/in/username"
                  value={editForm.linkedin_url || ""}
                  onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-github" className="flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  GitHub URL
                </Label>
                <Input
                  id="edit-github"
                  placeholder="https://github.com/username"
                  value={editForm.github_url || ""}
                  onChange={(e) => setEditForm({ ...editForm, github_url: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-website" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website URL
                </Label>
                <Input
                  id="edit-website"
                  placeholder="https://example.com"
                  value={editForm.website_url || ""}
                  onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Metadata & Courses */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Mentor ID</Label>
                <p className="text-sm font-medium">#{mentor.id}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Created At
                </Label>
                <p className="text-sm font-medium">{formatDate(mentor.created_at)}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Last Updated
                </Label>
                <p className="text-sm font-medium">{formatDate(mentor.updated_at)}</p>
              </div>
              <Separator />
              <div>
                
                
              </div>
            </CardContent>
          </Card>

          {/* Assigned Courses */}
          
        </div>
      </div>
    </div>
  )
}
