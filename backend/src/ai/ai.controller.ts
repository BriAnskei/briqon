// ai.controller.ts
import { Body, Controller, Post, Res } from '@nestjs/common';
import { AiService } from './ai.service';
import type { Response } from 'express';
import { PromptDto } from './dto/prompt.dto';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post()
  async getResponse(@Body() body: PromptDto, @Res() res: Response) {
    const { prompt } = body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');

    let response: string = '';
    await this.aiService.generateSchdule(prompt, (chunk) => {
      response += chunk;

      res.write(`data: ${chunk}\n\n`);
    });

    res.end();
  }
}
