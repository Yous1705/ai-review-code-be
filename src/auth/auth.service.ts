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
}
