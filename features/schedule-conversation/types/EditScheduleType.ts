export type ItemUIState =
  | { status: "idle" }
  | { status: "actions" }
  | { status: "editing"; prompt: string }
  | { status: "queued_edit"; prompt: string } // prompt saved, awaiting Done
  | { status: "pending_delete" };
