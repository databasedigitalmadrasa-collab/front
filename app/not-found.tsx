import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center grid-background p-4 text-center">
            <div className="space-y-6 max-w-md mx-auto">
                {/* Large 404 Heading */}
                <h1 className="text-[150px] font-bold leading-none text-[#0056FF] dark:text-[#0056FF] select-none">
                    404
                </h1>

                <div className="space-y-2">
                    <h2 className="text-3xl font-bold font-heading text-navyBlack dark:text-white">
                        Page Not Found
                    </h2>
                    <p className="text-muted-foreground">
                        Oops! The page you're looking for seems to have wandered off into the digital void.
                    </p>
                </div>

                <div className="pt-4">
                    <Link href="/">
                        <Button size="lg" className="rounded-full px-8 bg-[#0056FF] hover:bg-[#0046cc] text-white">
                            Return Home
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Footer copyright similar to main layout if needed, or simple text */}
            <div className="absolute bottom-8 text-sm text-muted-foreground/60">
                &copy; {new Date().getFullYear()} Digital Madrasa
            </div>
        </div>
    )
}
