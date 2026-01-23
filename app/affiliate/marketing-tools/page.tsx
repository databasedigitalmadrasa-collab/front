"use client"

import { useState, useEffect } from "react"
import { useUserAuth } from "@/hooks/use-user-auth"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
    Copy,
    Download,
    Share2,
    CheckCircle2,
    ExternalLink,
    ImageIcon,
    FileText,
    Video,
    DownloadCloud,
    Globe
} from "lucide-react"
import QRCode from "qrcode"
import Image from "next/image"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import apiClient from "@/lib/api-client"

interface PromotionalAsset {
    id: number;
    title: string;
    type: 'banner' | 'text' | 'video';
    content?: string;
    url?: string;
    thumbnail_url?: string;
    is_active: number;
}

export default function MarketingToolsPage() {
    const { user } = useUserAuth()
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
    const [copied, setCopied] = useState(false)

    const referralCode = user?.affiliate?.referral_code || "YOUR_CODE"
    const referralLink = `https://digitalmadrasa.in/ref/${referralCode}`

    const [assets, setAssets] = useState<PromotionalAsset[]>([])
    const [isLoadingAssets, setIsLoadingAssets] = useState(true)

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const res = await apiClient.get<{ items: PromotionalAsset[] }>('/promotional-assets')
                // The API returns { success: true, items: [...] } inside res.data
                if (res.data?.items) {
                    setAssets(res.data.items)
                }
            } catch (err) {
                console.error("Failed to fetch assets", err)
            } finally {
                setIsLoadingAssets(false)
            }
        }
        fetchAssets()
    }, [])

    const banners = assets.filter(a => a.type === 'banner')
    const templates = assets.filter(a => a.type === 'text')
    const videos = assets.filter(a => a.type === 'video')

    useEffect(() => {
        if (referralLink) {
            QRCode.toDataURL(referralLink, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            })
                .then((url) => {
                    setQrCodeUrl(url)
                })
                .catch((err) => {
                    console.error("Error generating QR code", err)
                })
        }
    }, [referralLink])

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink)
        setCopied(true)
        toast.success("Referral link copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
    }

    const downloadQrCode = () => {
        if (!qrCodeUrl) return
        const link = document.createElement("a")
        link.href = qrCodeUrl
        link.download = `digital-madrasa-qr-${referralCode}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleShare = (platform: string) => {
        let url = ""
        const text = encodeURIComponent(`Start your learning journey with Digital Madrasa! Use my referral link:`)
        const link = encodeURIComponent(referralLink)

        switch (platform) {
            case "whatsapp":
                url = `https://wa.me/?text=${text}%20${link}`
                break
            case "telegram":
                url = `https://t.me/share/url?url=${link}&text=${text}`
                break
            case "twitter":
                url = `https://twitter.com/intent/tweet?text=${text}&url=${link}`
                break
        }

        if (url) window.open(url, "_blank")
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">Marketing Tools</h1>
                <p className="text-gray-500 max-w-2xl">
                    Boost your earnings with our ready-to-use marketing materials. Share your link, post banners, and track your success.
                </p>
            </div>

            {/* Main Tools Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Referral Link Card - Primary Feature */}
                <div className="lg:col-span-2 bg-gradient-to-br from-[#0066ff] to-[#0052cc] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>

                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-white/20 hover:bg-white/20 text-white border-0 backdrop-blur-sm">
                                    Your Primary Tool
                                </Badge>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-2">Refarrral Link</h2>
                            <p className="text-blue-100 max-w-md">
                                Share this unique link with potential students. You earn commission for every course they purchase.
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 pl-4 flex items-center gap-2 border border-white/20">
                            <Globe className="w-5 h-5 text-blue-200 shrink-0" />
                            <code className="flex-1 font-mono text-sm sm:text-base text-white truncate">
                                {referralLink}
                            </code>
                            <Button
                                onClick={copyToClipboard}
                                size="sm"
                                className="shrink-0 bg-white text-[#0066ff] hover:bg-blue-50 font-medium"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-1.5" />
                                        Copy Link
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* QR Code Card */}
                <Card className="rounded-2xl border-gray-100 shadow-sm bg-white overflow-hidden flex flex-col">
                    <CardContent className="p-6 flex-1 flex flex-col items-center justify-center gap-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                            <div className="bg-white p-3 rounded-xl border border-gray-100 relative shadow-sm">
                                {qrCodeUrl ? (
                                    <Image
                                        src={qrCodeUrl}
                                        alt="Your Referral QR Code"
                                        width={160}
                                        height={160}
                                        className="rounded-lg"
                                    />
                                ) : (
                                    <div className="w-40 h-40 bg-gray-50 animate-pulse rounded-lg" />
                                )}
                            </div>
                        </div>

                        <div className="text-center w-full">
                            <h3 className="font-heading font-bold text-gray-900 mb-1">Scannable QR Code</h3>
                            <p className="text-xs text-gray-500 mb-4">Perfect for printed materials or in-person sharing</p>
                            <Button variant="outline" className="w-full gap-2 rounded-xl h-10 border-gray-200" onClick={downloadQrCode}>
                                <DownloadCloud className="w-4 h-4" />
                                Download PNG
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Share Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { id: 'whatsapp', label: 'WhatsApp', color: 'bg-[#25D366]', hover: 'hover:bg-[#20bd5a]' },
                    { id: 'telegram', label: 'Telegram', color: 'bg-[#0088cc]', hover: 'hover:bg-[#007dbb]' },
                    { id: 'twitter', label: 'Twitter', color: 'bg-[#1DA1F2]', hover: 'hover:bg-[#1a91da]' }
                ].map((platform) => (
                    <button
                        key={platform.id}
                        onClick={() => handleShare(platform.id)}
                        className={`${platform.color} ${platform.hover} text-white p-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-sm`}
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="font-heading font-medium">Share on {platform.label}</span>
                    </button>
                ))}
            </div>

            {/* Assets Section */}
            <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-heading font-bold text-gray-900">Promotional Assets</h2>
                </div>

                <Tabs defaultValue="banners" className="w-full">
                    <TabsList className="bg-gray-100/50 p-1 rounded-xl h-auto inline-flex gap-1 mb-6">
                        {[
                            { id: 'banners', label: 'Banners', icon: ImageIcon },
                            { id: 'templates', label: 'Text Templates', icon: FileText },
                            { id: 'videos', label: 'Videos', icon: Video },
                        ].map(tab => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="data-[state=active]:bg-white data-[state=active]:text-[#0066ff] data-[state=active]:shadow-sm px-4 py-2.5 rounded-lg text-gray-600 font-medium transition-all gap-2"
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="banners" className="mt-0 space-y-8 animate-in fade-in-50 duration-300">
                        {isLoadingAssets ? (
                            <div className="text-center py-10 text-gray-500">Loading banners...</div>
                        ) : banners.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">No banners available yet.</div>
                        ) : (
                            <div className="grid grid-cols-1 sc:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {banners.map((asset) => (
                                    <div key={asset.id} className="group relative rounded-2xl overflow-hidden bg-gray-50 aspect-[4/5] border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                        <div className="absolute inset-0 bg-gray-200">
                                            {asset.url && (
                                                <Image
                                                    src={asset.url}
                                                    alt={asset.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>

                                        <div className="absolute inset-x-0 bottom-0 p-4 bg-white/90 backdrop-blur-md border-t border-white/50 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-gray-900 truncate max-w-[100px]" title={asset.title}>{asset.title}</span>
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-gray-100" onClick={() => window.open(asset.url, '_blank')}>
                                                    <ExternalLink className="w-4 h-4 text-gray-600" />
                                                </Button>
                                                <Button size="icon" className="h-8 w-8 rounded-lg bg-[#0066ff] text-white hover:bg-blue-600 shadow-sm" onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = asset.url || '';
                                                    link.download = asset.title || 'banner';
                                                    link.target = '_blank';
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}>
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="templates" className="mt-0 animate-in fade-in-50 duration-300">
                        {isLoadingAssets ? (
                            <div className="text-center py-10 text-gray-500">Loading templates...</div>
                        ) : templates.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">No text templates available yet.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {templates.map((asset) => (
                                    <Card key={asset.id} className="rounded-2xl border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer bg-white">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <Badge variant="outline" className="rounded-md font-normal border-gray-200 bg-gray-50">{asset.title}</Badge>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 group-hover:text-[#0066ff]" onClick={() => {
                                                    navigator.clipboard.writeText(asset.content || '');
                                                    toast.success("Template copied!");
                                                }}>
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <p className="text-gray-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                                                {asset.content}
                                            </p>
                                            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 w-0 group-hover:w-full transition-all duration-500 ease-out"></div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="videos" className="mt-0 animate-in fade-in-50 duration-300">
                        {isLoadingAssets ? (
                            <div className="text-center py-10 text-gray-500">Loading videos...</div>
                        ) : videos.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">No videos available yet.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {videos.map((asset) => (
                                    <div key={asset.id} className="rounded-2xl overflow-hidden bg-gray-900 aspect-video relative group border border-gray-800 shadow-lg">
                                        <div className="absolute inset-0 bg-cover bg-center opacity-50 transition-opacity group-hover:opacity-40" style={{ backgroundImage: `url('${asset.thumbnail_url || ''}')` }}></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-[#0066ff] group-hover:border-transparent transition-all duration-300 cursor-pointer shadow-2xl" onClick={() => window.open(asset.url, '_blank')}>
                                                <Video className="w-6 h-6 fill-current translate-x-0.5" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                                            <h3 className="text-white font-heading font-bold text-lg mb-1">{asset.title}</h3>
                                            <div className="flex items-center gap-3 text-xs text-gray-300">
                                                <span className="bg-white/10 px-2 py-0.5 rounded text-white">Full HD</span>
                                                <span>MP4</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    )
}
