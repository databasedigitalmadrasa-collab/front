import { svgIds } from "@/components/affiliate/leaderboard-art"

/*
 * Earnings page illustrations (pure inline SVG).
 *
 * Both render once per page and use fixed id prefixes ("ea-growth", "ea-trophy")
 * rather than useId(): useId values differ between the server and client trees
 * in this app, which breaks hydration of url(#id) references.
 *
 * <EarningsGrowthArt />: four glass bars rising left to right with a curved
 * growth arrow, for the top-right corner of the profile header. viewBox 200x170;
 * it fades into the page toward the left and the bottom, so the header text can
 * run over its left part.
 */

const BOTTOM = 172

// x: front-left corner, t: top of the front face, core: blue strength
const BARS = [
  { x: 55, t: 137, core: 0.12 },
  { x: 88.5, t: 121, core: 0.5 },
  { x: 122, t: 95, core: 0.8 },
  { x: 157, t: 57, core: 1 },
]

function GlassBar({ x, t, core }: { x: number; t: number; core: number }) {
  const r = x + 22
  const s = x + 35
  return (
    <g>
      <path d={`M${x} ${t}L${r} ${t + 1}V${BOTTOM}H${x}Z`} fill="#eaf2ff" opacity=".85" />
      <path d={`M${x} ${t}L${r} ${t + 1}V${BOTTOM}H${x}Z`} fill="url(#ea-growth-front)" opacity={core} />
      <path d={`M${x} ${t}L${r} ${t + 1}V${BOTTOM}H${x}Z`} fill="url(#ea-growth-rim)" opacity={core} />
      <path d={`M${x} ${t}H${x + 6}V${BOTTOM}H${x}Z`} fill="url(#ea-growth-strip)" />
      <path d={`M${r} ${t + 1}L${s} ${t - 4}V${BOTTOM}H${r}Z`} fill="url(#ea-growth-side)" />
      <path d={`M${x} ${t}L${r} ${t + 1}L${s} ${t - 4}L${x + 13} ${t - 5}Z`} fill="url(#ea-growth-top)" />
      <path
        d={`M${x} ${t}L${r} ${t + 1}L${s} ${t - 4}M${r} ${t + 1}V${BOTTOM}M${s} ${t - 4}V${BOTTOM}M${x + 0.6} ${t + 1}V${BOTTOM}`}
        stroke="#fff"
        strokeWidth=".7"
        strokeLinejoin="round"
        opacity=".85"
      />
      <path d={`M${x} ${t}L${x + 13} ${t - 5}L${s} ${t - 4}`} stroke="#fff" strokeWidth=".5" opacity=".7" />
    </g>
  )
}

