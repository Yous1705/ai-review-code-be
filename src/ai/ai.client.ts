import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

@Injectable()
export class AiClient {
  private readonly client: Groq;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new Groq({
      apiKey: this.configService.getOrThrow<string>('AI_API_KEY'),
    });

    this.model = this.configService.getOrThrow<string>('AI_MODEL');
  }

  async reviewCode(prompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,

        messages: [
          {
            role: 'system',
            content: 'You are an expert software engineer and code reviewer.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],

        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'code_review',
            strict: true,
            schema: {
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

                    additionalProperties: false,
                  },
                },
              },

              required: ['score', 'summary', 'issues'],

              additionalProperties: false,
            },
          },
        },

        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('AI returned an empty response');
      }

      return content;
    } catch (error: any) {
      console.error('========== GROQ AI ERROR ==========');
      console.error('name:', error?.name);
      console.error('message:', error?.message);
      console.error('status:', error?.status);
      console.error('code:', error?.code);
      console.error('type:', error?.type);
      console.error('===================================');

      if (error?.status === 429) {
        throw new InternalServerErrorException(
          'AI provider rate limit or quota exceeded. Please try again later.',
        );
      }

      throw new InternalServerErrorException(
        'Failed to communicate with AI provider',
      );
    }
  }
}
