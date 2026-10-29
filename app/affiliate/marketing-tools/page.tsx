"use client"

import { useState, useEffect } from "react"
import type { LucideIcon } from "lucide-react"
import { useUserAuth } from "@/hooks/use-user-auth"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
    Check,
    Copy,
    Download,
    ExternalLink,
    ImageIcon,
    FileText,
    Video,
    UploadCloud,
    GraduationCap,
    Home,
    Info,
    Lightbulb,
    MessageCircle,
    Send,
    Share2,
    X,
} from "lucide-react"
import QRCode from "qrcode"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import apiClient from "@/lib/api-client"

interface PromotionalAsset {
    id: number;
    title: string;
    type: 'banner' | 'text' | 'video';
    content?: string;
    url?: string;
    thumbnail_url?: string;
    drive_link?: string;
    is_active: number;
}

/** A public `subscription_plan` row (amounts in rupees). */
interface Plan {
    id: number
    title: string
    description: string | null
    yearly_amount: number | null
    discounted_amount: number | null
    is_featured: number | null
    badge_text: string | null
    /** Per-plan commission, if dm-api ever sets one; the programme's flat rate applies otherwise. */
    commission_cents?: number | null
}

/** One card in "Your Referral Links". */
interface ReferralOption {
    key: string
    title: string
    description: string
    icon: LucideIcon | null
    price: number | null
    badge: string | null
    commissionCents: number | null
    link: string
}

const PRO_TIP_KEY = "dm-marketing-pro-tip-dismissed"

const rupees = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)

const planPrice = (p: Plan) =>
    p.discounted_amount && p.yearly_amount && p.discounted_amount < p.yearly_amount ? p.discounted_amount : p.yearly_amount

const planIcon = (title: string): LucideIcon | null =>
    /student/i.test(title) ? GraduationCap : /home/i.test(title) ? Home : null

/**
 * One referral link per plan. The base link is the affiliate's own; `?plan=`
 * tells the `/ref/[code]` landing page which plan to open after it records the
 * click. The featured plan (else the priciest) is the reference price that the
 * other plans' "% OFF" badges are measured against.
 */
function buildOptions(plans: Plan[], baseLink: string, flatCommissionCents: number | null): ReferralOption[] {
    if (plans.length === 0) {
        return [{
            key: "default",
            title: "Your Referral Link",
            description: "For any audience",
            icon: null,
            price: null,
            badge: null,
            commissionCents: flatCommissionCents,
            link: baseLink,
        }]
    }
    const priced = [...plans].sort((a, b) => (planPrice(b) ?? 0) - (planPrice(a) ?? 0))
    const main = priced.find((p) => p.is_featured === 1) ?? priced[0]
    const mainPrice = planPrice(main) ?? 0
    return priced.map((p) => {
        const price = planPrice(p)
        const off = price && mainPrice > price ? ((mainPrice - price) / mainPrice) * 100 : 0
        return {
            key: String(p.id),
            title: p.title,
            description: p.description ?? "",
            icon: planIcon(p.title),
            price,
            badge: p === main ? p.badge_text || "Main Plan" : off > 0 ? `${off.toFixed(2)}% OFF` : p.badge_text,
            commissionCents: p.commission_cents ?? flatCommissionCents,
            link: `${baseLink}?plan=${p.id}`,
        }
    })
}

