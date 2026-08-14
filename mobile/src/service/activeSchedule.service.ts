import type { CreationPayload } from "@/type/services/activationService.types";
import { ActivationRepository } from "../activation/ActivationRepository";
import type { AddActivationService } from "../activation/AddActivationService";
import type { ActiveScheduleRepository } from "../repository/activeSchedule.repo";

export class ActiveScheduleService {
  constructor(
    private readonly addActivationService: AddActivationService,
    private readonly activeScheduleRepository: ActiveScheduleRepository,
  ) {}

  async createAsync(payload: { activationPayload: CreationPayload; overwrite: boolean }) {
    return this.addActivationService.add({
      payload: payload.activationPayload,
      overwrite: payload.overwrite,
    });
  }
}
