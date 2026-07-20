import { ActiveScheduleService } from "./active-schedule.service";
import { ActiveScheduleRepository } from "../repository/active-schedule.repository";
import { ScheduleRepository } from "../repository/schedule.repository";
import { ActiveScheduleDaysRepository } from "../repository/active-schedule-days.repository";
import { ActiveScheduleDatesRepository } from "../repository/active-schedule-dates.repository";
import { ConflicActivationError } from "../errors/scheduleActivationConflic.error";
import { ActiveSchedule } from "../models/active_schedule.model";

// Mock repositories
jest.mock("../repository/active-schedule.repository");
jest.mock("../repository/schedule.repository");
jest.mock("../repository/active-schedule-days.repository");
jest.mock("../repository/active-schedule-dates.repository");

describe("ActiveScheduleService", () => {
	let service: ActiveScheduleService;
	let activeScheduleRepo: jest.Mocked<ActiveScheduleRepository>;
	let scheduleRepo: jest.Mocked<ScheduleRepository>;
	let activeScheduleDaysRepo: jest.Mocked<ActiveScheduleDaysRepository>;
	let activeScheduleDateRepo: jest.Mocked<ActiveScheduleDatesRepository>;

	const mockSchedule = {
		name: "Test Schedule",
		schedule_list: [
			{
				start_time: "08:00",
				end_time: "09:00",
				activity: "Gym",
				enabled: true,
			},
		],
		temporary: false,
	};

	beforeEach(() => {
		jest.clearAllMocks();
		service = new ActiveScheduleService();

		// Accessing private members for testing purposes
		activeScheduleRepo = (service as any).repo;
		scheduleRepo = (service as any).scheduleRepo;
		activeScheduleDaysRepo = (service as any).activeScheduleDaysRepo;
		activeScheduleDateRepo = (service as any).activeScheduleDateRepo;

		// Mock transaction to execute the callback immediately
		activeScheduleRepo.transaction.mockImplementation(async (cb: any) => {
			return cb({} as any); // Dummy db object
		});
	});

	describe("createActiveSchedule", () => {
		it("should create an active schedule of type 'date'", async () => {
			const activeSchedulePayload = {
				active_type: "date" as const,
				recurring: false,
				starts_at: new Date("2026-06-04T08:00:00Z"),
				ends_at: new Date("2026-06-04T09:00:00Z"),
			};

			activeScheduleRepo.findRangeOverlaps.mockResolvedValue([]);

			await service.createActiveSchedule({
				activeSchedule: activeSchedulePayload,
				schedule: mockSchedule,
				date: new Date("2026-06-04"),
			});

			expect(activeScheduleRepo.create).toHaveBeenCalled();
			expect(scheduleRepo.create).toHaveBeenCalled();
			expect(activeScheduleDateRepo.create).toHaveBeenCalled();
		});

		it("should create a recurring active schedule of type 'days'", async () => {
			const activeSchedulePayload = {
				active_type: "days" as const,
				recurring: true,
			};
			const dayOfWeeks = [1, 3, 5]; // Mon, Wed, Fri

			activeScheduleRepo.findDayConflicts.mockResolvedValue([]);

			await service.createActiveSchedule({
				activeSchedule: activeSchedulePayload,
				schedule: mockSchedule,
				dayOfWeeks,
			});

			expect(activeScheduleRepo.create).toHaveBeenCalled();
			expect(scheduleRepo.create).toHaveBeenCalled();
			expect(activeScheduleDaysRepo.create).toHaveBeenCalledTimes(3);
		});

		it("should create a non-recurring active schedule of type 'days'", async () => {
			const activeSchedulePayload = {
				active_type: "days" as const,
				recurring: false,
				starts_at: new Date("2026-06-04T08:00:00Z"),
				ends_at: new Date("2026-06-04T09:00:00Z"),
			};
			const dayOfWeeks = [1];

			activeScheduleRepo.findRangeOverlaps.mockResolvedValue([]);

			await service.createActiveSchedule({
				activeSchedule: activeSchedulePayload,
				schedule: mockSchedule,
				dayOfWeeks,
			});

			expect(activeScheduleRepo.create).toHaveBeenCalled();
			expect(scheduleRepo.create).toHaveBeenCalled();
			expect(activeScheduleDaysRepo.create).toHaveBeenCalledTimes(1);
		});

		it("should throw ConflicActivationError when range overlaps for date/non-recurring", async () => {
			const activeSchedulePayload = {
				active_type: "date" as const,
				recurring: false,
				starts_at: new Date("2026-06-04T08:00:00Z"),
				ends_at: new Date("2026-06-04T09:00:00Z"),
			};

			const conflictDate = new Date("2026-06-04");
			const conflictActiveSchedule: ActiveSchedule = {
				id: "existing-id",
				schedule_id: "s-id",
				active_type: "date",
				recurring: false,
				starts_at: activeSchedulePayload.starts_at,
				ends_at: activeSchedulePayload.ends_at,
			};

			activeScheduleRepo.findRangeOverlaps.mockResolvedValue([
				conflictActiveSchedule,
			]);
			activeScheduleDateRepo.fetchByActiveScheduleId.mockResolvedValue({
				id: "d-id",
				active_schedule_id: "existing-id",
				date: conflictDate,
			});
			scheduleRepo.findById.mockResolvedValue({
				...mockSchedule,
				id: "s-id",
			} as any);

			const promise = service.createActiveSchedule({
				activeSchedule: activeSchedulePayload,
				schedule: mockSchedule,
				date: new Date("2026-06-04"),
			});

			await expect(promise).rejects.toThrow(ConflicActivationError);

			try {
				await promise;
			} catch (error: any) {
				expect(error).toBeInstanceOf(ConflicActivationError);
				const context = error.context;
				expect(context.conflicts.length).toBe(1);
				expect(context.conflicts[0].activeSchedule).toEqual(
					conflictActiveSchedule,
				);
				expect(context.conflicts[0].data).toEqual(conflictDate);
				expect(context.conflicts[0].scheduleName).toEqual(mockSchedule.name);
			}
		});

		it("should throw ConflicActivationError when day conflicts exist for recurring", async () => {
			const activeSchedulePayload = {
				active_type: "days" as const,
				recurring: true,
			};
			const dayOfWeeks = [1];

			const conflictActiveSchedule: ActiveSchedule = {
				id: "existing-recurring-id",
				schedule_id: "s2-id",
				active_type: "days",
				recurring: true,
			};

			activeScheduleRepo.findDayConflicts.mockResolvedValue([
				conflictActiveSchedule,
			]);
			activeScheduleDaysRepo.fetchAllByActiveScheduleId.mockResolvedValue([
				{ id: "d1", active_schedule_id: "existing-recurring-id", weekday: 1 },
				{ id: "d2", active_schedule_id: "existing-recurring-id", weekday: 2 },
			] as any);
			scheduleRepo.findById.mockResolvedValue({
				...mockSchedule,
				id: "s2-id",
				name: "Conflict Schedule",
			} as any);

			const promise = service.createActiveSchedule({
				activeSchedule: activeSchedulePayload,
				schedule: mockSchedule,
				dayOfWeeks,
			});

			await expect(promise).rejects.toThrow(ConflicActivationError);

			try {
				await promise;
			} catch (error: any) {
				expect(error).toBeInstanceOf(ConflicActivationError);
				const context = error.context;
				expect(context.conflicts.length).toBe(1);
				expect(context.conflicts[0].activeSchedule).toEqual(
					conflictActiveSchedule,
				);
				expect(context.conflicts[0].data).toEqual([1, 2]);
				expect(context.conflicts[0].scheduleName).toEqual("Conflict Schedule");
			}
		});
	});
});
