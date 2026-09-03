import { NextRequest, NextResponse } from "next/server";
import { apiUrl } from "@/lib/dm-api"

export const dynamic = 'force-dynamic'; // Defaults to auto

/**
 * Video URL broker.
 *
 * This runs on the SERVER, and it is reached by a `<video src>` load rather
 * than by fetch — so there is no Authorization header to read and no
 * localStorage to look in. The token comes from the cookie the portal already
 * sets alongside localStorage at login (see lib/auth.ts / lib/user-auth.ts).
 *
 * Two callers, two dm-api routes, because they are two different privileges:
 *
 *   ?lessonId=…  a learner watching a lesson. Calls POST /r2/lesson-video,
 *                which resolves the object key from `lessons.r2_key` itself and
 *                requires an active subscription. The learner never names a key.
 *   ?key=…       an admin previewing footage in the course editor. Calls
 *                POST /r2/object-access, which is `requireAdmin()` — it signs
 *                any key in any bucket, which is precisely why a learner token
 *                must not reach it.
 *
 * dm-backend left both of these open, so this handler used to send no
 * credential at all and the comment here said "we assume the backend route is
 * open". It is not open any more, and a request with no token now 401s.
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get("key");
    const lessonId = searchParams.get("lessonId");

    if (!key && !lessonId) {
        return NextResponse.json({ error: "Missing key or lessonId parameter" }, { status: 400 });
    }

    // Learner first: when both are present, prefer the route that does not let
    // the caller choose an object key.
    const asLearner = Boolean(lessonId);

    const token = asLearner
        ? request.cookies.get("user_token")?.value
        : request.cookies.get("admin_token")?.value;

    if (!token) {
        return NextResponse.json(
            { error: asLearner ? "Please log in to watch this lesson" : "Admin session required" },
            { status: 401 },
        );
    }

    try {
        const backendUrl = asLearner ? apiUrl("/r2/lesson-video") : apiUrl("/r2/object-access");

        const response = await fetch(backendUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(
                asLearner ? { lesson_id: Number(lessonId) } : { bucket: "media-bucket", key },
            ),
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
