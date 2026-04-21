import { BadRequestException, Injectable } from '@nestjs/common';
import ollama from 'ollama';
import { ScheduleSchema } from './schemas/schedule.schema';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { extractJson, safeParseJson } from '../util/json.util';
import { OllamaService } from '../ollama/ollama.service';
import { RetryHandler } from '../util/retry-handler.util';

@Injectable()
export class AiService {
  constructor(private readonly ollamaService: OllamaService) {}

  async generateGeneralMessage(
    prompt: string,
    onChunk: (chunk: string) => void,
  ) {
    try {
      const stream = await this.ollamaService.generateStreamResponse(prompt);

      for await (const part of stream) {
        const text = part.message?.content || '';
        onChunk(text);
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed to generate ai response');
    }
  }

  async generateScheduleJson(prompt: string) {
    // retry handler max of 3 for invalid format generation
    const retry = new RetryHandler(3);

    while (retry.shouldRetry()) {
      try {
        const stream = await this.ollamaService.generateStreamResponse(prompt);

        let fullResponse = '';

        for await (const chunk of stream) {
          fullResponse += chunk.message?.content || '';
        }

        const cleanedJsonString = extractJson(fullResponse);
        const parsedJson = safeParseJson(cleanedJsonString);

        const resultJson = ScheduleSchema.safeParse(parsedJson);
        if (resultJson.success) {
          return resultJson.data;
        }

        console.log('Invalid generated json format, retrying');
      } catch (error) {
        console.error(error);
      } finally {
        retry.next();
      }
    }

    throw new BadRequestException(
      'Failed to generate a valid schedule json format',
    );
  }

  async generateEditSchedule(updatePromptDto: UpdatePromptDto) {
    try {
    } catch (error) {
      console.log('Failed in generateEditSchedule');
      console.error(error);
      throw new Error('Failed to generate Edit schedule');
    }
  }
}
