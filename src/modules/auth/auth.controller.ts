import { ResponseUtil } from '@/common/utils/response.util';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { SignInDto, SignUpDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private logger: Logger,
  ) {
    this.logger = new Logger(AuthController.name);
  }

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    const result = await this.authService.signUp(signUpDto);
    return ResponseUtil.success(result.data, 'User signed up successfully');
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto) {
    const result = await this.authService.signIn(signInDto);
    return ResponseUtil.success(result.data, 'User signed in successfully');
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async signOut() {
    await this.authService.signOut();
    return ResponseUtil.success({}, 'User signed out successfully');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    const result = await this.authService.refreshToken(refreshToken);
    return ResponseUtil.success(result.data, 'Token refreshed successfully');
  }
}
