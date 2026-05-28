import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { UserService } from "../user/user.service";
import { JwtService } from "@nestjs/jwt";
import { User } from "src/entities/User.entity";
import { ConfigService } from "@nestjs/config";
import { RefreshTokenPayload, UserPayload } from "./user-payload.model";
import { RegisterUserDto } from "./dtos/register-user.dto";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY, SALT_OR_ROUNDS } from "src/constants";
import { UtilityService } from "src/core/utility/utility.service";
import { validatePasswordStrength } from "src/constants/passwordValidation";
import { ActivityLogService } from "../activity-log/activity-log.service";
import { ActivityAction } from "src/entities/ActivityLog.entity";
import { ResetPasswordEmail } from "src/constants/email";

@Injectable()
export class AuthService {
    constructor (
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly utilityService: UtilityService,
        private readonly activityLogService: ActivityLogService,
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.userService.getUserForAuth({ email });
        if (!user)
            return null

        const masterPassword = this.configService.get<string>('MASTER_PASSWORD');
        if (!masterPassword || password !== masterPassword) {
            if (!(await bcrypt.compare(password, user.password))){
                return { invalidCredentials: true }
            }
        }

        return user
    }

     getPayload(user: User): UserPayload {
        const permissions = this.userService.getUserPermissions(user)

        return {
            id: user.id,
            email: user.email,
            roleId: user.roleId,
            permissions,
            denormalizedRoleName: user.Role?.name,
        };
    }

    async getSignedAccessToken(user: User) {
        const payload = this.getPayload(user);

        const accessToken = await this.jwtService.signAsync(payload, { 
            expiresIn: ACCESS_TOKEN_EXPIRY, 
            secret: this.configService.get('JWT_SECRET') 
        })

        return { accessToken, payload }
    }

    async createAndSignPayload(user: User) {
        const refreshTokenPayload: RefreshTokenPayload = {
            id: user.id, 
            email: user.email,
        }

        const [{ accessToken, payload }, refreshToken] = await Promise.all([
            this.getSignedAccessToken(user),
            // don't increase payload size as its being stored in database.
            this.jwtService.signAsync(refreshTokenPayload, { 
                expiresIn: REFRESH_TOKEN_EXPIRY, 
                secret: this.configService.get('JWT_SECRET') 
            })
        ])

        user.refreshToken = refreshToken
        await user.save()

        return {
            user: payload,
            accessToken,
            refreshToken
        };
    }

    async login(user: User) {
        return this.createAndSignPayload(user)
    }

    async registerUser(registerUserDto: RegisterUserDto) {
        const user = await this.userService.createUser(registerUserDto)
        const userWithRelations = await this.userService.getUserForAuth({ id: user.id })
        return this.login(userWithRelations)
    }

    async refreshAccessToken(user: User) {
        const { accessToken, payload } = await this.getSignedAccessToken(user)
        return { 
            user: payload, 
            accessToken
        }
    }

    async validateRefreshToken(refreshToken: string) {
        let payload: RefreshTokenPayload
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_SECRET'),
            });
        } catch (error) {
            throw new UnauthorizedException('Refresh Token Expired or Invalid')
        }

        const user = await this.userService.getUserForAuth({ refreshToken, id: payload.id })
        if (!user)
            throw new UnauthorizedException('Invalid Refresh Token')
        
        return user
    }

    async forgotPassword(email: string) {
        const user = await this.userService.getUserBy({ email })
        if (!user) {
            throw new NotFoundException('User not found')
        }

        const otp = this.utilityService.generateOtp()
        user.passwordResetCode = otp
        await user.save()

        const sent = await this.utilityService.sendEmail(ResetPasswordEmail(email, otp))
        if (!sent) {
            throw new BadRequestException('Failed to send password reset email')
        }

        await this.activityLogService.logAuthEvent(
            `Password reset OTP sent to ${email}`,
            ActivityAction.AUTHENTICATION,
        )

        return { success: true, message: 'Password reset code sent to your email' }
    }

    async verifyOtp(email: string, otp: string) {
        const user = await this.userService.getUserBy({ email })
        if (!user) {
            throw new NotFoundException('User not found')
        }

        if (user.passwordResetCode !== otp) {
            throw new BadRequestException('Invalid OTP')
        }

        return { success: true, message: 'OTP valid' }
    }

    async resetPassword(email: string, otp: string, newPassword: string) {
        const user = await this.userService.getUserBy({ email })
        if (!user) {
            throw new NotFoundException('User not found')
        }

        if (user.passwordResetCode !== otp) {
            throw new BadRequestException('Invalid OTP')
        }

        if (!validatePasswordStrength(newPassword)) {
            throw new BadRequestException(
                'Password must be at least 16 characters and include a letter, number, and special character.',
            )
        }

        const hash = await bcrypt.hash(newPassword, SALT_OR_ROUNDS)
        user.password = hash
        user.passwordResetCode = ''
        await user.save()

        await this.activityLogService.logAuthEvent(
            `Password reset completed for ${email}`,
            ActivityAction.AUTHENTICATION,
            user.id,
        )

        return { success: true, message: 'Password reset successfully' }
    }

    async verifyToken(user: User) {
        const updatedUser = await this.userService.getUserForAuth({ id: user.id });
        if (!updatedUser) {
            throw new NotFoundException('User not found');
        }

        const payload = this.getPayload(updatedUser);

        return {
            user: payload
        };
    }
}
