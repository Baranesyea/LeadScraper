import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { GridBackground } from "./scenes/GridBackground";
import { IntroScene } from "./scenes/IntroScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { SolutionScene } from "./scenes/SolutionScene";
import { FeaturesScene } from "./scenes/FeaturesScene";
import { CtaScene } from "./scenes/CtaScene";

// Scene timeline (at 30fps):
//   0 – 90:   Intro        (3s)
//  80 – 200:  Problem      (4s, overlaps intro exit)
// 185 – 310:  Solution     (4.2s, overlaps problem exit)
// 295 – 440:  Features     (4.8s, overlaps solution exit)
// 420 – 510:  CTA          (3s, overlaps features exit)

export const FloeeyVideo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* Persistent animated background — always visible */}
      <GridBackground frame={frame} />

      {/* ── Intro ── */}
      <Sequence from={0} durationInFrames={92}>
        <IntroScene frame={frame} />
      </Sequence>

      {/* ── Problem ── overlaps intro exit */}
      <Sequence from={80} durationInFrames={120}>
        <ProblemScene frame={frame - 80} />
      </Sequence>

      {/* ── Solution ── overlaps problem exit */}
      <Sequence from={185} durationInFrames={130}>
        <SolutionScene frame={frame - 185} />
      </Sequence>

      {/* ── Features ── overlaps solution exit */}
      <Sequence from={295} durationInFrames={135}>
        <FeaturesScene frame={frame - 295} />
      </Sequence>

      {/* ── CTA ── overlaps features exit */}
      <Sequence from={420} durationInFrames={90}>
        <CtaScene frame={frame - 420} />
      </Sequence>
    </AbsoluteFill>
  );
};
