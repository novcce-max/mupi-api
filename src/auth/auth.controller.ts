import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AuthService, AuthResult } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SendRegisterCodeDto } from './dto/send-register-code.dto';
import { RegisterCompleteDto } from './dto/register-complete.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/send-code')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async sendRegisterCode(@Body() dto: SendRegisterCodeDto) {
    return this.authService.sendRegisterCode(dto.email);
  }

  @Post('register/complete')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async registerComplete(
    @Body() dto: RegisterCompleteDto,
  ): Promise<AuthResult> {
    return this.authService.registerComplete(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
