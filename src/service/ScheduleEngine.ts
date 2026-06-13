import { ScheduleItem } from "../../type/MessageTypes";
import {
  timeToMinutes,
  minutesToTime,
} from "../../utils/timeUtils";

export interface FixedAppointment {
  activity: string;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
}

export interface FlexibleTask {
  activity: string;
  duration_minutes: number;
  priority?: number;
}

interface Interval {
  start: number;
  end: number;
}

export class ScheduleEngine {
  /**
   * Compiles a complete, chronological schedule by inserting flexible tasks
   * around fixed appointments, inserting breaks/meals, resolving gaps, and validating times.
   */
  static compileSchedule(
    dayStart: string,
    dayEnd: string,
    fixedAppointments: FixedAppointment[],
    flexibleTasks: FlexibleTask[],
    scheduleType?: string,
  ): ScheduleItem[] {
    // The engine will automatically insert meals for personal schedules via insertMeals().
    // No extra pre‑processing is required here.

    const startMins = timeToMinutes(dayStart);
    let endMins = timeToMinutes(dayEnd);

    // Handle overnight wrap-around (e.g. 06:00 to 01:00)
    if (endMins <= startMins) {
      endMins += 24 * 60;
    }

    // Insert meals if it's a personal schedule
    let fixed = [...fixedAppointments];
    if (scheduleType !== "event") {
      fixed = this.insertMeals(startMins, endMins, fixed);
    }

    // Sort and sanitize fixed appointments (including auto-inserted meals)
    const sanitizedFixed = fixed
      .filter(f => f.activity && f.start_time && f.end_time)
      .map(f => {
        let start = timeToMinutes(f.start_time);
        let end = timeToMinutes(f.end_time);
        if (end <= start) end += 24 * 60;
        return { activity: f.activity, start, end };
      })
      .sort((a, b) => a.start - b.start);

    const result: ScheduleItem[] = [];
    let currentTime = startMins;
    let fixedIdx = 0;

    // Schedule flexible tasks sequentially
    for (const task of flexibleTasks) {
      let taskDuration = task.duration_minutes;
      if (taskDuration <= 0) continue;

      while (taskDuration > 0 && currentTime < endMins) {
        // Find the next upcoming fixed appointment
        const nextFixed = sanitizedFixed.find((f, idx) => idx >= fixedIdx && f.start >= currentTime);

        // If we are currently inside an active fixed appointment, skip forward
        const activeFixed = sanitizedFixed.find(f => currentTime >= f.start && currentTime < f.end);
        if (activeFixed) {
          result.push({
            activity: activeFixed.activity,
            start_time: minutesToTime(activeFixed.start % 1440),
            end_time: minutesToTime(activeFixed.end % 1440),
          });
          currentTime = activeFixed.end;
          fixedIdx = sanitizedFixed.indexOf(activeFixed) + 1;
          continue;
        }

        if (!nextFixed) {
          // No more fixed appointments: place the remaining task duration
          const durationToSchedule = Math.min(taskDuration, endMins - currentTime);
          if (durationToSchedule > 0) {
            result.push({
              activity: task.activity,
              start_time: minutesToTime(currentTime % 1440),
              end_time: minutesToTime((currentTime + durationToSchedule) % 1440),
            });
            currentTime += durationToSchedule;
          }
          taskDuration = 0;
        } else {
          const gap = nextFixed.start - currentTime;
          if (gap >= taskDuration) {
            // Task fits in the gap completely!
            result.push({
              activity: task.activity,
              start_time: minutesToTime(currentTime % 1440),
              end_time: minutesToTime((currentTime + taskDuration) % 1440),
            });
            currentTime += taskDuration;
            taskDuration = 0;
          } else if (gap > 10) {
            // Split the task: schedule part of it in the gap
            result.push({
              activity: `${task.activity} (Part 1)`,
              start_time: minutesToTime(currentTime % 1440),
              end_time: minutesToTime(nextFixed.start % 1440),
            });
            currentTime = nextFixed.start;
            taskDuration -= gap;

            // Schedule the fixed appointment immediately after
            result.push({
              activity: nextFixed.activity,
              start_time: minutesToTime(nextFixed.start % 1440),
              end_time: minutesToTime(nextFixed.end % 1440),
            });
            currentTime = nextFixed.end;
            fixedIdx = sanitizedFixed.indexOf(nextFixed) + 1;
          } else {
            // Gap is too small (< 10 min): Fill it with a quick break/transition
            if (gap > 0) {
              result.push({
                activity: "Break / Transition",
                start_time: minutesToTime(currentTime % 1440),
                end_time: minutesToTime(nextFixed.start % 1440),
              });
            }
            currentTime = nextFixed.start;

            // Schedule the fixed appointment
            result.push({
              activity: nextFixed.activity,
              start_time: minutesToTime(nextFixed.start % 1440),
              end_time: minutesToTime(nextFixed.end % 1440),
            });
            currentTime = nextFixed.end;
            fixedIdx = sanitizedFixed.indexOf(nextFixed) + 1;
          }
        }
      }

      // Insert a 15-minute Break after completing a task, if time permits and no appointment starts immediately
      if (taskDuration === 0 && currentTime < endMins) {
        const nextFixed = sanitizedFixed.find(f => f.start >= currentTime);
        if (nextFixed && nextFixed.start - currentTime <= 10) {
          // An appointment/meal is starting soon, no need to insert a break
        } else {
          const breakDuration = Math.min(15, endMins - currentTime);
          if (breakDuration > 0) {
            result.push({
              activity: "Break",
              start_time: minutesToTime(currentTime % 1440),
              end_time: minutesToTime((currentTime + breakDuration) % 1440),
            });
            currentTime += breakDuration;
          }
        }
      }
    }

    // Schedule any remaining fixed appointments
    while (fixedIdx < sanitizedFixed.length && currentTime < endMins) {
      const nextFixed = sanitizedFixed[fixedIdx];
      if (nextFixed.start >= currentTime) {
        if (nextFixed.start > currentTime) {
          result.push({
            activity: "Rest & Recovery",
            start_time: minutesToTime(currentTime % 1440),
            end_time: minutesToTime(nextFixed.start % 1440),
          });
        }
        result.push({
          activity: nextFixed.activity,
          start_time: minutesToTime(nextFixed.start % 1440),
          end_time: minutesToTime(nextFixed.end % 1440),
        });
        currentTime = nextFixed.end;
      }
      fixedIdx++;
    }

    // Fill the remaining day window with a wind down period
    if (currentTime < endMins) {
      result.push({
        activity: "Wind Down / Sleep Prep",
        start_time: minutesToTime(currentTime % 1440),
        end_time: minutesToTime(endMins % 1440),
      });
    }

    return result;
  }

