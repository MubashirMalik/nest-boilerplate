import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { JwtStrategy } from './core/auth/jwt.strategy';
import { CoreModule } from './core/core.module';
import { MetadataSeeder } from './seed/metadata.seed';
import { LogRequestMiddleware } from './middlewares/LogRequest.middleware';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: `.env`
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'mysql',
                host: configService.get('DB_HOST'),
                port: configService.get('DB_PORT'),
                username: configService.get('DB_USERNAME'),
                password: configService.get('DB_PASSWORD'),
                database: configService.get('DB_NAME'),
                entities: [join(process.cwd(), 'dist/**/entities/*.entity.js')],
                subscribers: [join(process.cwd(), 'dist/**/subscribers/*.subscriber.js')],
                logging: ['error'],
                synchronize: true, //! Don't use in production,
                // dropSchema:true, //! Don't use in production,
            })
        }),
        CoreModule
    ],
    controllers: [AppController],
    providers: [
        JwtStrategy,
        AppService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        MetadataSeeder
    ],
})
export class AppModule implements NestModule {
     configure(consumer: MiddlewareConsumer) {
        // Middleware to log web requests in order to monitor performance for different API endpoints
        consumer
        .apply(LogRequestMiddleware)
        .forRoutes('*');    
    }
}
