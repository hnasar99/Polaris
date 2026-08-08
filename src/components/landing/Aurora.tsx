"use client";

/**
 * Layered background for the hero: a masked grid plus three slow-drifting
 * colour fields. Decorative only — hidden from assistive tech and frozen by the
 * reduced-motion rules in globals.css.
 */
export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 mn-grid-mask" />

      <div className="mn-animate-drift absolute -left-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-cyan-500/18 blur-[110px]" />
      <div
        className="mn-animate-drift-slow absolute -right-40 -top-24 h-[30rem] w-[30rem] rounded-full bg-indigo-500/18 blur-[120px]"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="mn-animate-drift absolute left-1/3 top-64 h-[26rem] w-[26rem] rounded-full bg-teal-400/12 blur-[130px]"
        style={{ animationDelay: "-3s" }}
      />

      {/* Fades the hero into the next section. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#050b14]" />
    </div>
  );
}
