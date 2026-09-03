"use client"

/**
 * `/live/<public_join_token>` — the subscriber's live class.
 *
 * Thin by design: the room, the chat, the Q&A and every error state live in
 * `LiveClassRoom`, which the guest link renders too. The only thing this route
 * knows is which token it was handed and where "leave" should go.
 */

import { useParams } from "next/navigation"
import { LiveClassRoom } from "@/components/live/live-class-room"

export default function LearnerLiveClassPage() {
  const { token } = useParams<{ token: string }>()

  return (
    <LiveClassRoom
      token={token}
      principal="user"
      exitHref="/dashboard"
      exitLabel="Leave class"
    />
  )
}