export function EarningsGrowthArt({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 170"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <radialGradient id="ea-growth-glow">
          <stop offset="0" stopColor="#d9e6ff" stopOpacity=".9" />
          <stop offset="1" stopColor="#e8f0ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ea-growth-front">
          <stop offset="0" stopColor="#a9c9ff" />
          <stop offset=".16" stopColor="#6ea4ff" />
          <stop offset=".36" stopColor="#3a7af4" />
          <stop offset=".68" stopColor="#2a6cf0" />
          <stop offset=".9" stopColor="#4a86f6" />
          <stop offset="1" stopColor="#8ab3ff" />
        </linearGradient>
        <linearGradient id="ea-growth-rim" x2="0" y2="1">
          <stop offset="0" stopColor="#1546c8" stopOpacity=".35" />
          <stop offset=".1" stopColor="#1546c8" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".85" />
        </linearGradient>
        <linearGradient id="ea-growth-strip">
          <stop offset="0" stopColor="#fff" stopOpacity=".85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ea-growth-side">
          <stop offset="0" stopColor="#b4cdfc" stopOpacity=".9" />
          <stop offset=".6" stopColor="#cfdffe" stopOpacity=".85" />
          <stop offset="1" stopColor="#e6efff" stopOpacity=".9" />
        </linearGradient>
        <linearGradient id="ea-growth-top" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#d3e3ff" />
        </linearGradient>
        <linearGradient id="ea-growth-shaft" gradientUnits="userSpaceOnUse" x1="90" y1="95" x2="168" y2="24">
          <stop offset="0" stopColor="#a9c9ff" stopOpacity="0" />
          <stop offset=".3" stopColor="#78a9fc" stopOpacity=".5" />
          <stop offset=".7" stopColor="#3f80f5" stopOpacity=".95" />
          <stop offset="1" stopColor="#2766ee" />
        </linearGradient>
        <linearGradient id="ea-growth-head" x1="0" y1=".3" x2="1" y2=".7">
          <stop offset="0" stopColor="#6ea4ff" />
          <stop offset=".45" stopColor="#3576f3" />
          <stop offset="1" stopColor="#1f5de6" />
        </linearGradient>
        <linearGradient id="ea-growth-fx" gradientUnits="userSpaceOnUse" x1="38" x2="128" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <linearGradient id="ea-growth-fy" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="118" y2="169">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".55" stopColor="#fff" stopOpacity=".6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id="ea-growth-b1" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <filter id="ea-growth-b3" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <mask id="ea-growth-mx" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="170">
          <rect width="200" height="170" fill="url(#ea-growth-fx)" />
        </mask>
        <mask id="ea-growth-my" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="170">
          <rect width="200" height="170" fill="url(#ea-growth-fy)" />
        </mask>
      </defs>

      <g mask="url(#ea-growth-my)">
        <g mask="url(#ea-growth-mx)">
          {/* soft haze behind the chart */}
          <ellipse cx="148" cy="112" rx="62" ry="58" fill="url(#ea-growth-glow)" opacity=".7" />

          {/* growth arrow: glow, tapered shaft, then the head */}
          <path
            d="M90 95C126 71 143 59.5 166.5 23.5"
            stroke="#8fb9ff"
            strokeWidth="5"
            strokeLinecap="round"
            opacity=".35"
            filter="url(#ea-growth-b3)"
          />
          <path d="M90.3 95.5C126.8 72 144.8 60.9 169 25.1L164 21.9C141.2 58.1 125.2 70 89.7 94.5Z" fill="url(#ea-growth-shaft)" />
          <path d="M104 85C126 71 140 61 160 32" stroke="#fff" strokeWidth=".6" strokeLinecap="round" opacity=".45" />
          <path
            d="M180 5.6 154.4 16.6 155.3 21.3 166 24.2 172.6 33.9 177.9 33.1Z"
            fill="url(#ea-growth-head)"
            stroke="url(#ea-growth-head)"
            strokeWidth=".8"
            strokeLinejoin="round"
          />
          <path d="M180 5.6 177.9 33.1 175.6 32.6 177.2 10Z" fill="#a8caff" opacity=".85" />
          <path d="M157 16.2 177.6 7.4" stroke="#fff" strokeWidth=".8" strokeLinecap="round" opacity=".5" />

          {/* glass bars */}
          {BARS.map((bar) => (
            <GlassBar key={bar.x} {...bar} />
          ))}
        </g>
      </g>
    </svg>
  )
}

/**
 * <MilestoneTrophy />: the upright version of the Leaderboard banner trophy
 * (same cup, star and palette) with celebration confetti, for the milestone
 * card. viewBox 160x160.
 */
