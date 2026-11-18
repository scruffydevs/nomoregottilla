/** A round character badge. When `active` (the character is speaking), it glows and pulses. */
export function Avatar({ emoji, active = false, size = "md" }: { emoji: string; active?: boolean; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-9 w-9 text-xl" : size === "lg" ? "h-16 w-16 text-4xl" : "h-12 w-12 text-3xl";
  return (
    <span
      aria-hidden
      className={`relative inline-grid shrink-0 place-items-center rounded-full border-2 align-middle transition ${dim} ${
        active ? "border-gold bg-gold/25 shadow-[0_0_0_4px_rgba(255,204,0,0.25)]" : "border-navy3 bg-ink/60"
      }`}
    >
      {active && <span className="absolute inset-0 animate-ping rounded-full border-2 border-gold/70" />}
      <span className="relative">{emoji}</span>
    </span>
  );
}
