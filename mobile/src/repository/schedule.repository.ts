import { Schedule, ScheduleSchema } from "../models/schedule.model";
import { BaseRepository } from "./base.repository";

export class ScheduleRepository extends BaseRepository {
  private mapRow(row: any): Schedule {
    return {
      id: row.id,
      name: row.name,
      schedule_list: JSON.parse(row.schedule_list),
      temporary: Boolean(row.temporary),
    };
  }

  async create(schedule: Schedule) {
    await this.run(
      `
    INSERT INTO schedules (
      id,
      name,
      schedule_list,
      temporary
    )
    VALUES (?, ?, ?, ?)
    `,
      [
        schedule.id,
        schedule.name,
        JSON.stringify(schedule.schedule_list),
        schedule.temporary ? 1 : 0,
      ],
    );
  }

  async findById(id: string): Promise<Schedule | null> {
    const row = await this.first<
      Omit<Schedule, "schedule_list"> & { schedule_list: string } // convert the array into string first since data from DB is a string array
    >(
      `
    SELECT * FROM schedules WHERE id = ?
    `,
      [id],
    );

    if (!row) throw new Error("Schedule does not exist");

    const mappedData = this.mapRow(row);
    return mappedData;
  }

  async findAll(): Promise<Schedule[]> {
    const rows = await this.all(`
      SELECT * FROM schedules
      `);

    return rows.map((r) => this.mapRow(r));
  }
}
