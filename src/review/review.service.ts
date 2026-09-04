import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewRepository } from './review.repository';
import { ReviewStatus } from 'src/generated/prisma/enums';
import { AiService } from 'src/ai/ai.service';

@Injectable()
export class ReviewService {
  constructor(
    private readonly repo: ReviewRepository,
    private readonly aiService: AiService,
  ) {}

  async create(userId: string, dto: CreateReviewDto) {
    const review = await this.repo.create({
      code: dto.code,
      language: dto.language,
      status: ReviewStatus.PENDING,
      user: {
        connect: {
          id: userId,
        },
      },
    });

    try {
      const result = await this.aiService.reviewCode(dto.code, dto.language);

      const issues = result.issues.map((issue) => ({
        reviewId: review.id,
        severity: issue.severity,
        line: issue.line,
        title: issue.title,
        description: issue.description,
        suggestion: issue.suggestion,
      }));

      await this.repo.completeReview(
        review.id,
        result.score,
        result.summary,
        issues,
      );

      return this.findOne(review.id, userId);
    } catch (error) {
      await this.repo.failReview(review.id);

      throw error;
    }
  }

  async findAll(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.repo.findManyByUserId(userId, skip, limit),

      this.repo.countByUserId(userId),
    ]);

    return {
      success: true,
      message: 'Your Reviews',
      data: reviews,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const review = await this.repo.findByIdAndUserId(id, userId);

    if (!review) return new NotFoundException('Review Not Found');

    return {
      success: true,
      message: 'Your Data',
      data: review,
    };
  }

  async remove(id: string, userId: string) {
    const result = await this.repo.deleteByIdAndUserId(id, userId);

    if (result.count === 0) throw new NotFoundException('Review Not Found');

    return {
      success: true,
      message: 'your review deleted',
    };
  }
}
