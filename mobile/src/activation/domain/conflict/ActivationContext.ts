import type { CreationPayload } from "@/type/services/activationService.types";

export type ActivationContext = {
  payload: CreationPayload;
  overwrite: boolean;
};
