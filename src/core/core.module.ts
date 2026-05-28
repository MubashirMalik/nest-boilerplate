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
import { AwsService } from "./aws/aws.service";
import { List } from "src/entities/List.entity";
import { ErrorLog } from "src/entities/Error.entity";
import { CronJobService } from "./cron-job/cron-job.service";
import { Permission } from "src/entities/Permission.entity";
import { Role } from "src/entities/Role.entity";
import { RoleXPermission } from "src/entities/RoleXPermission.entity";
import { UserXPermission } from "src/entities/UserXPermission.entity";
import { ActivityLog } from "src/entities/ActivityLog.entity";
import { UtilityController } from "./utility/utility.controller";
import { RoleService } from "./role/role.service";
import { RoleController } from "./role/role.controller";
import { ActivityLogService } from "./activity-log/activity-log.service";
import { ActivityLogController } from "./activity-log/activity-log.controller";
import { BullModule } from "@nestjs/bullmq";
import { ActivityLogProcessor } from "src/processors/activity-log.processor";
import { UserSubscriber } from "src/subscribers/UserSubscriber";

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
        BullModule.registerQueue({ name: 'activity-log' }),
        TypeOrmModule.forFeature([
            User, List, ErrorLog, Role, Permission, RoleXPermission, UserXPermission, ActivityLog
        ])
    ],
    controllers: [AuthController, UtilityController, RoleController, ActivityLogController],
    providers: [
        LocalStrategy, RefreshTokenStrategy, JwtService, AuthService, UserService, UtilityService, AwsService,
        RoleService, ActivityLogService, ActivityLogProcessor, UserSubscriber,
        ...(process.env.RUN_CRON_JOBS === 'yes' ? [CronJobService] : []),
    ],
    exports: [UtilityService, ActivityLogService],
})
export class CoreModule {}
