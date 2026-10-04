import type { CSSProperties } from "react";

const INK = "#0e0e0e";
const SUN = "#ffd23f";
const WHITE = "#ffffff";

/** Eight gear teeth radiating from the centre of the bulb. */
function GearTeeth() {
  const teeth = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 8;
    const inner = 12;
    const outer = 17;
    return {
      x1: 60 + Math.cos(angle) * inner,
      y1: 50 + Math.sin(angle) * inner,
      x2: 60 + Math.cos(angle) * outer,
      y2: 50 + Math.sin(angle) * outer,
    };
  });
  return (
    <g stroke={INK} strokeWidth={5} strokeLinecap="butt">
      {teeth.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
      ))}
    </g>
  );
}

/**
 * The IIC bulb: gear inside a bulb, drawn with hard black rules.
 * Flip `on` to light it — glass fills yellow, rays appear, gear spins.
 */
export function BulbIcon({
  on = false,
  className = "",
  style,
}: {
  on?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      style={style}
      role="img"
      aria-label={on ? "Bulb lit" : "Bulb off"}
    >
      {on && (
        <g stroke={INK} strokeWidth={6} strokeLinecap="butt">
          <line x1="60" y1="2" x2="60" y2="14" />
          <line x1="20" y1="16" x2="28" y2="25" />
          <line x1="100" y1="16" x2="92" y2="25" />
          <line x1="4" y1="50" x2="17" y2="50" />
          <line x1="116" y1="50" x2="103" y2="50" />
        </g>
      )}

      {/* glass */}
      <circle
        cx="60"
        cy="50"
        r="30"
        fill={on ? SUN : WHITE}
        stroke={INK}
        strokeWidth={6}
        style={
          on
            ? { animation: "nb-glow 2.4s ease-in-out infinite" }
            : undefined
        }
      />

      {/* gear */}
      <g
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          animation: on ? "nb-spin 7s linear infinite" : "none",
        }}
      >
        <GearTeeth />
        <circle
          cx="60"
          cy="50"
          r="11"
          fill="none"
          stroke={INK}
          strokeWidth={5}
        />
        <circle cx="60" cy="50" r="4" fill={INK} />
      </g>

      {/* neck + screw base */}
      <path
        d="M44 74 L47 88 H73 L76 74"
        fill={on ? SUN : WHITE}
        stroke={INK}
        strokeWidth={6}
        strokeLinejoin="miter"
      />
      <line x1="46" y1="95" x2="74" y2="95" stroke={INK} strokeWidth={6} />
      <line x1="50" y1="105" x2="70" y2="105" stroke={INK} strokeWidth={6} />
      <line x1="55" y1="114" x2="65" y2="114" stroke={INK} strokeWidth={6} />
    </svg>
  );
}

/** Overlapping flat circles lifted from the IIC identity mark. */
export function CircleCluster({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <g style={{ mixBlendMode: "multiply" }}>
        <circle cx="78" cy="82" r="58" fill="#7b3fe4" />
        <circle cx="132" cy="86" r="52" fill="#ff8a3d" />
        <circle cx="104" cy="132" r="46" fill="#ff5c4d" />
        <circle cx="152" cy="52" r="17" fill="#35a7ff" />
        <circle cx="34" cy="140" r="12" fill="#7b3fe4" />
        <circle cx="172" cy="140" r="9" fill="#ff8a3d" />
      </g>
    </svg>
  );
}

/** Bulb + cell name — the corner mark used across the app. */
export function IicLockup({
  on = false,
  compact = false,
}: {
  on?: boolean;
  compact?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="relative inline-block size-10 shrink-0 border-[3px] border-ink bg-white">
        <CircleCluster className="absolute inset-0 size-full" />
        <BulbIcon
          on={on}
          className="absolute inset-0 size-full p-0.5"
        />
      </span>
      <span className="leading-none">
        <span className="nb-display block text-[15px]">IIC</span>
        {!compact && (
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-ink/70">
            Innovation and Incubation Cell
          </span>
        )}
      </span>
    </span>
  );
}
