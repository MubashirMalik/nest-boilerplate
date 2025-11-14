import { Request, Response, NextFunction } from 'express';
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

@Injectable()
export class LogRequestMiddleware implements NestMiddleware {
    private logger = new Logger('LogRequest');
    constructor() {}

    async use(request: Request, response: Response, next: NextFunction): Promise<void> {
        const startAt = Date.now();
        this.logger.log(`${request.method} ${request.originalUrl} request received`);

        // Handle response finish event
        response.on('finish', async () => {
            const responseTime = (Date.now() - startAt) / 1000; //save time for request in seconds
       
            this.logger.log(`${request.method} ${request.originalUrl} ${response.statusCode} ${responseTime}s`);
        });

        // Handle request close/abort events
        request.on('close', () => {
            const responseTime = (Date.now() - startAt) / 1000;
            this.logger.warn(`🚫 REQUEST CANCELLED: ${request.method} ${request.originalUrl} - Client disconnected after ${responseTime}s`);
        });

        request.on('aborted', () => {
            const responseTime = (Date.now() - startAt) / 1000;
            this.logger.warn(`🚫 REQUEST ABORTED: ${request.method} ${request.originalUrl} - Request aborted after ${responseTime}s`);
        });

        next();
    }
}
