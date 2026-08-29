import { Severity } from 'src/generated/prisma/enums';

export interface CodeReviewIssue {
  severity: Severity;
  line?: number;
  title: string;
  description: string;
  suggestion?: string;
}

export interface CodeReviewResult {
  score: number;
  summary: string;
  issues: CodeReviewIssue[];
}
