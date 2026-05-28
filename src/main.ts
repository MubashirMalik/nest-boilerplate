import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import * as fs from 'fs';
import { MetadataSeeder } from './seed/metadata.seed';
import { HttpExceptionFilter } from './filters/HttpException.filter';
import { UtilityService } from './core/utility/utility.service';

async function bootstrap() {
    // const httpsOptions = {
    //     key: fs.readFileSync('./key.pem'),
    //     cert: fs.readFileSync('./cert.pem'),
    // };

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        rawBody: true,
        // ...httpsOptions
    });

    // Parsers
    app.useBodyParser('json');
    app.use(cookieParser())

    const httpAdapter = app.get(HttpAdapterHost);
    app.useGlobalFilters(new HttpExceptionFilter(app.get(UtilityService)));

    // Pipes
    app.useGlobalPipes(new ValidationPipe(
        {
            exceptionFactory: (validationErrors: ValidationError[]) => new BadRequestException(  
                validationErrors.map((error) => ({
                    [error.property]: Object.values(error.constraints)
                })
            )),
            transform: true,
            transformOptions: { enableImplicitConversion: true },
            // If set to true, validator will strip validated (returned) object of any properties that do not use any validation decorators.
            whitelist: true
        }
    ));

    // Disable Swagger API in environments other than development (staging, production)
    if (process.env.NEST_ENV === 'development') {
        const config = new DocumentBuilder()
            .setTitle('Nest Boilerplate')
            .setDescription('Nest API boilerplate')
            .setVersion('1.0')
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api', app, document, {
            swaggerOptions: {
                defaultModelsExpandDepth: -1,
                defaultModelExpandDepth: 3,
                apisSorter: 'alpha',
                operationsSorter: 'alpha',
                tagsSorter: 'alpha',
                docExpansion: 'none',
                filter: true,
                showRequestHeaders: true,
            },
        });
    }

    app.enableCors({
        methods: ['GET', 'PUT', 'POST', 'OPTION', 'DELETE', 'PATCH'],
        origin: [
            'https://192.168.1.100:5173',
            'https://localhost:5173',
            'http://localhost:5173',
        ],
        credentials: true, // Allow cookies to be sent
    })


    const metadataSeeder = app.get(MetadataSeeder);
    await metadataSeeder.seedData();

    await app.listen(process.env.SERVER_PORT);
}
bootstrap();
