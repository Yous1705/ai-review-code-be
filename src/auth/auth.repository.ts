import { Injectable } from '@nestjs/common';
import { AuthProvider, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMe(data: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({
      where: data,
    });
  }

  async findEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
    });
  }

  createAuthentication(data: Prisma.UserAuthenticationCreateInput) {
    return this.prisma.userAuthentication.create({
      data,
    });
  }

  findAuthentication(provider: AuthProvider, providerAccountId: string) {
    return this.prisma.userAuthentication.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: {
        user: true,
      },
    });
  }
}
