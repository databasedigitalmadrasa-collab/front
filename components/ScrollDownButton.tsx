
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ScrollDownButton: React.FC = () => {
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Threshold to detect if we are near the bottom (within 100px)
      const scrolledToBottom = 
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      
      setIsAtBottom(scrolledToBottom);
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const smoothScroll = (targetY: number, duration: number) => {
    const start = window.scrollY;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeInOutQuad for smooth start and finish
      const ease = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      window.scrollTo(0, start + (targetY - start) * ease);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  const handleClick = () => {
    if (isAtBottom) {
      // Scroll back to top relatively quickly (1.5 seconds)
      smoothScroll(0, 1500);
    } else {
      // Very slow cinematic crawl to the bottom (45 seconds)
      const bottom = document.body.scrollHeight - window.innerHeight;
      smoothScroll(bottom, 45000);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-3 right-3 md:bottom-8 md:right-8 z-[60] w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(0,86,255,0.4)] hover:shadow-[0_0_40px_rgba(0,86,255,0.6)] hover:scale-110 active:scale-95 transition-all duration-500 group ${
        isAtBottom ? 'bg-navyBlack rotate-0' : 'bg-royalBlue animate-bounce'
      }`}
      aria-label={isAtBottom ? "Scroll to top" : "Scroll to bottom"}
    >
      <div className={`absolute inset-0 rounded-full opacity-20 pointer-events-none animate-ping ${
        isAtBottom ? 'bg-white' : 'bg-royalBlue'
      }`}></div>
      
      {isAtBottom ? (
        <ChevronUp className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:-translate-y-1 transition-transform" />
      ) : (
        <ChevronDown className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:translate-y-1 transition-transform" />
      )}
    </button>
  );
};

export default ScrollDownButton;
