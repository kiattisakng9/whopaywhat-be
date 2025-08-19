import { PrismaService } from '@/database/prisma.service';
import { SupabaseService } from '@/database/supabase.service';
import {
  BadRequestException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthApiError } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto } from './auth.dto';

describe('AuthService', () => {
  let service: AuthService;

  const mockSupabaseClient = {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
    },
  };

  const mockPrismaService = {
    userProfile: {
      create: jest.fn(),
    },
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn(() => mockSupabaseClient),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    const signUpDto: SignUpDto = {
      email: 'test@example.com',
      password: 'Password123',
      firstName: 'John',
      lastName: 'Doe',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      created_at: '2023-01-01T00:00:00.000Z',
    };

    const mockAuthResponse = {
      data: {
        user: mockUser,
        session: null,
      },
      error: null,
    };

    it('should successfully sign up a user', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue(mockAuthResponse);
      mockPrismaService.userProfile.create.mockResolvedValue({
        id: mockUser.id,
        email: signUpDto.email,
        firstName: signUpDto.firstName,
        lastName: signUpDto.lastName,
        avatarUrl: signUpDto.avatarUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.signUp(signUpDto);

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: signUpDto.email,
        password: signUpDto.password,
        options: {
          data: {
            email: signUpDto.email,
            firstName: signUpDto.firstName,
            lastName: signUpDto.lastName,
            avatarUrl: signUpDto.avatarUrl,
          },
        },
      });
      expect(mockPrismaService.userProfile.create).toHaveBeenCalledWith({
        data: {
          id: mockUser.id,
          email: signUpDto.email,
          firstName: signUpDto.firstName,
          lastName: signUpDto.lastName,
          avatarUrl: signUpDto.avatarUrl,
        },
      });
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw BadRequestException when required fields are missing', async () => {
      const invalidDto = {
        email: '',
        password: '',
        firstName: '',
        lastName: '',
      } as SignUpDto;

      await expect(service.signUp(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when Supabase returns AuthApiError', async () => {
      const authError = new AuthApiError('Email already registered', 422, '');
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: authError,
      });

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when Supabase returns generic error', async () => {
      const genericError = new Error('Network error');
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: genericError,
      });

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when user is not created', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('signIn', () => {
    const signInDto: SignInDto = {
      email: 'test@example.com',
      password: 'Password123',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    const mockSession = {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser,
    };

    const mockSignInResponse = {
      data: {
        user: mockUser,
        session: mockSession,
        weakPassword: undefined,
      },
      error: null,
    };

    it('should successfully sign in a user', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        mockSignInResponse,
      );

      const result = await service.signIn(signInDto);

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: signInDto.email,
        password: signInDto.password,
      });
      expect(result).toEqual(mockSignInResponse);
    });

    it('should throw BadRequestException when Supabase returns AuthApiError', async () => {
      const authError = new AuthApiError('Invalid login credentials', 400, '');
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null, weakPassword: null },
        error: authError,
      });

      await expect(service.signIn(signInDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException when Supabase returns generic error', async () => {
      const genericError = new Error('Authentication failed');
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null, weakPassword: null },
        error: genericError,
      });

      await expect(service.signIn(signInDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      await service.signOut();

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should throw BadRequestException when sign out fails', async () => {
      const error = new Error('Sign out failed');
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error });

      await expect(service.signOut()).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'refresh-token-123';
    const mockRefreshResponse = {
      data: {
        user: { id: 'user-123', email: 'test@example.com' },
        session: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: 'user-123', email: 'test@example.com' },
        },
      },
      error: null,
    };

    it('should successfully refresh token', async () => {
      mockSupabaseClient.auth.refreshSession.mockResolvedValue(
        mockRefreshResponse,
      );

      const result = await service.refreshToken(refreshToken);

      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalledWith({
        refresh_token: refreshToken,
      });
      expect(result).toEqual(mockRefreshResponse);
    });

    it('should throw BadRequestException when refresh token is invalid', async () => {
      const error = new Error('Invalid refresh token');
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { user: null, session: null },
        error,
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
