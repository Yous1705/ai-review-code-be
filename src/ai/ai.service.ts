import { Injectable } from '@nestjs/common';

import { AiClient } from './ai.client';

import {
  CodeReviewResultSchema,
  CodeReviewResult,
} from './schemas/code-review.schema';

@Injectable()
export class AiService {
  constructor(private readonly aiClient: AiClient) {}

  async reviewCode(code: string, language: string): Promise<CodeReviewResult> {
    const prompt = this.buildPrompt(code, language);

    const response = await this.aiClient.reviewCode(prompt);

    const parsed = JSON.parse(response);

    const result = CodeReviewResultSchema.parse(parsed);

    return result;
  }

  private buildPrompt(code: string, language: string): string {
    return `
You are an expert software engineer and code reviewer.

Review the following ${language} code.

Analyze:
- Bugs
- Security vulnerabilities
- Performance
- Code quality
- Maintainability
- Best practices

Return ONLY valid JSON.

Expected structure:

{
  "score": 0,
  "summary": "string",
  "issues": [
    {
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "line": 1,
      "title": "string",
      "description": "string",
      "suggestion": "string"
    }
  ]
}

Code:

\`\`\`${language}
${code}
\`\`\`
`;
  }
}
