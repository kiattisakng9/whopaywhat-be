import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Zod schemas
export const SignUpSchema = z.object({
  email: z.email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
    ),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  avatarUrl: z.url('Invalid URL format').optional(),
});

export const SignInSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// DTOs using nestjs-zod
export class SignUpDto extends createZodDto(SignUpSchema) {}
export class SignInDto extends createZodDto(SignInSchema) {}

// Type exports for use in services
export type SignUpType = z.infer<typeof SignUpSchema>;
export type SignInType = z.infer<typeof SignInSchema>;
