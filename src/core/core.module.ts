import { Module } from "@nestjs/common";
import { AuthService } from "./auth/auth.service";
import { AuthController } from "./auth/auth.controller";
import { UserService } from "./user/user.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/entities/User.entity";
import { LocalStrategy } from "./auth/local.strategy";
import { RefreshTokenStrategy } from "./auth/refresh-token.strategy";
import { RequestContextModule } from "./request-context/request-context.module";
import { UtilityService } from "./utility/utility.service";
import { MailerModule } from "@nestjs-modules/mailer";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
    imports: [
        ConfigModule.forRoot(),
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                transport: {
                    host: configService.get('MAIL_HOST'),
                    port: configService.get('MAIL_PORT'),
                    secure: false,
                    auth: {
                        user: configService.get('MAIL_USER'),
                        pass: configService.get('MAIL_PASS')
                    }
                }
            }),
            inject: [ConfigService]
        }),
        ScheduleModule.forRoot(),
        RequestContextModule,
        TypeOrmModule.forFeature([
            User
        ])
    ],
    controllers: [AuthController],
    providers: [LocalStrategy, RefreshTokenStrategy, JwtService,  AuthService, UserService, UtilityService]
})
export class CoreModule {}