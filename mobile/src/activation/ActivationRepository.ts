import type { CreationPayload } from "@/type/services/activationService.types";

export interface ActivationRepository {
  create(payload: CreationPayload): Promise<void>;
}

// ActivationRepository
//     create()
//     update()
//     delete()

// ActiveScheduleQueryRepository
//     findDayConflicts()
//     findRangeConflicts()
//     findCurrent()
//     findNext()
