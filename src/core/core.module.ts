import { Module } from "@nestjs/common";
import { AuthService } from "./auth/auth.service";
import { AuthController } from "./auth/auth.controller";
import { UserService } from "./user/user.service";
import { ConfigModule } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/entities/User.entity";
import { LocalStrategy } from "./auth/local.strategy";
import { RefreshTokenStrategy } from "./auth/refresh-token.strategy";
import { RequestContextModule } from "./request-context/request-context.module";

@Module({
    imports: [
        ConfigModule.forRoot(),
        RequestContextModule,
        TypeOrmModule.forFeature([
            User
        ])
    ],
    controllers: [AuthController],
    providers: [LocalStrategy, RefreshTokenStrategy, JwtService,  AuthService, UserService]
})
export class CoreModule {}