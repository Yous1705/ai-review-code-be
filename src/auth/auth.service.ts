import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { AuthRepository } from './auth.repository';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Profile } from 'passport-google-oauth20';
import { AuthProvider } from 'src/generated/prisma/enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateAuthDto) {
    const exist = await this.repo.findEmail(dto.email);
    if (exist) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const data = await this.repo.create({
      name: dto.name,
      email: dto.email,
      passwordHash: hashedPassword,
    });

    return {
      success: true,
      message: 'your data has been created',
      Data: data,
    };
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.repo.findEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Email not found');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect password');
    }

    const payload = { sub: user.id };

    return {
      success: true,
      message: 'login successful',
      access_token: this.jwtService.sign(payload),
    };
  }

  async findMe(id: string) {
    const user = await this.repo.findMe({ id });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      message: 'user found',
      data: user,
    };
  }

  async loginWithGoogle(userId: string) {
    const payload = {
      sub: userId,
    };

    return this.jwtService.sign(payload);
  }

  async validateGoogleUser(profile: Profile) {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName;

    if (!email) {
      throw new UnauthorizedException('Email not found in Google profile');
    }

    const authentication = await this.repo.findAuthentication(
      AuthProvider.GOOGLE,
      googleId,
    );

    if (authentication) {
      return authentication.user;
    }

    const existingUser = await this.repo.findEmail(email);

    if (existingUser) {
      await this.repo.createAuthentication({
        provider: AuthProvider.GOOGLE,
        providerAccountId: googleId,
        user: {
          connect: { id: existingUser.id },
        },
      });
      return existingUser;
    }

    const newUser = await this.repo.create({
      name,
      email,
      passwordHash: null,
    });

    await this.repo.createAuthentication({
      provider: AuthProvider.GOOGLE,
      providerAccountId: googleId,
      user: {
        connect: {
          id: newUser.id,
        },
      },
    });

    return newUser;
  }
}
