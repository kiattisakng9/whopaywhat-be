import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { ExceptionInterceptor } from '@common/interceptors/exception.interceptor';
import { ExceptionHandlerService } from '@common/services/exception-handler.service';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [
    ExceptionHandlerService,
    GlobalExceptionFilter,
    ExceptionInterceptor,
  ],
  exports: [
    ExceptionHandlerService,
    GlobalExceptionFilter,
    ExceptionInterceptor,
  ],
})
export class ExceptionModule {}
