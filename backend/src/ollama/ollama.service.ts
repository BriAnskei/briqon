import { Injectable } from '@nestjs/common';
import { AbortableAsyncIterator, ChatResponse } from 'ollama';
import ollama from 'ollama';

@Injectable()
export class OllamaService {
  async generateStreamResponse(
    prompt: string,
  ): Promise<AbortableAsyncIterator<ChatResponse>> {
    return await ollama.chat({
      model: 'briqon',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });
  }
}
