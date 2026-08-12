import { CreationPayload } from "@/type/services/activationService.types";

export interface ActivationRepository {
  create(payload: CreationPayload): Promise<void>;
}
