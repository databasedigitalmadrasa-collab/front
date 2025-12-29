"use client"

import dynamic from "next/dynamic";
import React from "react";

const MarkdownViewer = dynamic(() => import("@/components/MarkdownViewer"), {
    ssr: false,
    loading: () => <div className="p-4 text-white/50">Loading content...</div>
});

export default function MarkdownClientWrapper({ source }: { source: string }) {
    return <MarkdownViewer source={source} style={{ background: 'transparent', color: 'inherit' }} />;
}
