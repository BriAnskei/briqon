export type Step = "sending" | "understanding" | "creating";

export const STEP_LABELS: Record<Step, string> = {
  sending: "Sending request...",
  understanding: "Understanding your request...",
  creating: "Creating your schedule...",
};

export const STEP_ORDER: Step[] = ["sending", "understanding", "creating"];

export const UNDERSTANDING_DELAY = 600;
