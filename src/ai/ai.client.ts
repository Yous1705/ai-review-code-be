import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiClient {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.configService.getOrThrow<string>('AI_API_KEY'),
    });

    this.model = this.configService.getOrThrow<string>('AI_MODEL');
  }

  async reviewCode(prompt: string): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,

        contents: prompt,

        config: {
          systemInstruction:
            'You are an expert software engineer and code reviewer.',

          responseMimeType: 'application/json',

          responseSchema: {
            type: 'object',

            properties: {
              score: {
                type: 'integer',
                minimum: 0,
                maximum: 100,
              },

              summary: {
                type: 'string',
              },

              issues: {
                type: 'array',

                items: {
                  type: 'object',

                  properties: {
                    severity: {
                      type: 'string',
                      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                    },

                    line: {
                      type: ['integer', 'null'],
                    },

                    title: {
                      type: 'string',
                    },

                    description: {
                      type: 'string',
                    },

                    suggestion: {
                      type: ['string', 'null'],
                    },
                  },

                  required: [
                    'severity',
                    'line',
                    'title',
                    'description',
                    'suggestion',
                  ],
                },
              },
            },

            required: ['score', 'summary', 'issues'],
          },
        },
      });

      const content = response.text;

      if (!content) {
        throw new Error('AI returned an empty response');
      }

      return content;
    } catch (error) {
      console.error('AI Client Error:', error);

      throw new InternalServerErrorException(
        'Failed to communicate with AI provider',
      );
    }
  }
}
