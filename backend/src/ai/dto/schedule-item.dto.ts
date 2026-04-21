import { IsString, Matches, MinLength } from 'class-validator';
import { timeRegex } from '../schemas/schedule.schema';

export class ScheduleItemDto {
  @IsString()
  @Matches(timeRegex, { message: 'Invalid start time format' })
  start_time: string = '';

  @IsString()
  @Matches(timeRegex, { message: 'Invalid end time format' })
  end_time: string = '';

  @IsString()
  @MinLength(1, { message: 'Activity cannot be empty' })
  activity: string = '';
}
