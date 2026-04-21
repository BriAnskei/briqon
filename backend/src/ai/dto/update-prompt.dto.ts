import {
  ArrayNotEmpty,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ScheduleItemDto } from './schedule-item.dto';
import { Type } from 'class-transformer';

export class UpdatePromptDto {
  @IsString()
  @IsNotEmpty()
  editPrompt!: string;

  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  @ArrayNotEmpty()
  currentSchedule!: ScheduleItemDto[];
}
