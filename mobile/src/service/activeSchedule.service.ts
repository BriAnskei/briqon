import type { CreationPayload } from "@/type/services/activationService.types";
import type { CreateActivationInput } from "@/type/ui/schedule/activation.types";
import { ActivationRepository } from "../activation/ActivationRepository";
import type { AddActivationService } from "../activation/AddActivationService";
import type { ActiveScheduleRepository } from "../repository/activeSchedule.repo";

export class ActiveScheduleService {
  constructor(
    private readonly addActivationService: AddActivationService,
    private readonly activeScheduleRepository: ActiveScheduleRepository,
  ) {}

  async createAsync(input: CreateActivationInput) {
    return this.addActivationService.add(input);
  }
}
