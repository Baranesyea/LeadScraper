import React from "react";
import { Composition } from "remotion";
import { FloeeyVideo } from "./FloeeyVideo";

export const Root: React.FC = () => (
  <Composition
    id="FloeeyVideo"
    component={FloeeyVideo}
    durationInFrames={510}
    fps={30}
    width={1080}
    height={1080}
  />
);
