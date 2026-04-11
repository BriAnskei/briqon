// ai.controller.ts
import { Body, Controller, Get, Post, Query, Res, Sse } from '@nestjs/common';
import { AiService } from './ai.service';
import type { Response } from 'express';
import { PromptDto } from './dto/prompt.dto';
import { Schedule } from './types/schedule.type';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('stream')
  async GenerateMessageResponse(@Body() body: PromptDto, @Res() res: Response) {
    const { prompt } = body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');

    let response = '';
    await this.aiService.generateGeneralMessage(prompt, (chunk) => {
      response += chunk;
      console.log('chunk response: ', chunk);
      const escapedChunk = chunk.replace(/\n/g, '\\n'); // escape real newlines
      res.write(`data: ${escapedChunk}\n`);
    });
    console.log('Response chunk: ', response);

    res.end();
  }

  @Post('schedule')
  async getSchedule(@Body() body: PromptDto): Promise<Schedule> {
    const { prompt } = body;
    return this.aiService.generateScheduleJson(prompt);
  }
}
