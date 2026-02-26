import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { Cpu, Zap, Bot } from "lucide-react";

export const SolutionScene: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();

  // Reveal clip-path — circle expanding from center
  const clipRadius = interpolate(frame, [0, 25], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headlineScale = spring({ frame: frame - 10, fps, config: { stiffness: 200, damping: 20 } });
  const headlineOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Orbit ring
  const orbitAngle = (frame / 90) * 2 * Math.PI;
  const orbitX = Math.cos(orbitAngle) * 180;
  const orbitY = Math.sin(orbitAngle) * 60;

  const orbitAngle2 = orbitAngle + (2 * Math.PI) / 3;
  const orbitX2 = Math.cos(orbitAngle2) * 180;
  const orbitY2 = Math.sin(orbitAngle2) * 60;

  const orbitAngle3 = orbitAngle + (4 * Math.PI) / 3;
  const orbitX3 = Math.cos(orbitAngle3) * 180;
  const orbitY3 = Math.sin(orbitAngle3) * 60;

  const orbitOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit
  const exitOpacity = interpolate(frame, [100, 115], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitY = interpolate(frame, [100, 115], [0, 20], {
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
        clipPath: `circle(${clipRadius}% at 50% 50%)`,
        opacity: exitOpacity,
        transform: `translateY(${exitY}px)`,
      }}
    >
      {/* Bright reveal overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,100,255,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Orbit system */}
      <div
        style={{
          position: "relative",
          width: 200,
          height: 200,
          marginBottom: 32,
          opacity: orbitOpacity,
        }}
      >
        {/* Center node */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 64,
            height: 64,
            background: "linear-gradient(135deg, #0066ff, #00d4ff)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 30px rgba(0,150,255,0.6), 0 0 60px rgba(0,100,255,0.3)",
          }}
        >
          <Cpu size={28} color="white" strokeWidth={1.5} />
        </div>

        {/* Orbit ring */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 360,
            height: 120,
            transform: "translate(-50%, -50%)",
            border: "1px solid rgba(0,200,255,0.2)",
            borderRadius: "50%",
          }}
        />

        {/* Orbiting nodes */}
        {[
          { x: orbitX, y: orbitY, Icon: Bot, color: "#0066ff" },
          { x: orbitX2, y: orbitY2, Icon: Zap, color: "#00d4ff" },
          { x: orbitX3, y: orbitY3, Icon: Cpu, color: "#0099ff" },
        ].map(({ x, y, Icon, color }, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              width: 36,
              height: 36,
              background: color,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 16px ${color}88`,
            }}
          >
            <Icon size={18} color="white" strokeWidth={1.5} />
          </div>
        ))}
      </div>

      {/* Text */}
      <div
        style={{
          textAlign: "center",
          transform: `scale(${headlineScale})`,
          opacity: headlineOpacity,
        }}
      >
        <div
          style={{
            fontSize: 13,
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "#00d4ff",
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          The Solution
        </div>
        <div
          style={{
            fontSize: 58,
            fontWeight: 800,
            color: "white",
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            lineHeight: 1.05,
            letterSpacing: "-2px",
          }}
        >
          Digital
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #0066ff, #00d4ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Workers.
          </span>
        </div>
      </div>

      <div
        style={{
          opacity: subOpacity,
          marginTop: 20,
          fontSize: 17,
          color: "rgba(180,210,255,0.7)",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          textAlign: "center",
          maxWidth: 480,
          lineHeight: 1.6,
          padding: "0 40px",
        }}
      >
        AI-powered agents that work 24/7 — no breaks, no errors, no limits.
      </div>
    </div>
  );
};
