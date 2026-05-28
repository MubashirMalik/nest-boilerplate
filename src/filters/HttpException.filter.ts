
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from 'src/core/utility/utility.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(
        private readonly utilitiesService: UtilityService
    ) {}

    async catch(exception: any, host: ArgumentsHost): Promise<void> {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let statusCode: number;
        let message = ''
        let exceptionResponse: any = {};
        let fieldErrors: any[] = [];

        if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            exceptionResponse = exception.getResponse().valueOf();

            if (exceptionResponse && Array.isArray(exceptionResponse.message)) {
                fieldErrors = exceptionResponse.message;

                if (fieldErrors.length > 0) {
                    fieldErrors = fieldErrors.reduce((acc, errorObj) => {
                        const key = Object.keys(errorObj)[0];
                        const value = errorObj[key];
                        acc[key] = value;
                        return acc;
                    }, {});
                    message = 'Validation failed for input data.'
                }
            }
        } else {
            statusCode = 500;
            message = exception.message || 'Internal server error';
            exceptionResponse = {
                message: message,
                error: 'Internal Server Error'
            };
        }

        const responseBody = {
            ...exceptionResponse,
            fieldErrors,
        };

        const logMessage = typeof exceptionResponse.message === 'string'
            ? exceptionResponse.message
            : message || 'Unknown error';

        await this.utilitiesService.saveErrorLog(
            statusCode,
            ctx.getRequest().url,
            logMessage,
            exception.stack ?? '',
        );

        if (message) responseBody['message'] = message

        response
            .status(statusCode)
            .json({
                timestamp: new Date().toISOString(),
                ...responseBody
            });
    }
}
