import { z } from 'zod';

export const CodeReviewIssueSchema = z.object({
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),

  line: z.number().int().positive().nullable(),

  title: z.string(),

  description: z.string(),

  suggestion: z.string().nullable(),
});

export const CodeReviewResultSchema = z.object({
  score: z.number().int().min(0).max(100),

  summary: z.string(),

  issues: z.array(CodeReviewIssueSchema),
});

export type CodeReviewResult = z.infer<typeof CodeReviewResultSchema>;
