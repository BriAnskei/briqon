import {
  ActiveSchedule,
  CreateActiveSchedule,
} from "../models/active_schedule.model";
import { BaseRepository } from "./base.repository";
import * as SQLite from "expo-sqlite";

export class ActiveScheduleRepository extends BaseRepository {
  private mapRow(row: any): ActiveSchedule {
    return {
      id: row.id,
      schedule_id: row.schedule_id,
      active_type: row.active_type,
      recurring: !!row.repeat_weekly,
      starts_at: row.starts_at ? new Date(row.starts_at) : undefined,
      ends_at: row.ends_at ? new Date(row.ends_at) : undefined,
    };
  }

  async create(activeSchedule: ActiveSchedule, db?: SQLite.SQLiteDatabase) {
    return await this.run(
      `
      INSERT INTO active_schedules (
        id,
        schedule_id,
        active_type,
        recurring,
        starts_at,
        ends_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        activeSchedule.id,
        activeSchedule.schedule_id,
        activeSchedule.active_type,
        activeSchedule.recurring,
        activeSchedule.starts_at?.toISOString() ?? null,
        activeSchedule.ends_at?.toISOString() ?? null,
      ],
      db ?? undefined,
    );
  }

  async checkActivationConflict(starts_at: Date) {}

  async findById(id: string): Promise<ActiveSchedule | null> {
    const row = await this.first(
      `SELECT * FROM active_schedules WHERE id = ?`,
      [id],
    );

    if (!row) return null;
    return this.mapRow(row);
  }

  async findAll(): Promise<ActiveSchedule[]> {
    const rows = await this.all(`SELECT * FROM active_schedules`);

    return rows.map(this.mapRow);
  }

  async update(id: string, activeSchedule: Partial<ActiveSchedule>) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: ActiveSchedule = {
      ...existing,
      ...activeSchedule,
    };

    await this.run(
      `
      UPDATE active_schedules
      SET
        schedule_id = ?,
        specific_date = ?,
        selected_days = ?,
        repeat_weekly = ?,
        starts_at = ?,
        ends_at = ?
      WHERE id = ?
      `,
      [
        updated.schedule_id,
        updated.specific_date?.toISOString() ?? null,
        JSON.stringify(updated.selected_days),
        updated.repeat_weekly ? 1 : 0,
        updated.starts_at?.toISOString() ?? null,
        updated.ends_at?.toISOString() ?? null,
        id,
      ],
    );

    return updated;
  }

  async delete(id: string) {
    await this.run(`DELETE FROM active_schedules WHERE id = ?`, [id]);
  }
}
