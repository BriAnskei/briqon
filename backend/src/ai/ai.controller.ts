import { Body, Controller, Get, Query, Res } from '@nestjs/common';
import { AiService } from './ai.service';
import type { Response } from 'express';
import { PromptDto } from './dto/prompt.dto';

@Controller('ai')
export class AiController {
  constructor(private aiServicse: AiService) {}

  @Get()
  async getResponse(@Body() body: PromptDto, @Res() res: Response) {
    const { prompt } = body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Transfer-Encoding', 'chunked');

    let response = '';

    await this.aiServicse.generateSchdule(prompt, (chunk) => {
      response += chunk;
      res.write(`data: ${chunk}\n\n`);
    });

    console.log('response: ', response);

    res.end();
  }
}
