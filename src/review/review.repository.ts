import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ReviewCreateInput) {
    return this.prisma.review.create({
      data,
    });
  }

  findById(id: string) {
    return this.prisma.review.findUnique({
      where: {
        id,
      },

      include: {
        issues: true,
      },
    });
  }

  findByIdAndUserId(id: string, userId: string) {
    return this.prisma.review.findFirst({
      where: {
        id,
        userId,
      },

      include: {
        issues: true,
      },
    });
  }

  findManyByUserId(userId: string, skip: number, take: number) {
    return this.prisma.review.findMany({
      where: {
        userId,
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        issues: true,
      },
    });
  }

  countByUserId(userId: string) {
    return this.prisma.review.count({
      where: {
        userId,
      },
    });
  }

  deleteByIdAndUserId(id: string, userId: string) {
    return this.prisma.review.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }

  updateResult(reviewId: string, data: Prisma.ReviewUpdateInput) {
    return this.prisma.review.update({
      where: {
        id: reviewId,
      },

      data,
    });
  }

  createIssues(issues: Prisma.ReviewIssuesCreateManyInput[]) {
    return this.prisma.reviewIssues.createMany({
      data: issues,
    });
  }

  async completeReview(
    reviewId: string,
    score: number,
    summary: string,
    issues: Prisma.ReviewIssuesCreateManyInput[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.update({
        where: {
          id: reviewId,
        },

        data: {
          score,
          summary,
          status: 'COMPLETED',
        },
      });

      await tx.reviewIssues.createMany({
        data: issues,
      });

      return review;
    });
  }

  async failReview(reviewId: string) {
    return this.prisma.review.update({
      where: {
        id: reviewId,
      },

      data: {
        status: 'FAILED',
      },
    });
  }
}
