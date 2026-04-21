import { IsString, IsArray, IsNotEmpty, MinLength } from 'class-validator';
export class PromptDto {
  @IsString()
  @IsNotEmpty()
  prompt: string = '';
}
