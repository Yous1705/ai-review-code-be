import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { CurrentUser } from './decorator/current-user.decorator';
import { JwtPayload } from './jwt.strategy';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body() dto: CreateAuthDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24,
    });

    return {
      success: result.success,
      message: result.message,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMe(@CurrentUser() user: JwtPayload) {
    return this.authService.findMe(user.sub);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
