import type { Activation } from "./domain/Activation";

export interface ActivationRepository {
  execute(payload: Activation): Promise<void>;
}
