import { CreationPayload } from "@/type/services/activationService.types";
import { ActivationRepository } from "../activation/ActivationRepository";
import { AddActivationService } from "../activation/AddActivationService";

export class ActiveScheduleService {
  constructor(
    private readonly addActivationService: AddActivationService,
    private readonly activationRepository: ActivationRepository,
  ) {}

  async createAsync(payload: { activationPayload: CreationPayload; overwrite: boolean }) {
    return this.addActivationService.add({
      payload: payload.activationPayload,
      overwrite: payload.overwrite,
    });
  }
}
