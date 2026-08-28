import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  constructor(private readonly repo: AuthRepository) {}

  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  async findAll() {
    const data = await this.repo.findAll();
    return {
      success: true,
      message: 'your data',
      yourData: data,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
