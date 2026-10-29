/*
 * "Earn With Referral" hero illustration (pure inline SVG): a pointed arch with
 * a hazy mosque seen through it and a stack of books in front, in the same soft
 * blue-and-white 3D style as the affiliate panel's trophy art.
 *
 * Renders once per page, so ids use the fixed "eh-" prefix rather than useId()
 * (useId values differ between the server and client trees in this app).
 */

const ARCH_OUTER = "M40 238V94C40 58 70 36 110 14C150 36 180 58 180 94V238Z"
const ARCH_INNER = "M62 238V98C62 72 84 54 110 38C136 54 158 72 158 98V238Z"

/** One book lying flat: front page-block, blue top cover and darker spine end. */
function Book({ x, y, w, h, tone }: { x: number; y: number; w: number; h: number; tone: "a" | "b" }) {
  const dx = 14
  const dy = 9
  return (
    <g>
      {/* spine end */}
      <path d={`M${x + w} ${y}L${x + w + dx} ${y - dy}V${y - dy + h}L${x + w} ${y + h}Z`} fill="#1848c0" />
      {/* page block between the covers */}
      <path d={`M${x} ${y + 1.6}H${x + w}V${y + h - 1.6}H${x}Z`} fill="#fff" />
      <path
        d={`M${x + 2} ${y + h * 0.42}H${x + w - 2}M${x + 2} ${y + h * 0.66}H${x + w - 2}`}
        stroke="#d5e2f8"
        strokeWidth=".7"
      />
      {/* cover edges */}
      <path d={`M${x} ${y}H${x + w}V${y + 1.8}H${x}Z`} fill={tone === "a" ? "#2a6cf0" : "#3d7df5"} />
      <path d={`M${x} ${y + h - 1.8}H${x + w}V${y + h}H${x}Z`} fill={tone === "a" ? "#1f5de6" : "#2f70f0"} />
      {/* top cover */}
      <path d={`M${x} ${y}L${x + dx} ${y - dy}H${x + w + dx}L${x + w} ${y}Z`} fill={`url(#eh-cover-${tone})`} />
      <path d={`M${x + 3} ${y - 1}L${x + dx + 2} ${y - dy + 0.6}`} stroke="#fff" strokeOpacity=".45" strokeWidth=".9" />
    </g>
  )
}

