import { ResponseUtil } from '@/common/utils/response.util';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { RefreshTokenDto, SignInDto, SignUpDto } from './auth.dto';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('should successfully sign up a user', async () => {
      const signUpDto: SignUpDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@example.com' },
          session: null,
        },
        error: null,
      };

      mockAuthService.signUp.mockResolvedValue(mockResponse);

      const result = await controller.signUp(signUpDto);
      const expectedResult = ResponseUtil.success(
        mockResponse.data,
        'User signed up successfully',
      );

      expect(mockAuthService.signUp).toHaveBeenCalledWith(signUpDto);
      expect(result.success).toBe(expectedResult.success);
      expect(result.message).toBe(expectedResult.message);
      expect(result.data).toEqual(expectedResult.data);
      expect(typeof result.timestamp).toBe('string');
    });
  });

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@example.com' },
          session: {
            access_token: 'access_token',
            refresh_token: 'refresh_token',
          },
        },
        error: null,
      };

      mockAuthService.signIn.mockResolvedValue(mockResponse);

      const result = await controller.signIn(signInDto);
      const expectedResult = ResponseUtil.success(
        mockResponse.data,
        'User signed in successfully',
      );

      expect(mockAuthService.signIn).toHaveBeenCalledWith(signInDto);
      expect(result.success).toBe(expectedResult.success);
      expect(result.message).toBe(expectedResult.message);
      expect(result.data).toEqual(expectedResult.data);
      expect(typeof result.timestamp).toBe('string');
    });
  });

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      const mockResponse = {
        error: null,
      };

      mockAuthService.signOut.mockResolvedValue(mockResponse);

      const result = await controller.signOut();
      const expectedResult = ResponseUtil.success(
        {},
        'User signed out successfully',
      );

      expect(mockAuthService.signOut).toHaveBeenCalled();
      expect(result.success).toBe(expectedResult.success);
      expect(result.message).toBe(expectedResult.message);
      expect(result.data).toEqual(expectedResult.data);
      expect(typeof result.timestamp).toBe('string');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refresh_token: 'refresh_token',
      };
      const refreshToken = refreshTokenDto.refresh_token;
      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@example.com' },
          session: {
            access_token: 'new_access_token',
            refresh_token: 'new_refresh_token',
          },
        },
        error: null,
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const result = await controller.refreshToken(refreshTokenDto);
      const expectedResult = ResponseUtil.success(
        mockResponse.data,
        'Token refreshed successfully',
      );

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshToken);
      expect(result.success).toBe(expectedResult.success);
      expect(result.message).toBe(expectedResult.message);
      expect(result.data).toEqual(expectedResult.data);
      expect(typeof result.timestamp).toBe('string');
    });
  });
});
