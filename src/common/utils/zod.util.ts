import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

/**
 * Utility class for Zod schema validation
 */
export class ZodUtil {
  /**
   * Validates data against a Zod schema and throws BadRequestException on failure
   * @param schema - The Zod schema to validate against
   * @param data - The data to validate
   * @returns The validated and parsed data
   * @throws BadRequestException if validation fails
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map(
          (err) => `${err.path.join('.')}: ${err.message}`,
        );
        throw new BadRequestException({
          message: 'Validation failed',
          errors: errorMessages,
        });
      }
      throw error;
    }
  }

  /**
   * Safely validates data against a Zod schema without throwing exceptions
   * @param schema - The Zod schema to validate against
   * @param data - The data to validate
   * @returns Object with success flag and either data or error
   */
  static safeValidate<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
  ): { success: true; data: T } | { success: false; error: z.ZodError } {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  }

  /**
   * Formats Zod validation errors into a user-friendly format
   * @param error - The ZodError to format
   * @returns Array of formatted error messages
   */
  static formatErrors(error: z.ZodError): string[] {
    return error.issues.map((err) => {
      const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
      return `${path}${err.message}`;
    });
  }

  /**
   * Creates a validation decorator for use with NestJS controllers
   * @param schema - The Zod schema to validate against
   * @returns A validation function that can be used as a decorator
   */
  static createValidator<T>(schema: z.ZodSchema<T>) {
    return (data: unknown): T => {
      return ZodUtil.validate(schema, data);
    };
  }
}
