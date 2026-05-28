import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { RoleGuard } from './guards/role.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { JwtStrategy } from './core/auth/jwt.strategy';
import { CoreModule } from './core/core.module';
import { MetadataSeeder } from './seed/metadata.seed';
import { LogRequestMiddleware } from './middlewares/LogRequest.middleware';
import { BullModule } from '@nestjs/bullmq';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: `.env`
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const useTLS = configService.get('REDIS_USE_TLS') === 'true';
                return {
                    connection: {
                        host: configService.get('REDIS_HOST') || 'localhost',
                        port: parseInt(configService.get('REDIS_PORT') ?? '6379', 10),
                        password: configService.get('REDIS_PASSWORD') || undefined,
                        ...(useTLS ? { tls: {} } : {}),
                    },
                    defaultJobOptions: {
                        attempts: 3,
                        lifo: false,
                    },
                };
            },
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
                poolSize: 30,
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
        {
            provide: APP_GUARD,
            useClass: PermissionGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RoleGuard,
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
