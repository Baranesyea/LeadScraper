import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { ArrowUpRight } from "lucide-react";

export const CtaScene: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();

  // Wipe-in from bottom
  const clipY = interpolate(frame, [0, 20], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const logoScale = spring({ frame: frame - 15, fps, config: { stiffness: 200, damping: 18 } });
  const logoOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headlineOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineY = interpolate(frame, [25, 40], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const buttonScale = spring({ frame: frame - 45, fps, config: { stiffness: 300, damping: 18 } });
  const buttonOpacity = interpolate(frame, [45, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Shimmer effect
  const shimmer = interpolate(frame, [60, 120], [-150, 300], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const urlOpacity = interpolate(frame, [65, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse glow on logo
  const glowPulse = 0.6 + Math.sin(frame * 0.15) * 0.4;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        clipPath: `inset(${clipY}% 0 0 0)`,
        overflow: "hidden",
      }}
    >
      {/* Strong gradient bg overlay for CTA */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 90% 90% at 50% 50%, rgba(0,80,200,0.2) 0%, transparent 70%)",
        }}
      />

      {/* Horizontal divider line top */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: "10%",
          right: "10%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.3), transparent)",
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            background: "linear-gradient(135deg, #0066ff, #00d4ff)",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 ${30 * glowPulse}px rgba(0,150,255,0.7)`,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 44 44" fill="none">
            <path d="M10 10 L10 34" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <path d="M10 10 L30 10" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <path d="M10 22 L24 22" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <circle cx="34" cy="32" r="4" fill="white" opacity="0.9" />
            <path d="M24 32 Q29 32 34 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <span
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: "white",
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            letterSpacing: "-1px",
          }}
        >
          floeey
        </span>
      </div>

      {/* Main CTA headline */}
      <div
        style={{
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          textAlign: "center",
          marginBottom: 36,
          padding: "0 60px",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            lineHeight: 1.1,
            letterSpacing: "-1.5px",
            color: "white",
          }}
        >
          Automate
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #0066ff, #00d4ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Everything.
          </span>
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 16,
            color: "rgba(160,200,255,0.7)",
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            lineHeight: 1.5,
          }}
        >
          Your next digital worker is one click away.
        </div>
      </div>

      {/* CTA Button */}
      <div
        style={{
          opacity: buttonOpacity,
          transform: `scale(${buttonScale})`,
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #0055ee, #00aad4)",
          borderRadius: 16,
          padding: "18px 40px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 0 40px rgba(0,100,255,0.4), 0 8px 32px rgba(0,0,0,0.3)",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "white",
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            letterSpacing: "-0.3px",
          }}
        >
          Get Started Free
        </span>
        <ArrowUpRight size={22} color="white" strokeWidth={2} />

        {/* Shimmer */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 80,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
            transform: `translateX(${shimmer}px)`,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlOpacity,
          marginTop: 22,
          fontSize: 15,
          color: "rgba(120,180,255,0.6)",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          letterSpacing: "2px",
        }}
      >
        floeey.com
      </div>

      {/* Horizontal divider line bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: "10%",
          right: "10%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.3), transparent)",
        }}
      />
    </div>
  );
};
