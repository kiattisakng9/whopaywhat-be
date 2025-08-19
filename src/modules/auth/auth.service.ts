import { SUPABASE_CLIENT } from '@/database/supabase.module';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import {
  AuthResponse,
  AuthTokenResponsePassword,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
  SupabaseClient,
} from '@supabase/supabase-js';
import { SignInDto, SignUpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabaseClient: SupabaseClient,
    private readonly prismaService: PrismaService,
  ) {}

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
    const { data, error } = await this.supabaseClient.auth.signUp(credentials);

    if (error) {
      console.error(error);
      throw new BadRequestException(error.message);
    }
    if (!data.user) {
      console.error(error);
      throw new NotFoundException('User not found');
    }

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
    const credentials: SignInWithPasswordCredentials = {
      email,
      password,
    };

    const { data, error }: AuthTokenResponsePassword =
      await this.supabaseClient.auth.signInWithPassword(credentials);

    if (error) {
      console.error(error);
      throw new UnauthorizedException(error.message);
    }

    return { data, error };
  }

  /**
   * Sign out
   * @returns {Promise<void>} Sign out success
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabaseClient.auth.signOut();

    if (error) {
      console.error(error);
      throw new BadRequestException(error.message);
    }
  }
}
