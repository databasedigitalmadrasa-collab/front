
import { notFound } from "next/navigation"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { apiClient } from "@/lib/api-client"
import MarkdownClientWrapper from "@/components/MarkdownClientWrapper"


interface PolicyPageProps {
    params: Promise<{
        slug: string
    }>
}

async function getPolicyContent(slug: string) {
    try {
        // API endpoint created in adminSettingsController: /settings?page=...
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://srv.digitalmadrasa.co.in'}/api/v1/settings?page=${slug}`, {
            cache: 'no-store'
        });

        if (!response.ok) return null;
        const data = await response.json();

        if (data.success && data.content) {
            return {
                content: data.content,
                title: getTitleFromSlug(slug)
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching policy:", error);
        return null;
    }
}

function getTitleFromSlug(slug: string): string {
    const map: Record<string, string> = {
        privacy: "Privacy Policy",
        "privacy-policy": "Privacy Policy",
        terms: "Terms & Conditions",
        "terms-of-service": "Terms & Conditions",
        refunds: "Refund Policy",
        "refund-policy": "Refund Policy",
        shipping: "Shipping & Delivery",
        "shipping-policy": "Shipping & Delivery",
        contact: "Contact Us"
    };
    return map[slug] || slug.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default async function PolicyPage({ params }: PolicyPageProps) {
    const { slug } = await params;
    const data = await getPolicyContent(slug);

    if (!data) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans">
            <Navbar />

            <main className="flex-1 py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        {data.title}
                    </h1>

                    <div className="prose prose-invert max-w-none bg-slate-900/50 p-8 rounded-2xl border border-white/10 shadow-xl" data-color-mode="dark">
                        <MarkdownClientWrapper
                            source={data.content}
                        />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
