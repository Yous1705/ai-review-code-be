import { ConflictException, Injectable } from '@nestjs/common';
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

  async findAll() {
    const data = await this.repo.findAll();
    return {
      success: true,
      message: 'your data',
      Data: data,
    };
  }
}
