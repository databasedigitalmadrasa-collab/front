"use client"

import { useId } from "react"

/*
 * Leaderboard illustration artwork (pure inline SVG).
 *
 * <LeaderboardTrophy />: glossy blue trophy and glass bar chart for the banner's
 * bottom-right corner. The viewBox (260x128) is cropped to the visible area and
 * anchored xMaxYMax, so it fills the banner height and runs off the bottom edge:
 *   desktop: absolute right-0 top-0 h-full w-auto
 *   mobile:  absolute -right-[18px] top-[2px] h-[calc(100%-2px)] w-auto
 * The sparkles and the light arc have plain class names so a breakpoint can tone
 * them down (the desktop design shows neither), for example:
 *   md:[&_.lb-trophy-sparkles]:hidden md:[&_.lb-trophy-arc]:opacity-15
 *
 * <RankMedal rank={1 | 2 | 3} />: medal for the top three rows. viewBox 32x40,
 * so the width is 0.8x the height (h-7 w-[22.4px] or h-9 w-[28.8px]).
 */

export function svgIds(base: string) {
  return {
    id: (name: string) => `${base}-${name}`,
    url: (name: string) => `url(#${base}-${name})`,
    href: (name: string) => `#${base}-${name}`,
  }
}

function useSvgIds(prefix: string) {
  return svgIds(prefix + useId().replace(/[^a-zA-Z0-9]/g, ""))
}

export function LeaderboardTrophy({ className }: { className?: string }) {
  // The page renders a single, server-rendered trophy. useId() values differ
  // between the server and client trees here (Next's dev segment nodes shift
  // them), which fails hydration, so the trophy uses a fixed prefix instead.
  const { id, url, href } = svgIds("lb-trophy")

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 260 128"
      fill="none"
      preserveAspectRatio="xMaxYMax meet"
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
        <linearGradient id={id("arc")}>
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".16" stopColor="#eaf3ff" stopOpacity=".6" />
          <stop offset=".5" stopColor="#eaf3ff" stopOpacity=".2" />
          <stop offset=".82" stopColor="#fff" stopOpacity=".45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("barL")} x2="1" y2="1">
          <stop offset="0" stopColor="#eef4ff" />
          <stop offset=".55" stopColor="#c4daff" stopOpacity=".9" />
          <stop offset="1" stopColor="#8ab3ff" stopOpacity=".7" />
        </linearGradient>
        <linearGradient id={id("barR")} x2="0" y2="1">
          <stop offset="0" stopColor="#6ea4ff" />
          <stop offset="1" stopColor="#3a7af4" />
        </linearGradient>
        <linearGradient id={id("barT")} x2="1" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#dbe9ff" />
        </linearGradient>
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
        <linearGradient id={id("fade")} x2="0" y2="1">
          <stop offset=".35" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity=".2" />
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
        <mask id={id("fadeM")} maskUnits="userSpaceOnUse" x="-40" y="-8" width="80" height="40">
          <rect x="-40" y="-8" width="80" height="40" fill={url("fade")} />
        </mask>
      </defs>

      {/* ambient light and lens glow */}
      <ellipse cx="150" cy="62" rx="86" ry="60" fill={url("glow")} opacity=".22" />
      <ellipse cx="108" cy="86" rx="88" ry="15" fill={url("glow")} opacity=".16" />

      <g className="lb-trophy-arc">
        <path d="M-4 100Q90 40 262 50" stroke={url("arc")} strokeWidth="4" opacity=".4" filter={url("b1")} />
        <path d="M-4 100Q90 40 262 50" stroke={url("arc")} strokeWidth="1.1" />
      </g>

      {/* glass bar chart */}
      <path d="M10 99.5 28 104V130H10Z" fill={url("barL")} />
      <path d="M28 104 41 100.5V130H28Z" fill={url("barR")} opacity=".85" />
      <path d="M10 99.5 23 96 41 100.5 28 104Z" fill={url("barT")} />
      <path d="M55 73 75 77.5V130H55Z" fill={url("barL")} />
      <path d="M75 77.5 89 74V130H75Z" fill={url("barR")} opacity=".85" />
      <path d="M55 73 69 69.5 89 74 75 77.5Z" fill={url("barT")} />
      <path d="M13.5 100.4 18.5 101.6 13.5 130H10V117ZM59 73.9 64 75 58 130H55V100Z" fill="#fff" opacity=".22" />
      <path
        d="M10 99.5 28 104 41 100.5M28 104V130M55 73 75 77.5 89 74M75 77.5V130"
        stroke="#fff"
        strokeWidth=".8"
        strokeLinejoin="round"
        opacity=".75"
      />

      {/* trophy */}
      <g transform="translate(146 30) rotate(10) scale(.74 .8)">
        <g strokeLinecap="round">
          <use href={href("hl")} stroke={url("hL")} strokeWidth="13" />
          <path d="M-49 3.2C-56 1.5-62 1-66 2-72 3.5-73.5 10-73 19L-72.5 34" stroke="#fff" strokeWidth="4" opacity=".35" filter={url("b1")} />
          <use href={href("hr")} stroke={url("hR")} strokeWidth="13" />
          <use href={href("hr")} stroke="#062b9a" strokeWidth="4" opacity=".3" filter={url("b1")} transform="translate(-3 2)" />
          <path d="M49 8.4C55 7 60 6.5 64 6.5 69 6.6 72 9 73 14" stroke="#cfe2ff" strokeWidth="3.5" opacity=".4" filter={url("b1")} />
        </g>

        <g transform="translate(0 112) rotate(-5)" mask={url("fadeM")}>
          <path d="M-30 8V32H30V8Z" fill={url("metal")} />
          <ellipse cy="8" rx="30" ry="6.5" fill={url("metalT")} />
          <path d="M-29.4 7A30 6.5 0 0 1 6 1.6" stroke="#e1eeff" strokeWidth="1.2" opacity=".7" />
          <path d="M-19 0V4A19 4.5 0 0 0 19 4V0Z" fill={url("metal")} />
          <ellipse rx="19" ry="4.5" fill={url("metalT")} />
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
        <g transform="translate(-10 44) rotate(-4) scale(1.06)">
          <use href={href("st")} fill="#0a33a8" stroke="#0a33a8" opacity=".4" filter={url("b1")} transform="translate(2.4 3)" />
          <use href={href("st")} fill={url("starS")} stroke={url("starS")} transform="translate(1.2 1.6)" />
          <use href={href("st")} fill={url("starF")} stroke={url("starF")} />
          <ellipse cx="-4" cy="-6" rx="3" ry="5" fill="#fff" opacity=".7" filter={url("b1")} transform="rotate(30 -4 -6)" />
        </g>
      </g>

      <g className="lb-trophy-sparkles" fill="#fff">
        <circle cx="205" cy="17" r="13" fill={url("glow")} opacity=".35" />
        <use href={href("sp")} transform="translate(205 17) scale(.72)" />
        <use href={href("sp")} transform="translate(227 33) scale(.3)" opacity=".7" />
        <circle cx="221" cy="62" r="9" fill={url("glow")} opacity=".3" />
        <use href={href("sp")} transform="translate(221 62) scale(.52)" />
        <circle cx="243" cy="49" r=".9" opacity=".8" />
        <use href={href("sp")} transform="translate(213 108) scale(.34)" opacity=".7" />
      </g>
    </svg>
  )
}

