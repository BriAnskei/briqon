import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { OllamaModule } from './ollama/ollama.module';

@Module({
  imports: [AiModule, OllamaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
