import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
// Forest theme
import '@videojs/themes/dist/forest/index.css';

interface VideoPlayerProps {
    options: any;
    onReady?: (player: any) => void;
}

export const VideoPlayer = (props: VideoPlayerProps) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const { options, onReady } = props;

    useEffect(() => {
        // Make sure Video.js player is only initialized once
        if (!playerRef.current) {
            if (!videoRef.current) return;

            // Create a video element within the ref div
            const videoElement = document.createElement("video-js");
            videoElement.classList.add('vjs-big-play-centered');
            // Add the theme class
            videoElement.classList.add('vjs-theme-forest');
            videoRef.current.appendChild(videoElement);

            const player = playerRef.current = videojs(videoElement, options, () => {
                videojs.log('player is ready');

                // Add error listener for retrying
                player.on('error', () => {
                    const error = player.error();
                    if (!error) return;

                    // Check for network errors (code 4) or specific status codes if available
                    // Video.js code 4 encompasses MEDIA_ERR_SRC_NOT_SUPPORTED, which often happens on 403/404
                    if (error.code === 4) {
                        console.log('Video error detected, attempting to refresh source...');

                        // We need to trigger a refresh of the signed URL. 
                        // Since we are using an API route that redirects, re-fetching the same URL 
                        // theoretically gets a *fresh* signed URL from the backend if it decides to generate a new one.
                        // However, to force the browser to actually make a new request and not use cache,
                        // we can append a timestamp.

                        const currentSrc = player.currentSrc();
                        if (currentSrc && currentSrc.includes('/api/video')) {
                            const url = new URL(currentSrc, window.location.href);
                            // Add or update a 'retry' param to force a fresh request
                            url.searchParams.set('retry', Date.now().toString());

                            const currentTime = player.currentTime();
                            console.log('Reloading video from:', currentTime);

                            // Reload the source with the new timestamp
                            player.src({ src: url.toString(), type: 'video/mp4' });
                            player.load();
                            player.currentTime(currentTime);
                            player.play()?.catch((e: unknown) => console.error("Auto-play failed after retry", e));
                        }
                    }
                });

                if (onReady) {
                    onReady(player);
                }
            });
        } else {
            // You can update player in the else block here if needed
            const player = playerRef.current;

            // Update src if it changes
            if (options.sources) {
                player.src(options.sources);
            }

            if (options.autoplay) {
                player.autoplay(options.autoplay);
            }
        }
    }, [options, videoRef]);

    // Dispose the player when the component unmounts
    useEffect(() => {
        const player = playerRef.current;

        return () => {
            if (player && !player.isDisposed()) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, [playerRef]);

    return (
        <div data-vjs-player>
            <div ref={videoRef} className="w-full h-full" />
        </div>
    );
}

export default VideoPlayer;
