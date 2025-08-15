export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
  timestamp: string;
  path?: string;
}

export class ResponseUtil {
  static success<T>(
    data?: T,
    message: string = 'Operation successful',
    path?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  static error(
    message: string = 'Operation failed',
    error?: unknown,
    path?: string,
  ): ApiResponse {
    return {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  static created<T>(
    data?: T,
    message: string = 'Resource created successfully',
    path?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  static updated<T>(
    data?: T,
    message: string = 'Resource updated successfully',
    path?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  static deleted(
    message: string = 'Resource deleted successfully',
    path?: string,
  ): ApiResponse {
    return {
      success: true,
      message,
      timestamp: new Date().toISOString(),
      path,
    };
  }
}
