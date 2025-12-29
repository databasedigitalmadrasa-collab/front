import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic'; // Defaults to auto

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get("key");

    if (!key) {
        return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
    }

    try {
        const backendUrl = "https://srv.digitalmadrasa.co.in/api/v1/r2/object-access";

        // We assume the backend route is open (auth: false based on previous edits)
        // If it requires auth, we would need to pass a token
        const response = await fetch(backendUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                bucket: "media-bucket",
                key: key,
                duration: searchParams.get("duration") || 0
            })
        });

        if (!response.ok) {
            console.error("Backend error:", response.status, response.statusText);
            return NextResponse.json({ error: "Failed to fetch signed URL" }, { status: response.status });
        }

        const data = await response.json();

        if (data.success && data.url) {
            // Redirect to the signed URL
            return NextResponse.redirect(data.url, 302);
        } else {
            return NextResponse.json({ error: data.error || "Failed to generate signed URL" }, { status: 500 });
        }

    } catch (error) {
        console.error("Error in video proxy:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
