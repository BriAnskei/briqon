import { ScheduleEngine, FixedAppointment, FlexibleTask } from '../ScheduleEngine';

/**
 * Helper to find a schedule item by activity name.
 */
function findItem(schedule: { activity: string; start_time: string; end_time: string }[], activity: string) {
  return schedule.find((i) => i.activity === activity);
}

describe('ScheduleEngine.compileSchedule', () => {
  test('creates a simple schedule without splits (few‑long break preference)', () => {
    const dayStart = '08:00';
    const dayEnd = '12:00';
    const fixed: FixedAppointment[] = [];
    const flexible: FlexibleTask[] = [
      { activity: 'Task A', duration_minutes: 90 },
      { activity: 'Task B', duration_minutes: 30 },
    ];

    // Use "event" schedule type to skip automatic meals and "few-long" to avoid splitting.
    const schedule = ScheduleEngine.compileSchedule(dayStart, dayEnd, fixed, flexible, 'event', 'few-long');

    // Expect two task items followed by wind‑down.
    expect(schedule).toHaveLength(3);
    expect(schedule[0]).toMatchObject({ activity: 'Task A', start_time: '08:00', end_time: '09:30' });
    expect(schedule[1]).toMatchObject({ activity: 'Task B', start_time: '09:30', end_time: '10:00' });
    expect(schedule[2].activity).toBe('Wind Down / Sleep Prep');
    expect(schedule[2].start_time).toBe('10:00');
    expect(schedule[2].end_time).toBe('12:00');
  });

  test('splits a long flexible task according to many‑short break preference', () => {
    const dayStart = '08:00';
    const dayEnd = '12:00';
    const fixed: FixedAppointment[] = [];
    const flexible: FlexibleTask[] = [{ activity: 'Task C', duration_minutes: 70 }];

    const schedule = ScheduleEngine.compileSchedule(dayStart, dayEnd, fixed, flexible, 'event', 'many-short');

    // Expected order: Part 1, Break, Part 2, Break, Part 3, Wind Down.
    const expectedActivities = [
      'Task C (Part 1)',
      'Break',
      'Task C (Part 2)',
      'Break',
      'Task C (Part 3)',
      'Wind Down / Sleep Prep',
    ];

    const actualActivities = schedule.map((i) => i.activity);
    expect(actualActivities).toEqual(expectedActivities);

    // Verify timings for the first three chunks.
    const part1 = findItem(schedule, 'Task C (Part 1)')!;
    expect(part1).toMatchObject({ start_time: '08:00', end_time: '08:30' });

    const break1 = findItem(schedule, 'Break')!; // first break
    expect(break1).toMatchObject({ start_time: '08:30', end_time: '08:45' });

    const part2 = findItem(schedule, 'Task C (Part 2)')!;
    expect(part2).toMatchObject({ start_time: '08:45', end_time: '09:15' });

    const part3 = findItem(schedule, 'Task C (Part 3)')!;
    expect(part3).toMatchObject({ start_time: '09:30', end_time: '09:40' });

    const windDown = findItem(schedule, 'Wind Down / Sleep Prep')!;
    expect(windDown.start_time).toBe('09:40');
    expect(windDown.end_time).toBe('12:00');
  });
});
