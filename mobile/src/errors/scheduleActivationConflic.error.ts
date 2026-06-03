import { BusinessError } from "./business.error";

export class ScheduleActivationConflic extends BusinessError {
  constructor() {
    super("Schedule activation conflic with an existing active schedule");
  }
}
