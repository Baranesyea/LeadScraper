import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";

export const IntroScene: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();

  // Logo box scales in
  const logoScale = spring({ frame, fps, config: { stiffness: 180, damping: 18 } });

  // "floeey" letters stagger in
  const letters = "floeey".split("");

  // Tagline fades in after logo
  const taglineOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [35, 55], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Underline width expands
  const lineWidth = interpolate(frame, [50, 75], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scene exit — whole thing slides up and fades
  const exitOpacity = interpolate(frame, [75, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitY = interpolate(frame, [75, 90], [0, -24], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: exitOpacity,
        transform: `translateY(${exitY}px)`,
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Hex badge */}
        <div
          style={{
            width: 80,
            height: 80,
            background: "linear-gradient(135deg, #0066ff 0%, #00d4ff 100%)",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px rgba(0,150,255,0.5), 0 0 80px rgba(0,100,255,0.2)",
            marginBottom: 20,
          }}
        >
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            {/* Abstract "F" flow shape */}
            <path d="M10 10 L10 34" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <path d="M10 10 L30 10" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <path d="M10 22 L24 22" stroke="white" strokeWidth="4" strokeLinecap="round" />
            {/* Flow arrow */}
            <circle cx="34" cy="32" r="4" fill="white" opacity="0.9" />
            <path d="M24 32 Q29 32 34 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        {/* Brand name */}
        <div style={{ display: "flex", gap: 2 }}>
          {letters.map((letter, i) => {
            const lOpacity = interpolate(frame - i * 4, [0, 12], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const lY = interpolate(frame - i * 4, [0, 12], [20, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <span
                key={i}
                style={{
                  fontSize: 72,
                  fontWeight: 800,
                  fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  letterSpacing: "-2px",
                  color: "white",
                  opacity: lOpacity,
                  transform: `translateY(${lY}px)`,
                  display: "inline-block",
                }}
              >
                {letter}
              </span>
            );
          })}
        </div>

        {/* Accent line */}
        <div
          style={{
            height: 3,
            width: lineWidth,
            background: "linear-gradient(90deg, #0066ff, #00d4ff)",
            borderRadius: 2,
            marginTop: 8,
            boxShadow: "0 0 12px rgba(0,200,255,0.6)",
          }}
        />
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          fontSize: 18,
          fontWeight: 400,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          color: "rgba(180,210,255,0.8)",
          letterSpacing: "3px",
          textTransform: "uppercase",
        }}
      >
        Autonomous Workforce
      </div>
    </div>
  );
};
