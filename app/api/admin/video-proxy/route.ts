import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get("bucket") || "media"
    const key = searchParams.get("key")

    if (!key) {
      return NextResponse.json({ error: "Missing key parameter" }, { status: 400 })
    }

    const authHeader = request.headers.get("Authorization")
    let token = authHeader?.replace("Bearer ", "")

    // Fallback to cookies if no Authorization header
    if (!token) {
      const cookieStore = await cookies()
      token = cookieStore.get("admin_token")?.value
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token found" }, { status: 401 })
    }

    const videoUrl = `https://srv.digitalmadrasa.co.in/api/v1/video?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}&token=${encodeURIComponent(token)}`

    const videoResponse = await fetch(videoUrl, {
      method: "GET",
      headers: {
        Accept: "video/mp4",
      },
    })

    if (!videoResponse.ok) {
      console.error(`Video fetch failed: ${videoResponse.status} - ${videoResponse.statusText}`)
      const errorText = await videoResponse.text()
      console.error(`Error response: ${errorText}`)
      return NextResponse.json(
        { error: `Failed to fetch video: ${videoResponse.statusText}` },
        { status: videoResponse.status },
      )
    }

    const videoBuffer = await videoResponse.arrayBuffer()

    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": "inline",
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, no-store",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("Video proxy error:", error)
    return NextResponse.json({ error: "Video proxy error" }, { status: 500 })
  }
}
