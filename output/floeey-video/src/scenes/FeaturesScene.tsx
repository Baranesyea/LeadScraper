import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { Workflow, BrainCircuit, Plug, ArrowRight } from "lucide-react";

interface FeatureDef {
  Icon: React.FC<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  color: string;
  delay: number;
}

const features: FeatureDef[] = [
  {
    Icon: Workflow,
    title: "Process Automation",
    desc: "Map, automate, and optimize any business workflow end-to-end.",
    color: "#0066ff",
    delay: 5,
  },
  {
    Icon: BrainCircuit,
    title: "AI Digital Workers",
    desc: "Deploy intelligent agents that handle complex tasks autonomously.",
    color: "#00d4ff",
    delay: 20,
  },
  {
    Icon: Plug,
    title: "Seamless Integration",
    desc: "Connects to your existing tools — CRM, ERP, Slack, and more.",
    color: "#0099ff",
    delay: 35,
  },
];

const FeatureRow: React.FC<{
  feature: FeatureDef;
  frame: number;
  fps: number;
}> = ({ feature, frame, fps }) => {
  const { Icon, title, desc, color, delay } = feature;
  const f = frame - delay;

  const scale = spring({ frame: f, fps, config: { stiffness: 280, damping: 24 } });
  const opacity = interpolate(f, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(f, [0, 20], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px) scale(${scale})`,
        display: "flex",
        alignItems: "center",
        gap: 18,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${color}33`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 14,
        padding: "18px 22px",
        backdropFilter: "blur(6px)",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 48,
          height: 48,
          background: `${color}18`,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 0 20px ${color}30`,
        }}
      >
        <Icon size={24} color={color} strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "white",
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "rgba(160,200,255,0.7)",
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            lineHeight: 1.4,
          }}
        >
          {desc}
        </div>
      </div>

      <ArrowRight size={18} color={color} strokeWidth={1.5} style={{ flexShrink: 0, opacity: 0.6 }} />
    </div>
  );
};

export const FeaturesScene: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 15], [-20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit
  const exitOpacity = interpolate(frame, [110, 130], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitY = interpolate(frame, [110, 130], [0, -30], {
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
        padding: "0 66px",
        opacity: exitOpacity,
        transform: `translateY(${exitY}px)`,
      }}
    >
      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 32,
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
            marginBottom: 10,
          }}
        >
          What we do
        </div>
        <div
          style={{
            fontSize: 50,
            fontWeight: 800,
            color: "white",
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            lineHeight: 1.05,
            letterSpacing: "-1.5px",
          }}
        >
          Built for
          <br />
          scale.
        </div>
      </div>

      {/* Feature rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {features.map((f) => (
          <FeatureRow key={f.title} feature={f} frame={frame} fps={fps} />
        ))}
      </div>
    </div>
  );
};
