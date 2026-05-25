import { Injectable } from '@nestjs/common';
import { AbortableAsyncIterator, ChatResponse } from 'ollama';
import { Ollama } from 'ollama';

@Injectable()
export class OllamaService {
  private readonly ollama: Ollama;

  constructor() {
    this.ollama = new Ollama({
      host: 'http://127.0.0.1:11434',
    });
  }

  async generateStreamResponse(
    prompt: string,
  ): Promise<AbortableAsyncIterator<ChatResponse>> {
    return await this.ollama.chat({
      model: 'briqon',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      keep_alive: '10m',
    });
  }
}
