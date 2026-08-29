import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { AiClient } from './ai.client';

import {
  CodeReviewResult,
  CodeReviewResultSchema,
} from './schemas/code-review.schema';

@Injectable()
export class AiService {
  constructor(private readonly aiClient: AiClient) {}

  async reviewCode(code: string, language: string): Promise<CodeReviewResult> {
    const prompt = this.buildPrompt(code, language);

    const response = await this.aiClient.reviewCode(prompt);

    try {
      const parsed = JSON.parse(response);

      return CodeReviewResultSchema.parse(parsed);
    } catch (error) {
      console.error('Invalid AI response:', error);

      throw new InternalServerErrorException(
        'AI returned an invalid review response',
      );
    }
  }

  private buildPrompt(code: string, language: string): string {
    return `
Review the following ${language} code.

Analyze the code for:

1. Bugs
2. Security vulnerabilities
3. Performance problems
4. Code quality
5. Maintainability
6. Best practices

Provide a score from 0 to 100.

For every issue:
- Identify the severity.
- Identify the specific line when applicable.
- Explain why the issue is problematic.
- Provide a practical suggestion to fix it.

Rules:

- score must be an integer between 0 and 100.
- severity must be one of LOW, MEDIUM, HIGH, CRITICAL.
- line must be a positive integer when the issue is related to a specific line.
- line must be null when there is no specific line.
- title must be concise.
- description must clearly explain the problem.
- suggestion must explain how to improve or fix the problem.
- Do not include markdown.
- Do not include anything outside the JSON response.

Code:

\`\`\`${language}
${code}
\`\`\`
`;
  }
}
