export function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <defs>
        <clipPath id="logo-clip">
          <rect width="64" height="64" rx="16" />
        </clipPath>
      </defs>
      <g clipPath="url(#logo-clip)">
        <rect width="64" height="64" fill="#ffcc00" />
        <rect y="44" width="64" height="20" fill="#e4202c" />
      </g>
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fontSize="32"
        fontWeight="900"
        fill="#06173d"
        fontFamily="var(--font-kannada), sans-serif"
      >
        ಗೊ
      </text>
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight text-gold ${className}`}>
      Nomore<span className="line-through decoration-flagred decoration-4">Gottilla</span>
    </span>
  );
}
