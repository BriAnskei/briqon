import { Injectable } from '@nestjs/common';
import ollama from 'ollama';
import { extractJson, safeParseJson } from 'src/util/json.util';
import { ScheduleSchema } from './schemas/schedule.schema';
import { error } from 'console';

@Injectable()
export class AiService {
  async generateGeneralMessage(
    prompt: string,
    onChunk: (chunk: string) => void,
  ) {
    try {
      const stream = await ollama.chat({
        model: 'briqon',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      });

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
    try {
      const stream = await ollama.chat({
        model: 'briqon',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk.message?.content || '';
      }

      const cleanedJsonString = extractJson(fullResponse);
      const parsedJson = safeParseJson(cleanedJsonString);

      const resultJson = ScheduleSchema.safeParse(parsedJson);
      if (!resultJson.success) {
        console.error(resultJson.error);
        throw new Error('Invalid Schedule Schema');
      }

      return resultJson.data;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to generate Json response');
    }
  }
}
