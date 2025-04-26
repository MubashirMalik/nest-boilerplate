
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
} from '@nestjs/common';
import { Response } from 'express';
  
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(
    ) {}

    catch(exception: HttpException , host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const exceptionResponse: any = exception.getResponse().valueOf()
        const statusCode = exception.getStatus()
        let message = ''
        
        // Error Handling for Inputs/Form etc. 
        let fieldErrors = []
        if (exceptionResponse && Array.isArray(exceptionResponse.message)) {
            fieldErrors = exceptionResponse.message   

            if (fieldErrors.length > 0) {
                fieldErrors = fieldErrors.reduce((acc, errorObj) => {
                    // Get the key and value from the current object
                    const key = Object.keys(errorObj)[0];
                    const value = errorObj[key];
                  
                    // Add the key-value pair to the accumulator object
                    acc[key] = value;
                    return acc;
                }, {});
                message = 'Validation failed for input data.'
            } 
        }

        const responseBody = {
            ...exceptionResponse,
            fieldErrors,
        };

        if (message) responseBody['message'] = message

        response
            .status(statusCode)
            .json({
                timestamp: new Date().toISOString(),
                ...responseBody
            });
    }
}
  