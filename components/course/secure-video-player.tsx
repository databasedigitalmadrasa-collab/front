"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { PlayCircle, Pause, Volume2, VolumeX, Maximize } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SecureVideoPlayerProps {
  videoUrl: string // Cloudflare R2 blob URL
  thumbnailUrl?: string
  onProgress?: (progress: number) => void
  onComplete?: () => void
}

export function SecureVideoPlayer({ videoUrl, thumbnailUrl, onProgress, onComplete }: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const preventScreenCapture = () => {
      // Disable right-click context menu
      video.addEventListener("contextmenu", (e) => e.preventDefault())

      // Detect screenshot attempts (keyboard shortcuts)
      const handleKeyDown = (e: KeyboardEvent) => {
        // Windows: PrtScn, Alt+PrtScn, Win+PrtScn, Win+Shift+S
        if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey && e.key === "s")) {
          e.preventDefault()
          alert("Screenshots are disabled for course content protection.")
        }
        // Mac: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
        if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
          e.preventDefault()
          alert("Screenshots are disabled for course content protection.")
        }
      }

      document.addEventListener("keydown", handleKeyDown)

      // Detect if page visibility changes (possible screen recording)
      const handleVisibilityChange = () => {
        if (document.hidden && isPlaying) {
          video.pause()
          setIsPlaying(false)
        }
      }

      document.addEventListener("visibilitychange", handleVisibilityChange)

      return () => {
        document.removeEventListener("keydown", handleKeyDown)
        document.removeEventListener("visibilitychange", handleVisibilityChange)
      }
    }

    preventScreenCapture()

    // Track video progress
    const handleTimeUpdate = () => {
      const percent = (video.currentTime / video.duration) * 100
      setProgress(percent)
      setCurrentTime(video.currentTime)
      onProgress?.(percent)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      onComplete?.()
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [isPlaying, onProgress, onComplete])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = Number.parseFloat(e.target.value)
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newTime = (Number.parseFloat(e.target.value) / 100) * video.duration
    video.currentTime = newTime
    setProgress(Number.parseFloat(e.target.value))
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!document.fullscreenElement) {
      container.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        src={videoUrl}
        poster={thumbnailUrl}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: "none", pointerEvents: "auto" }}
      >
        Your browser does not support the video tag.
      </video>

      {/* Play Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Button
            onClick={togglePlay}
            size="lg"
            className="w-20 h-20 rounded-full bg-white/90 hover:bg-white hover:scale-110 transition-all shadow-xl"
          >
            <PlayCircle className="w-12 h-12 text-[#0066ff]" />
          </Button>
        </div>
      )}

      {/* Custom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="w-full h-1 mb-3 cursor-pointer appearance-none bg-white/30 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0066ff]"
        />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <Button onClick={togglePlay} size="sm" variant="ghost" className="text-white hover:bg-white/20">
              {isPlaying ? <Pause className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button onClick={toggleMute} size="sm" variant="ghost" className="text-white hover:bg-white/20">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 cursor-pointer appearance-none bg-white/30 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>

            {/* Time */}
            <span className="text-white text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen */}
            <Button onClick={toggleFullscreen} size="sm" variant="ghost" className="text-white hover:bg-white/20">
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Security Warning Overlay */}
      <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
        🔒 Protected Content
      </div>
    </div>
  )
}
