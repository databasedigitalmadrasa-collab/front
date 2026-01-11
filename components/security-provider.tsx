"use client"

import { useEffect } from "react"

export default function SecurityProvider() {
    useEffect(() => {
        // Disable right-click with capture to ensure we intercept first
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            return false
        }

        // Disable developer tools shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // F12
            if (e.key === "F12" || e.keyCode === 123) {
                e.preventDefault()
                e.stopPropagation()
                return false
            }

            // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Windows/Linux)
            if (e.ctrlKey && e.shiftKey) {
                const key = e.key.toLowerCase();
                if (key === 'i' || key === 'j' || key === 'c' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67) {
                    e.preventDefault()
                    e.stopPropagation()
                    return false
                }
            }

            // Cmd+Option+I, Cmd+Option+J, Cmd+Option+C (Mac)
            if (e.metaKey && e.altKey) {
                const key = e.key.toLowerCase();
                if (key === 'i' || key === 'j' || key === 'c' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67) {
                    e.preventDefault()
                    e.stopPropagation()
                    return false
                }
            }

            // Ctrl+U (View Source)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
                e.preventDefault()
                e.stopPropagation()
                return false
            }
        }

        // Prevent selection to discourage inspecting elements
        const handleSelectStart = (e: Event) => {
            // Allow selection in input/textarea only
            if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                e.preventDefault()
            }
        }

        // Add listeners with capture: true to intercept events before they reach other handlers
        document.addEventListener("contextmenu", handleContextMenu, { capture: true })
        document.addEventListener("keydown", handleKeyDown, { capture: true })
        document.addEventListener("selectstart", handleSelectStart, { capture: true })

        // Debugger trap (optional, stronger anti-debugging)
        const debugInterval = setInterval(() => {
            // This will pause execution if devtools is open
            // eslint-disable-next-line no-debugger
            // debugger;
        }, 1000);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu, { capture: true })
            document.removeEventListener("keydown", handleKeyDown, { capture: true })
            document.removeEventListener("selectstart", handleSelectStart, { capture: true })
            clearInterval(debugInterval);
        }
    }, [])

    return null
}
