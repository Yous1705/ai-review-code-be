import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiClient } from './ai.client';

@Module({
  controllers: [AiController],
  providers: [AiService, AiClient],
  exports: [AiService],
})
export class AiModule {}