  static getMealOverlap(
    dayStartMins: number,
    dayEndMins: number,
    mealStartStr: string,
    mealEndStr: string,
  ): { start: number; end: number } | null {
    let mStart = timeToMinutes(mealStartStr);
    let mEnd = timeToMinutes(mealEndStr);

    if (dayStartMins <= mEnd && dayEndMins >= mStart) {
      const overlapStart = Math.max(dayStartMins, mStart);
      const overlapEnd = Math.min(dayEndMins, mEnd);
      if (overlapEnd > overlapStart) return { start: overlapStart, end: overlapEnd };
    }

    // Check next day (wrapped)
    const mStartNext = mStart + 1440;
    const mEndNext = mEnd + 1440;
    if (dayStartMins <= mEndNext && dayEndMins >= mStartNext) {
      const overlapStart = Math.max(dayStartMins, mStartNext);
      const overlapEnd = Math.min(dayEndMins, mEndNext);
      if (overlapEnd > overlapStart) return { start: overlapStart, end: overlapEnd };
    }

    return null;
  }

  static insertMeals(
    dayStartMins: number,
    dayEndMins: number,
    fixedAppointments: FixedAppointment[]
  ): FixedAppointment[] {
    const meals = [
      { name: "Breakfast", start: "06:30", end: "09:30", target: "07:30", duration: 30 },
      { name: "Lunch", start: "11:30", end: "14:00", target: "12:30", duration: 45 },
      { name: "Dinner", start: "17:30", end: "20:30", target: "19:00", duration: 45 },
    ];

    let result = [...fixedAppointments];

    // Convert existing fixed appointments to absolute minutes relative to the day start
    const blocked: Interval[] = fixedAppointments.map(f => {
      let start = timeToMinutes(f.start_time);
      let end = timeToMinutes(f.end_time);
      if (end <= start) end += 24 * 60;
      return { start, end };
    });

    for (const meal of meals) {
      const overlap = this.getMealOverlap(dayStartMins, dayEndMins, meal.start, meal.end);
      if (!overlap) continue;

      // If the overlap is too small for even a quick meal (15 min), skip it
      if (overlap.end - overlap.start < 15) continue;

      // Determine absolute target start time
      let targetStart = timeToMinutes(meal.target);
      // Adjust if target falls into next day of the day window
      if (targetStart < dayStartMins && targetStart + 1440 <= dayEndMins) {
        targetStart += 1440;
      }

      // Find a free slot in the overlap window
      const slot = this.findFreeMealSlot(
        overlap.start,
        overlap.end,
        blocked,
        targetStart,
        meal.duration
      );

      if (slot) {
        // Add the meal as a fixed appointment
        result.push({
          activity: meal.name,
          start_time: minutesToTime(slot.start % 1440),
          end_time: minutesToTime(slot.end % 1440),
        });
        // Add to blocked to prevent other meals from overlapping
        blocked.push(slot);
      }
    }

    return result;
  }

