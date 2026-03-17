import { Injectable } from '@nestjs/common';
import ollama from 'ollama';

@Injectable()
export class AiService {
  async generateSchdule(prompt: string, onChunk: (chunk: string) => void) {
    try {
      const stream = await ollama.chat({
        model: 'smart-alarm:latest',
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
}