const MEDAL_COLORS = {
  1: {
    band: "#ee9410",
    strapR: "#fbb126",
    strapL: ["#ffd978", "#fdbb32"],
    strapHi: "#fff3c4",
    rim: ["#ffcf55", "#ef9407"],
    face: ["#ffe07a", "#ffbe2e", "#f6a514"],
    num: "#ee9c12",
    numHi: "#ffe9a3",
  },
  2: {
    band: "#2766d8",
    strapR: "#3f88f2",
    strapL: ["#8cc6ff", "#5aa2f8"],
    strapHi: "#dff0ff",
    rim: ["#e3e6ea", "#959ba4"],
    face: ["#f6f7f9", "#d3d7dc", "#b4b9c0"],
    num: "#a0a5ad",
    numHi: "#f7f8fa",
  },
  3: {
    band: "#cf500c",
    strapR: "#f26e26",
    strapL: ["#ffa461", "#fb8233"],
    strapHi: "#ffdcbf",
    rim: ["#ffa358", "#d85810"],
    face: ["#ffbb80", "#fa8a3e", "#ec6d20"],
    num: "#d85e16",
    numHi: "#ffc99e",
  },
} as const

const MEDAL_NUMERALS = {
  1: "M14 23.6 16.8 21.6V31.4",
  2: "M13.1 24C13.3 20.9 18.9 20.8 18.9 23.9 18.9 26.2 15.9 27.5 13.1 31.3H19.1",
  3: "M13.3 22.6C14.5 21 18.8 20.9 18.8 23.7 18.8 25.5 16.9 26.2 15.6 26.2 17.2 26.2 19.1 26.9 19.1 28.9 19.1 31.9 14.5 32.1 13 30.2",
} as const

export function RankMedal({ rank, className }: { rank: 1 | 2 | 3; className?: string }) {
  const { id, url } = useSvgIds("lbm")
  const c = MEDAL_COLORS[rank]
  const numeral = MEDAL_NUMERALS[rank]

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 40"
      fill="none"
      role="img"
      aria-label={`Rank ${rank}`}
      className={className}
    >
      <defs>
        <linearGradient id={id("l")} x2="0" y2="1">
          <stop offset="0" stopColor={c.strapL[0]} />
          <stop offset="1" stopColor={c.strapL[1]} />
        </linearGradient>
        <linearGradient id={id("r")} x2="0" y2="1">
          <stop offset="0" stopColor={c.rim[0]} />
          <stop offset="1" stopColor={c.rim[1]} />
        </linearGradient>
        <radialGradient id={id("f")} cx=".36" cy=".3" r=".8">
          <stop offset="0" stopColor={c.face[0]} />
          <stop offset=".55" stopColor={c.face[1]} />
          <stop offset="1" stopColor={c.face[2]} />
        </radialGradient>
      </defs>
      {/* ribbon: back of the band, right strap, then the left strap in front */}
      <path d="M13 1h6l-1.6 4.6h-2.8z" fill={c.band} />
      <path d="M27.3 1H19l-5.5 15.5 8 1L28 2.2Q28.5 1 27.3 1z" fill={c.strapR} />
      <path d="M4.7 1H13l5.5 15.5-8 1L4 2.2Q3.5 1 4.7 1z" fill={url("l")} />
      <path d="M5.9 2.2 11.9 16.6" stroke={c.strapHi} strokeWidth="1.1" strokeLinecap="round" opacity=".7" />
      {/* disc */}
      <circle cx="16" cy="26.5" r="12.3" fill={url("r")} />
      <circle cx="16" cy="26.5" r="9.4" fill={url("f")} stroke={c.rim[1]} strokeWidth=".7" strokeOpacity=".55" />
      <path d="M5.8 22.8A10.85 10.85 0 0 1 11.4 16.7" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity=".6" />
      {/* embossed numeral: light offset copy under the darker stroke */}
      <g strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={numeral} stroke={c.numHi} opacity=".8" transform="translate(.45 .55)" />
        <path d={numeral} stroke={c.num} />
      </g>
    </svg>
  )
}
