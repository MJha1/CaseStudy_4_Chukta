/**
 * "Sign in" — an arrow entering a circle that contains a person. Recreated from
 * the reference as inline SVG so it inherits currentColor (Chukta green) and
 * scales cleanly. Match its box size to the surrounding icons via className.
 */
export function SignInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {/* enclosing circle */}
      <circle cx="14" cy="12" r="8.3" stroke="currentColor" strokeWidth="1.7" />
      {/* person head */}
      <circle cx="14.2" cy="10" r="2.5" fill="currentColor" />
      {/* person shoulders (filled bust) */}
      <path d="M9.5 18.4c0-2.7 2.1-4.6 4.7-4.6s4.7 1.9 4.7 4.6" fill="currentColor" />
      {/* arrow shaft */}
      <path d="M2 12h6.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      {/* arrow head */}
      <path
        d="M5.9 9.2 8.9 12 5.9 14.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