export function MilestoneTrophy({ className }: { className?: string }) {
  const { id, url, href } = svgIds("ea-trophy")

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <radialGradient id={id("glow")}>
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset=".45" stopColor="#fff" stopOpacity=".3" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("bowl")}>
          <stop offset="0" stopColor="#5c97fd" />
          <stop offset=".12" stopColor="#78aaff" />
          <stop offset=".3" stopColor="#4a87fb" />
          <stop offset=".56" stopColor="#2766ee" />
          <stop offset=".84" stopColor="#184dd6" />
          <stop offset="1" stopColor="#3b76f0" />
        </linearGradient>
        <linearGradient id={id("shade")} x2="0" y2="1">
          <stop offset="0" stopColor="#0a36b0" stopOpacity=".25" />
          <stop offset=".16" stopColor="#0a36b0" stopOpacity="0" />
          <stop offset=".6" stopColor="#0a36b0" stopOpacity="0" />
          <stop offset="1" stopColor="#0a36b0" stopOpacity=".45" />
        </linearGradient>
        <linearGradient id={id("lipF")}>
          <stop offset="0" stopColor="#a3c8ff" />
          <stop offset=".2" stopColor="#77a9ff" />
          <stop offset=".55" stopColor="#3a76f1" />
          <stop offset=".85" stopColor="#2157dc" />
          <stop offset="1" stopColor="#4a83f3" />
        </linearGradient>
        <linearGradient id={id("lipT")} x2="1" y2="1">
          <stop offset="0" stopColor="#d6e7ff" />
          <stop offset=".45" stopColor="#a2c4ff" />
          <stop offset="1" stopColor="#6798f5" />
        </linearGradient>
        <linearGradient id={id("inner")} x2="0" y2="1">
          <stop offset="0" stopColor="#1546c8" />
          <stop offset=".6" stopColor="#2a63e2" />
          <stop offset="1" stopColor="#4a85f2" />
        </linearGradient>
        <linearGradient id={id("hL")}>
          <stop offset="0" stopColor="#8fbfff" />
          <stop offset=".45" stopColor="#4c8cfb" />
          <stop offset="1" stopColor="#1f5de6" />
        </linearGradient>
        <linearGradient id={id("hR")}>
          <stop offset="0" stopColor="#1546cc" />
          <stop offset=".6" stopColor="#2260e8" />
          <stop offset="1" stopColor="#3a78f2" />
        </linearGradient>
        <linearGradient id={id("metal")}>
          <stop offset="0" stopColor="#5a93fc" />
          <stop offset=".25" stopColor="#3473f3" />
          <stop offset=".6" stopColor="#1a55e0" />
          <stop offset=".9" stopColor="#1546c8" />
          <stop offset="1" stopColor="#2f6aea" />
        </linearGradient>
        <linearGradient id={id("metalT")} x2="1" y2="1">
          <stop offset="0" stopColor="#a9caff" />
          <stop offset=".5" stopColor="#5389f6" />
          <stop offset="1" stopColor="#2459dc" />
        </linearGradient>
        <radialGradient id={id("starF")} cx=".35" cy=".3" r=".75">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".5" stopColor="#eaf1ff" />
          <stop offset="1" stopColor="#b5cbf8" />
        </radialGradient>
        <linearGradient id={id("starS")} x2="1" y2="1">
          <stop offset="0" stopColor="#bcd2ff" />
          <stop offset="1" stopColor="#5a84e4" />
        </linearGradient>
        <filter id={id("b1")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <filter id={id("b3")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <path id={id("hl")} d="M-43 8C-51 5-59 3.5-64.5 4.5-70 5.5-71.5 11-71 20L-70.5 36C-70 46-64 53-55 57L-41 61" />
        <path id={id("hr")} d="M43 12C51 10 58 8.5 63 8.5 70 8.5 73 13 72.5 22L71 40C70 52 64 60 52 65L36 71" />
        <path id={id("bw")} d="M-50 0C-50 37-45.5 63-29 80-21 88-12 92-9 98H9C12 92 21 88 29 80 45.5 63 50 37 50 0Z" />
        <path
          id={id("st")}
          d="M0-18 5.05-6.96 17.12-5.56 8.18 2.66 10.58 14.56 0 8.6-10.58 14.56-8.18 2.66-17.12-5.56-5.05-6.96Z"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        <path id={id("sp")} d="M0-10C1-2 2-1 10 0 2 1 1 2 0 10-1 2-2 1-10 0-2-1-1-2 0-10Z" />
        <clipPath id={id("cup")}>
          <use href={href("bw")} />
        </clipPath>
      </defs>

      {/* glow behind the cup and a soft floor shadow */}
      <circle cx="80" cy="70" r="62" fill={url("glow")} opacity=".9" />
      <ellipse cx="80" cy="150" rx="40" ry="5" fill="#1f4fd0" opacity=".14" filter={url("b3")} />

      {/* confetti */}
      <g strokeLinecap="round">
        <path d="M17 56 27 61" stroke="#3b7cf4" strokeWidth="4.5" />
        <path d="M118 13 114 26" stroke="#38c3e0" strokeWidth="5" />
        <path d="M126 54 137 48" stroke="#2f6df6" strokeWidth="4.5" />
        <path d="M33 131 29 139" stroke="#5b93fa" strokeWidth="4.5" />
      </g>
      <use href={href("sp")} fill="#2f6df6" transform="translate(36 30) scale(.95)" />
      <use href={href("sp")} fill="#2f6df6" transform="translate(134 100) scale(.85)" />
      <use href={href("sp")} fill="#86b2ff" transform="translate(24 104) scale(.6)" />

      {/* trophy */}
      <g transform="translate(80 38) scale(.74)">
        <g strokeLinecap="round">
          <use href={href("hl")} stroke={url("hL")} strokeWidth="13" />
          <path d="M-49 3.2C-56 1.5-62 1-66 2-72 3.5-73.5 10-73 19L-72.5 34" stroke="#fff" strokeWidth="4" opacity=".35" filter={url("b1")} />
          <use href={href("hr")} stroke={url("hR")} strokeWidth="13" />
          <use href={href("hr")} stroke="#062b9a" strokeWidth="4" opacity=".3" filter={url("b1")} transform="translate(-3 2)" />
          <path d="M49 8.4C55 7 60 6.5 64 6.5 69 6.6 72 9 73 14" stroke="#cfe2ff" strokeWidth="3.5" opacity=".4" filter={url("b1")} />
        </g>

        {/* stepped base */}
        <g transform="translate(0 112)">
          <path d="M-32 9V27A32 7 0 0 0 32 27V9Z" fill={url("metal")} />
          <ellipse cy="9" rx="32" ry="7" fill={url("metalT")} />
          <path d="M-31.4 8A32 7 0 0 1 6 2.2" stroke="#e1eeff" strokeWidth="1.2" opacity=".7" />
          <path d="M-20 0V5A20 4.6 0 0 0 20 5V0Z" fill={url("metal")} />
          <ellipse rx="20" ry="4.6" fill={url("metalT")} />
        </g>
        <path d="M-7 101C-6.5 105-8.5 108-17 111.5A17 4.2 0 0 0 17 111.5C8.5 108 6.5 105 7 101Z" fill={url("metal")} />
        <path d="M-5.4 103C-5.5 106-7.5 108.5-13 110.6" stroke="#d6e8ff" strokeWidth="2" opacity=".45" filter={url("b1")} />

        <use href={href("bw")} fill={url("bowl")} />
        <use href={href("bw")} fill={url("shade")} />
        <g clipPath={url("cup")}>
          <ellipse cx="-35" cy="34" rx="7" ry="27" fill="#fff" opacity=".42" filter={url("b3")} transform="rotate(-10 -35 34)" />
          <ellipse cx="-38" cy="24" rx="2.2" ry="11" fill="#fff" opacity=".75" filter={url("b1")} transform="rotate(-8 -38 24)" />
          <path d="M49 8C48 38 42 63 26 79" stroke="#94bfff" strokeWidth="5" opacity=".5" filter={url("b1")} />
        </g>
        <ellipse cy="99" rx="13" ry="4.5" fill={url("metal")} />
        <ellipse cy="97.7" rx="11.4" ry="3.1" fill={url("metalT")} />

        {/* rolled lip and the inside of the cup */}
        <path d="M-51 0A51 11 0 0 0 51 0V7A51 11 0 0 1-51 7Z" fill={url("lipF")} />
        <path d="M-51 7A51 11 0 0 0 51 7" stroke="#0a3cc0" strokeWidth="1.8" opacity=".35" />
        <path d="M-49 4A50 11 0 0 0-18 14" stroke="#fff" strokeWidth="3" opacity=".45" filter={url("b1")} />
        <ellipse rx="51" ry="11" fill={url("lipT")} />
        <ellipse cx="2" cy="-1.6" rx="41" ry="4.6" fill={url("inner")} />
        <path d="M-39-1.6A41 4.6 0 0 1 43-1.6" stroke="#06309f" strokeWidth="2.2" opacity=".35" filter={url("b1")} />
        <path d="M-44-3.4A47 8.6 0 0 1 8-8.5" stroke="#fff" strokeWidth="2.2" opacity=".6" filter={url("b1")} />

        {/* star emblem */}
        <g transform="translate(0 44) scale(1.06)">
          <use href={href("st")} fill="#0a33a8" stroke="#0a33a8" opacity=".4" filter={url("b1")} transform="translate(2.4 3)" />
          <use href={href("st")} fill={url("starS")} stroke={url("starS")} transform="translate(1.2 1.6)" />
          <use href={href("st")} fill={url("starF")} stroke={url("starF")} />
          <ellipse cx="-4" cy="-6" rx="3" ry="5" fill="#fff" opacity=".7" filter={url("b1")} transform="rotate(30 -4 -6)" />
        </g>
      </g>
    </svg>
  )
}