export default function MarketingToolsPage() {
    const { user } = useUserAuth()
    const referralCode = user?.affiliate?.referral_code
    const baseLink = user?.affiliate?.referral_link || (referralCode ? `https://digitalmadrasa.in/ref/${referralCode}` : "")

    const [assets, setAssets] = useState<PromotionalAsset[]>([])
    const [isLoadingAssets, setIsLoadingAssets] = useState(true)
    const [plans, setPlans] = useState<Plan[]>([])
    const [commissionCents, setCommissionCents] = useState<number | null>(null)
    const [isLoadingPlans, setIsLoadingPlans] = useState(true)
    const [qrCodes, setQrCodes] = useState<Record<string, string>>({})
    const [copiedKey, setCopiedKey] = useState<string | null>(null)
    const [showProTip, setShowProTip] = useState(false)

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

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const [plansRes, programRes] = await Promise.all([
                    apiClient.get<{ items: Plan[] }>("/subscription-plans"),
                    apiClient.get<{ data: { commission_cents: number } }>("/referral-program"),
                ])
                if (plansRes.data?.items) setPlans(plansRes.data.items)
                if (programRes.success && programRes.data?.data) setCommissionCents(programRes.data.data.commission_cents)
            } catch (err) {
                console.error("Failed to fetch plans", err)
            } finally {
                setIsLoadingPlans(false)
            }
        }
        fetchPlans()
    }, [])

    useEffect(() => {
        try {
            setShowProTip(localStorage.getItem(PRO_TIP_KEY) !== "1")
        } catch {
            setShowProTip(true)
        }
    }, [])

    const options = baseLink ? buildOptions(plans, baseLink, commissionCents) : []
    const linksKey = options.map((o) => o.link).join("|")

    useEffect(() => {
        if (!linksKey) return
        let cancelled = false
        Promise.all(
            linksKey.split("|").map((link) =>
                QRCode.toDataURL(link, { width: 300, margin: 1, color: { dark: "#0b1220", light: "#ffffff" } })
                    .then((url) => [link, url] as const)
                    .catch((err) => {
                        console.error("Error generating QR code", err)
                        return [link, ""] as const
                    })
            )
        ).then((entries) => {
            if (!cancelled) setQrCodes(Object.fromEntries(entries))
        })
        return () => {
            cancelled = true
        }
    }, [linksKey])

    const copyLink = async (option: ReferralOption) => {
        try {
            await navigator.clipboard.writeText(option.link)
            setCopiedKey(option.key)
            setTimeout(() => setCopiedKey((k) => (k === option.key ? null : k)), 2000)
        } catch (err) {
            console.error("Copy failed", err)
        }
    }

    const shareText = (option: ReferralOption) =>
        `Start your learning journey with Digital Madrasa${option.price ? ` (${option.title}, ${rupees(option.price)})` : ""}. Join through my link:`

    const handleShare = async (platform: "whatsapp" | "telegram" | "native", option: ReferralOption) => {
        const text = shareText(option)
        if (platform === "whatsapp") {
            window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${option.link}`)}`, "_blank", "noopener")
        } else if (platform === "telegram") {
            window.open(
                `https://t.me/share/url?url=${encodeURIComponent(option.link)}&text=${encodeURIComponent(text)}`,
                "_blank",
                "noopener"
            )
        } else if (navigator.share) {
            try {
                await navigator.share({ title: "Digital Madrasa", text, url: option.link })
            } catch {
                // Dismissing the share sheet rejects; nothing to do.
            }
        } else {
            copyLink(option)
        }
    }

    const downloadQrCode = (option: ReferralOption) => {
        const url = qrCodes[option.link]
        if (!url) return
        const link = document.createElement("a")
        link.href = url
        link.download = `digital-madrasa-qr-${referralCode}-${option.key}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const dismissProTip = () => {
        setShowProTip(false)
        try {
            localStorage.setItem(PRO_TIP_KEY, "1")
        } catch {}
    }

    const banners = assets.filter(a => a.type === 'banner')
    const templates = assets.filter(a => a.type === 'text')
    const videos = assets.filter(a => a.type === 'video')

    return (
        <div className="min-h-screen bg-[#f6f8fc] p-3 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="px-1 sm:px-0">
                    <h1 className="text-[26px] sm:text-4xl font-heading font-bold text-gray-900 tracking-tight">Marketing Tools</h1>
                    <p className="mt-1.5 text-sm sm:text-base text-gray-500 max-w-2xl">
                        Choose a plan, get your unique referral link and start sharing with your audience.
                    </p>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-[#d9e5fb] bg-[#eef4ff] px-4 py-3.5 lg:max-w-sm">
                    <Info className="mt-0.5 size-5 shrink-0 text-[#0a5cff]" />
                    <p className="text-[13px] leading-relaxed text-gray-600">
                        Each plan has a unique referral link. Share the right link with the right audience to earn commission.
                    </p>
                </div>
            </div>

            {/* Referral links */}
            <section className="space-y-4 sm:space-y-5">
                <div className="px-1 sm:px-0">
                    <h2 className="text-xl sm:text-[26px] font-heading font-bold text-gray-900">Your Referral Links</h2>
                    <p className="mt-1 text-sm sm:text-base text-gray-500">
                        Share these links with your audience. You&apos;ll earn commission for every successful enrollment.
                    </p>
                </div>

                <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {isLoadingPlans || !baseLink
                        ? Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-[560px] rounded-2xl border border-[#e6ebf3] bg-white p-5">
                                <div className="h-6 w-40 rounded bg-gray-100 animate-pulse" />
                                <div className="mt-2 h-4 w-48 rounded bg-gray-100 animate-pulse" />
                                <div className="mt-6 h-12 w-36 rounded-lg bg-gray-100 animate-pulse" />
                                <div className="mt-4 h-24 rounded-xl bg-gray-100 animate-pulse" />
                                <div className="mt-6 h-10 rounded-lg bg-gray-100 animate-pulse" />
                                <div className="mt-5 h-24 w-24 rounded-xl bg-gray-100 animate-pulse" />
                            </div>
                        ))
                        : options.map((option) => (
                            <ReferralCard
                                key={option.key}
                                option={option}
                                qrCode={qrCodes[option.link]}
                                copied={copiedKey === option.key}
                                onCopy={() => copyLink(option)}
                                onShare={(platform) => handleShare(platform, option)}
                                onDownloadQr={() => downloadQrCode(option)}
                            />
                        ))}
                </div>
            </section>

            {/* Pro tip */}
            {showProTip && (
                <div className="relative flex gap-3 sm:gap-4 rounded-2xl border border-[#d9e5fb] bg-[#eef4ff] p-4 pr-11 sm:p-5 sm:pr-14">
                    <Lightbulb className="size-6 sm:size-7 shrink-0 text-[#0a5cff]" strokeWidth={1.75} />
                    <div>
                        <p className="font-heading font-bold text-[#0a5cff]">Pro Tip</p>
                        <p className="mt-1 text-sm leading-relaxed text-gray-600">
                            Share the most relevant plan with your audience. For example, share the Student ID link with
                            students, Homemaker link with homemakers, and Standard link for general audience.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={dismissProTip}
                        aria-label="Dismiss tip"
                        className="absolute right-3 top-3 sm:right-4 sm:top-4 flex size-8 items-center justify-center rounded-full text-gray-500 hover:bg-white/70 hover:text-gray-700"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            )}

            {/* Assets Section */}
            <div className="space-y-5 pt-2">
                <div className="flex items-center justify-between">
                    <h2 className="px-1 sm:px-0 text-xl sm:text-[26px] font-heading font-bold text-gray-900">Promotional Assets</h2>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                                                {asset.drive_link && (
                                                    <Button size="sm" variant="outline" className="h-8 px-2 rounded-lg border-blue-200 text-[#0066ff] hover:bg-blue-50 text-[10px] font-bold gap-1" onClick={() => window.open(asset.drive_link, '_blank')}>
                                                        <UploadCloud className="w-3 h-3" /> DRIVE
                                                    </Button>
                                                )}
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
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 group-hover:text-[#0066ff]" aria-label="Copy template" onClick={() => {
                                                    navigator.clipboard.writeText(asset.content || '');
                                                    setCopiedKey(`template-${asset.id}`);
                                                    setTimeout(() => setCopiedKey((k) => (k === `template-${asset.id}` ? null : k)), 2000);
                                                }}>
                                                    {copiedKey === `template-${asset.id}` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
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
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-xs text-gray-300">
                                                    <span className="bg-white/10 px-2 py-0.5 rounded text-white">Full HD</span>
                                                    <span>MP4</span>
                                                </div>
                                                {asset.drive_link && (
                                                    <Button size="sm" variant="outline" className="h-8 px-3 rounded-xl border-white/20 text-white bg-white/10 hover:bg-white/20 backdrop-blur-md text-[10px] font-bold gap-2" onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(asset.drive_link, '_blank');
                                                    }}>
                                                        <UploadCloud className="w-3 h-3 text-blue-400" /> DOWNLOAD FROM DRIVE
                                                    </Button>
                                                )}
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
        </div>
    )
}

function ReferralCard({
    option,
    qrCode,
    copied,
    onCopy,
    onShare,
    onDownloadQr,
}: {
    option: ReferralOption
    qrCode?: string
    copied: boolean
    onCopy: () => void
    onShare: (platform: "whatsapp" | "telegram" | "native") => void
    onDownloadQr: () => void
}) {
    const Icon = option.icon
    return (
        <article className="flex flex-col rounded-2xl border border-[#e6ebf3] bg-white p-4 sm:p-5 xl:p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_28px_-20px_rgba(16,24,40,0.2)]">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    {Icon && <Icon className="size-6 shrink-0 text-[#0a5cff]" strokeWidth={1.75} />}
                    <h3 className="text-[17px] font-heading font-bold leading-snug text-gray-900">{option.title}</h3>
                </div>
                {option.badge && (
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-[#e8f0ff] px-2.5 py-1 text-xs font-semibold text-[#0a5cff]">
                        {option.badge}
                    </span>
                )}
            </div>
            {option.description && <p className="mt-1 text-sm text-gray-500">{option.description}</p>}

            {option.price !== null && (
                <p className="mt-4 text-[40px] sm:text-5xl font-heading font-bold tracking-tight text-[#0a5cff] tabular-nums leading-none">
                    {rupees(option.price)}
                </p>
            )}

            {option.commissionCents !== null && (
                <div className="mt-4 rounded-xl bg-[#eef4ff] px-4 py-3 text-center">
                    <p className="text-sm font-semibold text-gray-800">Your Commission</p>
                    <p className="mt-0.5 text-[28px] sm:text-[32px] font-heading font-bold leading-tight text-[#0a5cff] tabular-nums">
                        {rupees(option.commissionCents / 100)}
                    </p>
                    <p className="text-sm text-gray-600">per successful enrollment</p>
                </div>
            )}

            <label className="mt-4 text-sm font-medium text-gray-700" htmlFor={`ref-link-${option.key}`}>
                Your Referral Link
            </label>
            <div className="mt-1.5 flex gap-2">
                <input
                    id={`ref-link-${option.key}`}
                    readOnly
                    value={option.link}
                    onFocus={(e) => e.currentTarget.select()}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-[#e3e8f1] bg-[#f8fafd] px-3 text-sm text-gray-700 outline-none focus:border-[#0a5cff]/50 focus:ring-2 focus:ring-[#0a5cff]/15"
                />
                <button
                    type="button"
                    onClick={onCopy}
                    className={cn(
                        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold text-white transition-colors",
                        copied ? "bg-emerald-500" : "bg-[#0a5cff] hover:bg-[#0050e0]"
                    )}
                >
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>

            <div className="mt-4 flex items-center gap-4">
                <button
                    type="button"
                    onClick={onDownloadQr}
                    title="Download QR code"
                    className="shrink-0 rounded-xl border border-[#e3e8f1] bg-white p-2 shadow-sm transition-shadow hover:shadow-md"
                >
                    {qrCode ? (
                        <img src={qrCode} alt={`QR code for the ${option.title} referral link`} className="size-20 sm:size-[84px]" />
                    ) : (
                        <div className="size-20 sm:size-[84px] rounded-md bg-gray-100 animate-pulse" />
                    )}
                </button>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Scan QR Code</p>
                    <p className="text-xs text-gray-500">Share this link via offline / in-person</p>
                    <button
                        type="button"
                        onClick={onDownloadQr}
                        disabled={!qrCode}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#0a5cff] hover:underline disabled:opacity-50"
                    >
                        <Download className="size-3.5" />
                        Download PNG
                    </button>
                </div>
            </div>

            <div className="mt-4 flex gap-2 pt-0.5">
                <button
                    type="button"
                    onClick={() => onShare("whatsapp")}
                    className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 xl:gap-1 rounded-lg bg-[#25D366] px-2 xl:px-1.5 text-[13px] xl:text-xs font-semibold text-white transition-colors hover:bg-[#1fbd5a]"
                >
                    <MessageCircle className="size-4 shrink-0" fill="currentColor" fillOpacity={0.25} />
                    WhatsApp
                </button>
                <button
                    type="button"
                    onClick={() => onShare("telegram")}
                    className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 xl:gap-1 rounded-lg bg-[#229ED9] px-2 xl:px-1.5 text-[13px] xl:text-xs font-semibold text-white transition-colors hover:bg-[#1c8fc6]"
                >
                    <Send className="size-4 shrink-0" />
                    Telegram
                </button>
                <button
                    type="button"
                    onClick={() => onShare("native")}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 xl:gap-1 rounded-lg border border-[#e3e8f1] bg-white px-3 xl:px-2.5 text-[13px] xl:text-xs font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                >
                    <Share2 className="size-4 shrink-0" />
                    Share
                </button>
            </div>
        </article>
    )
}
