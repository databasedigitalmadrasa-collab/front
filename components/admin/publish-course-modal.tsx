"use client"

import { useState } from "react"
import { X, CheckCircle2, AlertCircle, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PublishCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onPublish: () => void
  courseTitle: string
  modules: any[]
}

export function PublishCourseModal({ isOpen, onClose, onPublish, courseTitle, modules }: PublishCourseModalProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(false)

  if (!isOpen) return null

  // Validation checks
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const hasModules = modules.length > 0
  const hasLessons = totalLessons > 0
  const hasTitle = courseTitle.trim().length > 0

  const validationChecks = [
    { label: "Course has a title", passed: hasTitle },
    { label: "At least one module created", passed: hasModules },
    { label: "At least one lesson added", passed: hasLessons },
    { label: "Course content structured", passed: hasModules && hasLessons },
  ]

  const canPublish = validationChecks.every((check) => check.passed)

  const handlePublish = async () => {
    setIsPublishing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsPublishing(false)
    setIsPublished(true)
    setTimeout(() => {
      onPublish()
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
        {!isPublished ? (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-heading font-bold text-gray-900">Publish Course</h2>
                  <p className="text-sm text-gray-600 mt-1">Review and publish your course to students</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">{courseTitle}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-blue-700">Modules</p>
                    <p className="font-bold text-blue-900">{modules.length}</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Lessons</p>
                    <p className="font-bold text-blue-900">{totalLessons}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Publication Checklist</h3>
                <div className="space-y-2">
                  {validationChecks.map((check, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {check.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${check.passed ? "text-gray-900" : "text-gray-600"}`}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {!canPublish && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Unable to Publish</p>
                      <p className="text-sm text-orange-700 mt-1">
                        Please complete all checklist items before publishing your course.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {canPublish && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-900">Ready to Publish</p>
                      <p className="text-sm text-green-700 mt-1">
                        Your course meets all requirements and is ready to be published to students.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button
                onClick={handlePublish}
                disabled={!canPublish || isPublishing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isPublishing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Publish Course
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Course Published!</h3>
            <p className="text-gray-600">Your course is now live and available to students.</p>
          </div>
        )}
      </div>
    </div>
  )
}
