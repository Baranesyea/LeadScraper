import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { Clock, Users, AlertTriangle } from "lucide-react";

const StatPill: React.FC<{
  icon: React.FC<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  frame: number;
  delay: number;
  fps: number;
}> = ({ icon: Icon, label, frame, delay, fps }) => {
  const f = frame - delay;
  const scale = spring({ frame: f, fps, config: { stiffness: 260, damping: 22 } });
  const opacity = interpolate(f, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "rgba(255,50,50,0.08)",
        border: "1px solid rgba(255,80,80,0.25)",
        borderRadius: 12,
        padding: "14px 22px",
        backdropFilter: "blur(8px)",
      }}
    >
      <Icon size={22} color="#ff6060" strokeWidth={1.5} />
      <span
        style={{
          fontSize: 16,
          color: "rgba(255,180,180,0.9)",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  );
};

export const ProblemScene: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();

  const headlineOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineX = interpolate(frame, [0, 18], [-30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit
  const exitOpacity = interpolate(frame, [95, 110], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitX = interpolate(frame, [95, 110], [0, -40], {
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
        justifyContent: "center",
        padding: "0 72px",
        opacity: exitOpacity,
        transform: `translateX(${exitX}px)`,
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: 13,
          letterSpacing: "4px",
          textTransform: "uppercase",
          color: "#ff6060",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          fontWeight: 600,
          marginBottom: 20,
          opacity: headlineOpacity,
        }}
      >
        The Problem
      </div>

      {/* Headline */}
      <div
        style={{
          opacity: headlineOpacity,
          transform: `translateX(${headlineX}px)`,
        }}
      >
        <div
          style={{
            fontSize: 54,
            fontWeight: 800,
            color: "white",
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            lineHeight: 1.1,
            letterSpacing: "-1.5px",
          }}
        >
          Repetitive work
          <br />
          <span style={{ color: "#ff6060" }}>kills</span> your team.
        </div>
      </div>

      {/* Sub */}
      <div
        style={{
          opacity: subOpacity,
          marginTop: 20,
          fontSize: 18,
          color: "rgba(180,210,255,0.65)",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          lineHeight: 1.6,
          maxWidth: 500,
        }}
      >
        Manual processes drain time, cause errors, and block growth at scale.
      </div>

      {/* Stat pills */}
      <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 12 }}>
        <StatPill icon={Clock} label="40% of work is manual & repetitive" frame={frame} delay={30} fps={fps} />
        <StatPill icon={Users} label="Teams stuck doing ops instead of growth" frame={frame} delay={45} fps={fps} />
        <StatPill icon={AlertTriangle} label="Human errors cost businesses millions" frame={frame} delay={60} fps={fps} />
      </div>
    </div>
  );
};
