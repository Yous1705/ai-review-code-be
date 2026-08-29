import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiClient {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
    this.model = this.configService.getOrThrow<string>('AI_MODEL');
  }

  async reviewCode(prompt: string): Promise<string> {
    throw new InternalServerErrorException(
      'AI reviewCode method not implemented yet',
    );
  }
}
