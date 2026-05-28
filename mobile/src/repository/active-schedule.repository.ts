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
      specific_date: row.specific_date
        ? new Date(row.specific_date)
        : undefined,
      selected_days: row.selected_days ? JSON.parse(row.selected_days) : [],
      repeat_weekly: !!row.repeat_weekly,
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
        specific_date,
        selected_days,
        repeat_weekly,
        starts_at,
        ends_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        activeSchedule.id,
        activeSchedule.schedule_id,
        activeSchedule.specific_date?.toISOString() ?? null,
        JSON.stringify(activeSchedule.selected_days),
        activeSchedule.repeat_weekly ? 1 : 0,
        activeSchedule.starts_at?.toISOString() ?? null,
        activeSchedule.ends_at?.toISOString() ?? null,
      ],
      db ?? undefined,
    );
  }

  async findSpecificDateConflicts(
    activeSchedule: CreateActiveSchedule,
  ): Promise<ActiveSchedule[]> {
    const targetDate = activeSchedule.specific_date?.toISOString()!;

    const rows = await this.all<any>(
      `
    SELECT *
    FROM active_schedules
    WHERE specific_date = ?
    `,
      [targetDate],
    );

    return rows.map(this.mapRow);
  }

  async findSelectedDaysConflict(
    activeSchedule: CreateActiveSchedule,
  ): Promise<ActiveSchedule[]> {
    const rows = await this.all<any>(
      `
      SELECT *
      FROM active_schedules
      WHERE repeat_weekly = 1
      `,
    );

    const conflicts = rows.filter((row) => {
      const existingDays: number[] = JSON.parse(row.selected_days);

      return existingDays.some((day) =>
        activeSchedule.selected_days.includes(day),
      );
    });

    return conflicts.map(this.mapRow);
  }

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
