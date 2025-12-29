"use client"

import MDEditor from "@uiw/react-md-editor";

interface MarkdownViewerProps {
    source: string;
    style?: React.CSSProperties;
}

export default function MarkdownViewer({ source, style }: MarkdownViewerProps) {
    return (
        <div data-color-mode="dark">
            <MDEditor.Markdown source={source} style={style} />
        </div>
    );
}
