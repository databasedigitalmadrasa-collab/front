import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.searchParams
  const bucket = searchParams.get("bucket") || "media"
  const key = searchParams.get("key")

  if (!key) {
    return NextResponse.json({ error: "Missing video key" }, { status: 400 })
  }

  // Get auth token from request headers
  const authHeader = request.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Forward request to actual video API with auth
    const videoUrl = `https://srv.digitalmadrasa.co.in/api/v1/video?bucket=${bucket}&key=${encodeURIComponent(key)}`

    const response = await fetch(videoUrl, {
      headers: {
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch video: ${response.status}` }, { status: response.status })
    }

    // Stream the video content back
    const videoBlob = await response.blob()

    return new NextResponse(videoBlob, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "video/mp4",
        "Content-Disposition": "inline",
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, no-store",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("Video proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 })
  }
}