  private static findFreeMealSlot(
    overlapStart: number,
    overlapEnd: number,
    blocked: Interval[],
    targetStart: number,
    preferredDuration: number
  ): Interval | null {
    // Sort and merge blocked intervals that overlap with [overlapStart, overlapEnd]
    const intervals = blocked
      .map(b => ({
        start: Math.max(overlapStart, b.start),
        end: Math.min(overlapEnd, b.end)
      }))
      .filter(b => b.end > b.start)
      .sort((a, b) => a.start - b.start);

    // Merge overlapping blocked intervals
    const merged: Interval[] = [];
    for (const current of intervals) {
      if (merged.length === 0) {
        merged.push(current);
      } else {
        const last = merged[merged.length - 1];
        if (current.start <= last.end) {
          last.end = Math.max(last.end, current.end);
        } else {
          merged.push(current);
        }
      }
    }

    // Find all gaps
    const gaps: Interval[] = [];
    let lastEnd = overlapStart;
    for (const block of merged) {
      if (block.start > lastEnd) {
        gaps.push({ start: lastEnd, end: block.start });
      }
      lastEnd = block.end;
    }
    if (overlapEnd > lastEnd) {
      gaps.push({ start: lastEnd, end: overlapEnd });
    }

    // Find the best gap that can accommodate the meal duration.
    // Try preferredDuration first, then try smaller durations down to 15 mins.
    const durationsToTry = [preferredDuration, 30, 20, 15];
    for (const duration of durationsToTry) {
      if (duration > preferredDuration) continue;
      
      let bestSlot: Interval | null = null;
      let minDistance = Infinity;

      for (const gap of gaps) {
        const gapLength = gap.end - gap.start;
        if (gapLength >= duration) {
          // Slide the slot of length `duration` within the gap to find the position closest to targetStart
          let candidateStart = targetStart;
          if (candidateStart < gap.start) {
            candidateStart = gap.start;
          } else if (candidateStart + duration > gap.end) {
            candidateStart = gap.end - duration;
          }

          const distance = Math.abs(candidateStart - targetStart);
          if (distance < minDistance) {
            minDistance = distance;
            bestSlot = { start: candidateStart, end: candidateStart + duration };
          }
        }
      }

      if (bestSlot) {
        return bestSlot;
      }
    }

    return null;
  }

  /**
   * Legacy method kept for compatibility.
   * Validates and sanitizes a schedule, ensuring no overlaps.
   */
  static validateAndSanitize(items: any[]): ScheduleItem[] {
    if (!Array.isArray(items)) return [];

    let sanitized: ScheduleItem[] = items
      .filter(item => item.activity && item.start_time && item.end_time)
      .map(item => ({
        activity: String(item.activity),
        start_time: item.start_time,
        end_time: item.end_time,
      }))
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

    if (sanitized.length === 0) return [];

    const result: ScheduleItem[] = [];
    let lastEnd = 0;

    for (let i = 0; i < sanitized.length; i++) {
      const item = sanitized[i];
      let start = timeToMinutes(item.start_time);
      let end = timeToMinutes(item.end_time);

      if (end <= start) end += 1440;

      if (start < lastEnd) {
        const duration = end - start;
        start = lastEnd;
        end = start + duration;
      }

      result.push({
        activity: item.activity,
        start_time: minutesToTime(start % 1440),
        end_time: minutesToTime(end % 1440),
      });

      lastEnd = end;
    }

    return result;
  }
}
