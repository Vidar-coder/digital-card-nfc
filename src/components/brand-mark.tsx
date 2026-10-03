/**
 * Platform mark: a card with NFC waves. Written with inline styles only so the
 * same JSX renders in the DOM and inside next/og ImageResponse (icons).
 */
export function BrandMark({ size = 32, padded = false }: { size?: number; padded?: boolean }) {
  const inset = padded ? size * 0.12 : 0;
  const inner = size - inset * 2;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: padded ? "#4f46e5" : "transparent",
      }}
    >
      <div
        style={{
          width: inner,
          height: inner,
          borderRadius: inner * 0.26,
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={inner * 0.62} height={inner * 0.62} viewBox="0 0 24 24" fill="none">
          <path d="M6 8.5a5 5 0 0 1 0 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M10 6a9 9 0 0 1 0 12" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
          <path d="M14 3.5a13 13 0 0 1 0 17" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.65" />
        </svg>
      </div>
    </div>
  );
}
