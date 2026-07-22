export type Step = "understanding" | "creating" | "parsing";

export const STEP_LABELS: Record<Step, string> = {
	understanding: "Understanding your request...",
	creating: "Creating your schedule...",
	parsing: "Parsing AI response...",
};

export const STEP_ORDER: Step[] = ["understanding", "creating", "parsing"];

export const UNDERSTANDING_DELAY = 600;