export function EarnHeroArt({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 250"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <radialGradient id="eh-glow">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="eh-frame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".5" stopColor="#f3f7ff" />
          <stop offset="1" stopColor="#d2e1fd" />
        </linearGradient>
        <linearGradient id="eh-depth" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#adc6f6" />
          <stop offset="1" stopColor="#cddcfc" />
        </linearGradient>
        <linearGradient id="eh-opening" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9d0fb" />
          <stop offset=".55" stopColor="#dce8ff" />
          <stop offset="1" stopColor="#f2f6ff" />
        </linearGradient>
        <linearGradient id="eh-reveal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9fbcf3" stopOpacity=".55" />
          <stop offset="1" stopColor="#9fbcf3" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="eh-dome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".6" stopColor="#e6efff" />
          <stop offset="1" stopColor="#c6d8fb" />
        </linearGradient>
        <linearGradient id="eh-wall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fbfdff" />
          <stop offset=".7" stopColor="#edf3ff" />
          <stop offset="1" stopColor="#d3e2fc" />
        </linearGradient>
        <linearGradient id="eh-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef4ff" stopOpacity=".1" />
          <stop offset="1" stopColor="#f4f8ff" stopOpacity=".55" />
        </linearGradient>
        <linearGradient id="eh-cover-a" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5b93fa" />
          <stop offset="1" stopColor="#2a6cf0" />
        </linearGradient>
        <linearGradient id="eh-cover-b" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7aa8fc" />
          <stop offset="1" stopColor="#3b7cf4" />
        </linearGradient>
        <filter id="eh-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="eh-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <clipPath id="eh-opening-clip">
          <path d={ARCH_INNER} />
        </clipPath>
      </defs>

      {/* glow behind the arch and the floor shadow */}
      <ellipse cx="110" cy="70" rx="100" ry="80" fill="url(#eh-glow)" />
      <ellipse cx="118" cy="240" rx="88" ry="8" fill="#2a5bd7" opacity=".13" filter="url(#eh-blur)" />

      {/* arch: depth behind, then the opening, then the front frame */}
      <path d={ARCH_OUTER} transform="translate(12 6)" fill="#7f9fe6" opacity=".22" filter="url(#eh-blur)" />
      <path d={ARCH_OUTER} transform="translate(9 -5)" fill="url(#eh-depth)" />
      <path d={ARCH_INNER} fill="url(#eh-opening)" />

      {/* mosque seen through the arch */}
      <g clipPath="url(#eh-opening-clip)">
        <ellipse cx="110" cy="214" rx="70" ry="16" fill="#f7faff" />
        {/* minarets */}
        {[70, 150].map((x) => (
          <g key={x}>
            <path d={`M${x - 3.5} 214V128H${x + 3.5}V214Z`} fill="url(#eh-wall)" />
            <path d={`M${x - 5} 150H${x + 5}V153H${x - 5}Z`} fill="#d7e4fc" />
            <path d={`M${x - 4.5} 128L${x} 112L${x + 4.5} 128Z`} fill="url(#eh-dome)" />
            <path d={`M${x} 112V106`} stroke="#c3d5f8" strokeWidth="1" strokeLinecap="round" />
          </g>
        ))}
        {/* side domes */}
        <path d="M78 182C78 172 84 166 90 166C96 166 102 172 102 182Z" fill="url(#eh-dome)" />
        <path d="M118 182C118 172 124 166 130 166C136 166 142 172 142 182Z" fill="url(#eh-dome)" />
        {/* main dome on its drum */}
        <path d="M92 170H128V180H92Z" fill="url(#eh-wall)" />
        <path d="M90 171C90 152 98 140 110 128C122 140 130 152 130 171Z" fill="url(#eh-dome)" />
        <path d="M95 166C95 152 101 143 108 135" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".9" />
        <path d="M110 128V118" stroke="#bcd1f7" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M110 112.5A3.2 3.2 0 1 0 113.2 117.6 2.5 2.5 0 1 1 110 112.5Z" fill="#bcd1f7" />
        {/* prayer hall */}
        <path d="M76 182H144V214H76Z" fill="url(#eh-wall)" />
        <path d="M76 182H144V185H76Z" fill="#dce7fc" />
        {[86, 100, 120, 134].map((x) => (
          <path key={x} d={`M${x - 3.5} 206V196C${x - 3.5} 192 ${x} 190 ${x} 190C${x} 190 ${x + 3.5} 192 ${x + 3.5} 196V206Z`} fill="#cddcf8" />
        ))}
        <path d="M106 214V198C106 193 110 191 110 191C110 191 114 193 114 198V214Z" fill="#bfd2f6" />
        {/* atmospheric haze and the reveal shadow on the opening's left wall */}
        <path d={ARCH_INNER} fill="url(#eh-haze)" />
        <path d="M62 238V98C62 72 84 54 110 38L118 43C92 60 74 78 74 102V238Z" fill="url(#eh-reveal)" />
      </g>

      {/* front frame */}
      <path d={`${ARCH_OUTER}${ARCH_INNER}`} fillRule="evenodd" fill="url(#eh-frame)" />
      <path d={ARCH_INNER} stroke="#c3d6fa" strokeWidth="1.2" />
      <path d="M43 236V95C43 61 71 40 107 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".9" filter="url(#eh-soft)" />
      <path d="M155 236V99C155 76 136 59 112 43" stroke="#c8d9fa" strokeWidth="1.4" strokeLinecap="round" opacity=".8" />

      {/* books */}
      <ellipse cx="160" cy="241" rx="46" ry="5" fill="#173f9e" opacity=".2" filter="url(#eh-soft)" />
      <Book x={118} y={229} w={76} h={11} tone="a" />
      <Book x={124} y={218} w={68} h={11} tone="b" />
      <Book x={120} y={207} w={72} h={11} tone="a" />
    </svg>
  )
}
