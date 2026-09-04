import type * as SQLite from "expo-sqlite";
import { type ScheduleModel, ScheduleSchema } from "../models/schedule.model";
import { BaseRepository } from "./base.repository";

export class ScheduleRepository extends BaseRepository {
  private mapRow(row: any): ScheduleModel {
    return ScheduleSchema.parse({
      id: row.id,
      name: row.name,
      schedule_list: JSON.parse(row.schedule_list),
      temporary: Boolean(row.temporary),
    });
  }

  async create(schedule: ScheduleModel, db?: SQLite.SQLiteDatabase) {
    return await this.run(
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
      db ?? undefined,
    );
  }

  async findById(id: string): Promise<ScheduleModel | null> {
    const row = await this.first<
      Omit<ScheduleModel, "schedule_list"> & { schedule_list: string } // convert the array into string first since data from DB is a string array
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

  async exists(id: string): Promise<boolean> {
    const row = await this.first<{ id: string }>(
      `SELECT id FROM schedules WHERE id = ?`,
      [id],
    );
    return !!row;
  }

  async findAll(db?: SQLite.SQLiteDatabase): Promise<ScheduleModel[]> {
    const rows = await this.all(
      `
      SELECT * FROM schedules
      `,
      [],
      db,
    );

    return rows.map((r) => this.mapRow(r));
  }

  async markAsPermanent(payload: { name: string; id: string }): Promise<void> {
    const { name, id } = payload;
    await this.run(
      `
      UPDATE schedules
      SET
        name = ?,
        temporary = 0
      WHERE id = ?
      `,
      [name, id],
    );
  }
}
