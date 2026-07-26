import type { ComponentType } from "react";

import { StepOneKit } from "@/components/landing/step-illustration/step-one";
import { StepThreeGrid } from "@/components/landing/step-illustration/step-three";
import { StepTwoPlug } from "@/components/landing/step-illustration/step-two";

export type HowItWorksStepId = "01" | "02" | "03";

/** Pinned isometric illustrations: 01 Kit · 02 Plug · 03 Grid */
export const STEP_ILLUSTRATIONS: Record<HowItWorksStepId, ComponentType> = {
  "01": StepOneKit,
  "02": StepTwoPlug,
  "03": StepThreeGrid,
};
