// Marca INDEX: um "X" formado por 4 folhas/pétalas que se encontram no centro.
export function IndexLogo({
  className,
  primary = "#2d2a8c",
  accent = "#c6e84d",
}: {
  className?: string;
  primary?: string;
  accent?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* diagonal "\" — cor primária */}
      <ellipse cx="33" cy="33" rx="24" ry="10" transform="rotate(45 33 33)" fill={primary} />
      <ellipse cx="67" cy="67" rx="24" ry="10" transform="rotate(45 67 67)" fill={primary} />
      {/* diagonal "/" — cor de destaque */}
      <ellipse cx="67" cy="33" rx="24" ry="10" transform="rotate(-45 67 33)" fill={accent} />
      <ellipse cx="33" cy="67" rx="24" ry="10" transform="rotate(-45 33 67)" fill={accent} />
    </svg>
  );
}

// Marca completa: logo + wordmark "INDEX".
export function IndexWordmark({
  className,
  textClassName = "text-white",
  primary,
  accent,
}: {
  className?: string;
  textClassName?: string;
  primary?: string;
  accent?: string;
}) {
  return (
    <span className={`flex items-center gap-2 ${className ?? ""}`}>
      <IndexLogo className="h-7 w-7" primary={primary} accent={accent} />
      <span className={`text-xl font-extrabold tracking-tight ${textClassName}`}>
        INDEX
      </span>
    </span>
  );
}
