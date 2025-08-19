import configuration from '@/config/configuration';
import { PrismaService } from '@/database/prisma.service';
import { SupabaseService } from '@/database/supabase.service';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from './auth.module';

describe('Auth Integration Tests', () => {
  let app: INestApplication;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userProfile: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  const mockSupabaseService = {
    getClient: jest.fn().mockReturnValue({
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        refreshSession: jest.fn(),
      },
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        AuthModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply the same validation pipe as in main.ts
    app.useGlobalPipes(new ZodValidationPipe());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/signup', () => {
    it('should successfully sign up a new user', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockAuthResponse = {
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            email_confirmed_at: new Date().toISOString(),
          },
          session: null,
        },
        error: null,
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSupabaseService
        .getClient()
        .auth.signUp.mockResolvedValue(mockAuthResponse);
      mockPrismaService.userProfile.create.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer() as App)
        .post('/auth/signup')
        .send(signUpData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User signed up successfully',
        data: mockAuthResponse.data,
      });

      expect(mockSupabaseService.getClient().auth.signUp).toHaveBeenCalledWith({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            email: signUpData.email,
            firstName: signUpData.firstName,
            lastName: signUpData.lastName,
            avatarUrl: undefined,
          },
        },
      });

      expect(mockPrismaService.userProfile.create).toHaveBeenCalledWith({
        data: {
          id: 'user-123',
          email: signUpData.email,
          firstName: signUpData.firstName,
          lastName: signUpData.lastName,
          avatarUrl: undefined,
        },
      });
    });

    it('should return 400 for invalid email format', async () => {
      const invalidSignUpData = {
        email: 'invalid-email',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer() as App)
        .post('/auth/signup')
        .send(invalidSignUpData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Validation failed');
      expect(response.body.statusCode).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteSignUpData = {
        email: 'test@example.com',
        // missing password, firstName, lastName
      };

      const response = await request(app.getHttpServer() as App)
        .post('/auth/signup')
        .send(incompleteSignUpData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Validation failed');
      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('POST /auth/signin', () => {
    it('should successfully sign in an existing user', async () => {
      const signInData = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const mockSignInResponse = {
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
          },
        },
        error: null,
      };

      mockSupabaseService
        .getClient()
        .auth.signInWithPassword.mockResolvedValue(mockSignInResponse);

      const response = await request(app.getHttpServer() as App)
        .post('/auth/signin')
        .send(signInData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User signed in successfully',
        data: mockSignInResponse.data,
      });

      expect(
        mockSupabaseService.getClient().auth.signInWithPassword,
      ).toHaveBeenCalledWith({
        email: signInData.email,
        password: signInData.password,
      });
    });

    it('should return 400 for invalid credentials format', async () => {
      const invalidSignInData = {
        email: 'invalid-email',
        password: 'short',
      };

      const response = await request(app.getHttpServer() as App)
        .post('/auth/signin')
        .send(invalidSignInData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Validation failed');
      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('POST /auth/signout', () => {
    it('should successfully sign out a user', async () => {
      const mockSignOutResponse = {
        error: null,
      };

      mockSupabaseService
        .getClient()
        .auth.signOut.mockResolvedValue(mockSignOutResponse);

      const response = await request(app.getHttpServer() as App)
        .post('/auth/signout')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User signed out successfully',
        data: {},
      });

      expect(mockSupabaseService.getClient().auth.signOut).toHaveBeenCalled();
    });
  });

  describe('POST /auth/refresh', () => {
    it('should successfully refresh token', async () => {
      const refreshTokenData = {
        refresh_token: 'valid-refresh-token',
      };

      const mockRefreshResponse = {
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
          session: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
          },
        },
        error: null,
      };

      mockSupabaseService
        .getClient()
        .auth.refreshSession.mockResolvedValue(mockRefreshResponse);

      const response = await request(app.getHttpServer() as App)
        .post('/auth/refresh')
        .send(refreshTokenData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token refreshed successfully',
        data: mockRefreshResponse.data,
      });

      expect(
        mockSupabaseService.getClient().auth.refreshSession,
      ).toHaveBeenCalledWith({
        refresh_token: refreshTokenData.refresh_token,
      });
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app.getHttpServer() as App)
        .post('/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Validation failed');
      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full authentication flow: signup -> signin -> refresh -> signout', async () => {
      // Step 1: Sign up
      const signUpData = {
        email: 'flow-test@example.com',
        password: 'Password123',
        firstName: 'Flow',
        lastName: 'Test',
      };

      const mockSignUpResponse = {
        data: {
          user: { id: 'flow-user-123', email: 'flow-test@example.com' },
          session: null,
        },
        error: null,
      };

      mockSupabaseService
        .getClient()
        .auth.signUp.mockImplementation((credentials) => {
          // Verify the credentials structure matches what AuthService sends
          expect(credentials).toEqual({
            email: signUpData.email,
            password: signUpData.password,
            options: {
              data: {
                email: signUpData.email,
                firstName: signUpData.firstName,
                lastName: signUpData.lastName,
                avatarUrl: undefined,
              },
            },
          });
          return Promise.resolve(mockSignUpResponse);
        });
      mockPrismaService.userProfile.create.mockResolvedValue({
        id: 'flow-user-123',
        email: 'flow-test@example.com',
        firstName: 'Flow',
        lastName: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const signUpResponse = await request(app.getHttpServer() as App)
        .post('/auth/signup')
        .send(signUpData)
        .expect(201);

      expect(signUpResponse.body.success).toBe(true);

      // Step 2: Sign in
      const mockSignInResponse = {
        data: {
          user: { id: 'flow-user-123', email: 'flow-test@example.com' },
          session: {
            access_token: 'flow-access-token',
            refresh_token: 'flow-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
          },
        },
        error: null,
      };

      mockSupabaseService
        .getClient()
        .auth.signInWithPassword.mockResolvedValue(mockSignInResponse);

      const signInResponse = await request(app.getHttpServer() as App)
        .post('/auth/signin')
        .send({ email: signUpData.email, password: signUpData.password })
        .expect(200);

      expect(signInResponse.body.success).toBe(true);
      const refreshToken = signInResponse.body.data.session
        .refresh_token as string;

      // Step 3: Refresh token
      const mockRefreshResponse = {
        data: {
          user: { id: 'flow-user-123', email: 'flow-test@example.com' },
          session: {
            access_token: 'new-flow-access-token',
            refresh_token: 'new-flow-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
          },
        },
        error: null,
      };

      mockSupabaseService
        .getClient()
        .auth.refreshSession.mockResolvedValue(mockRefreshResponse);

      const refreshResponse = await request(app.getHttpServer() as App)
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);

      // Step 4: Sign out
      mockSupabaseService
        .getClient()
        .auth.signOut.mockResolvedValue({ error: null } as any);

      const signOutResponse = await request(app.getHttpServer() as App)
        .post('/auth/signout')
        .expect(200);

      expect(signOutResponse.body.success).toBe(true);
    });
  });
});
