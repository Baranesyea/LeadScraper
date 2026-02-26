import React from "react";
import { interpolate } from "remotion";

export const GridBackground: React.FC<{ frame: number }> = ({ frame }) => {
  const pulse = Math.sin(frame * 0.04) * 0.5 + 0.5;
  const drift = interpolate(frame, [0, 510], [0, -40]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#020817",
        overflow: "hidden",
      }}
    >
      {/* Grid lines */}
      <svg
        style={{ position: "absolute", inset: 0, opacity: 0.15 + pulse * 0.08 }}
        width="1080"
        height="1080"
      >
        <defs>
          <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse" x={drift} y={drift}>
            <path d="M 54 0 L 0 0 0 54" fill="none" stroke="#00c8ff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="1080" height="1080" fill="url(#grid)" />
      </svg>

      {/* Radial glow center */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 70% at 50% 50%, rgba(0,150,255,${0.06 + pulse * 0.04}) 0%, transparent 70%)`,
        }}
      />

      {/* Corner accent top-left */}
      <div
        style={{
          position: "absolute",
          top: -60,
          left: -60,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,100,255,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Corner accent bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: -60,
          right: -60,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,200,200,0.14) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Scan line */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 2,
          top: `${((frame * 2.5) % 1100) - 20}px`,
          background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.4), transparent)",
          filter: "blur(1px)",
        }}
      />
    </div>
  );
};
