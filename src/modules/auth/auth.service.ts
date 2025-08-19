import { PrismaService } from '@/database/prisma.service';
import { SupabaseService } from '@/database/supabase.service';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuthApiError,
  AuthResponse,
  AuthTokenResponsePassword,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
} from '@supabase/supabase-js';
import { SignInDto, SignUpDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
  ) {
    this.logger = new Logger(AuthService.name);
  }

  /**
   * Sign up with email and password
   * @param {SignUpDto} param {email, password}
   * @returns {Promise<AuthTokenResponsePassword>} Sign up success
   * @throws {BadRequestException} If email or password is invalid
   */
  async signUp({
    email,
    password,
    firstName,
    lastName,
    avatarUrl,
  }: SignUpDto): Promise<AuthResponse> {
    this.logger.log('Sign up request received: ', email);
    if (!email || !password || !firstName || !lastName) {
      throw new BadRequestException(
        'Email, password, firstName, and lastName are required',
      );
    }

    const credentials: SignUpWithPasswordCredentials = {
      email,
      password,
      options: {
        data: {
          email,
          firstName,
          lastName,
          avatarUrl,
        },
      },
    };

    this.logger.log('Sign up request sent to Supabase');
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.signUp(credentials);

    if (error instanceof AuthApiError) {
      this.logger.error(error);
      throw new BadRequestException(error.message);
    }
    if (error) {
      this.logger.error(error);
      throw new BadRequestException('Sign up failed');
    }
    if (!data.user) {
      this.logger.error(error);
      throw new NotFoundException('User not created');
    }

    await this.prismaService.userProfile.create({
      data: {
        id: data.user.id,
        email,
        firstName,
        lastName,
        avatarUrl,
      },
    });
    this.logger.log('User created: ', data.user.id);

    return { data, error: null };
  }

  /**
   * Sign in with email and password
   * @param {SignUpDto} param {email, password}
   * @returns {AuthTokenResponsePassword} User, session, and weak password
   * @throws {UnauthorizedException} If email or password is incorrect
   */
  async signIn({
    email,
    password,
  }: SignInDto): Promise<AuthTokenResponsePassword> {
    this.logger.log('Sign in request received: ', email);
    const credentials: SignInWithPasswordCredentials = {
      email,
      password,
    };

    this.logger.log('Sign in request sent to Supabase');
    const { data, error }: AuthTokenResponsePassword =
      await this.supabaseService
        .getClient()
        .auth.signInWithPassword(credentials);

    if (error instanceof AuthApiError) {
      this.logger.error(error);
      throw new BadRequestException(error.message);
    }
    if (error) {
      this.logger.error(error);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log('Sign in success: ', data.user.id);
    return { data, error };
  }

  /**
   * Sign out
   * @returns {Promise<void>} Sign out success
   */
  async signOut(): Promise<void> {
    this.logger.log('Sign out request received');
    const { error } = await this.supabaseService.getClient().auth.signOut();

    if (error) {
      this.logger.error(error);
      throw new BadRequestException('Sign out failed');
    }
    this.logger.log('Sign out success');
  }

  /**
   * Refresh token
   * @param refreshToken Refresh token
   * @returns New access token and refresh token
   * @throws {BadRequestException} If refresh token is invalid
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    this.logger.log('Refresh token request received: ', refreshToken);
    this.logger.log('Refresh token request sent to Supabase');
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.refreshSession({
        refresh_token: refreshToken,
      });

    if (error) {
      this.logger.error(error);
      throw new BadRequestException('Invalid refresh token');
    }
    this.logger.log('Refresh token success: ', data.session?.access_token);
    return { data, error };
  }
}
