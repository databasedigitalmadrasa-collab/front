import { MetadataRoute } from 'next'
import { getCourses } from '@/lib/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://digitalmadrasa.co.in'

    // Static routes
    const routes = [
        '',
        '/courses',
        '/login',
        '/contact',
        '/legal/privacy-policy',
        '/legal/terms-of-service',
        '/legal/refund-policy',
        '/legal/shipping-policy',
        '/legal/contact',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // Dynamic routes: Courses
    try {
        const { items: courses } = await getCourses()

        const courseRoutes = courses.map((course: any) => ({
            url: `${baseUrl}/courses/${course.id}`,
            lastModified: course.updated_at ? new Date(course.updated_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.9,
        }))

        return [...routes, ...courseRoutes]
    } catch (error) {
        console.error('Error generating sitemap for courses:', error)
        return routes
    }
}
