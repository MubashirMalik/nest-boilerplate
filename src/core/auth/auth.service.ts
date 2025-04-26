import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { UserService } from "../user/user.service";
import { JwtService } from "@nestjs/jwt";
import { User } from "src/entities/User.entity";
import { ConfigService } from "@nestjs/config";
import { RefreshTokenPayload, UserPayload } from "./user-payload.model";
import { RegisterUserDto } from "./dtos/register-user.dto";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "src/constants";

@Injectable()
export class AuthService {
    constructor (
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.userService.getUserBy({ email });
        if (!user) 
            return null

        // Generate Password Hash
        if (!await bcrypt.compare(password, user.password)){
            return { invalidCredentials: true }
        }

        return user
    }

    async getSignedAccessToken(user: User) {
        const payload: UserPayload = { 
            id: user.id,
            email: user.email
        };

        const accessToken = await this.jwtService.signAsync(payload, { 
            expiresIn: ACCESS_TOKEN_EXPIRY, 
            secret: this.configService.get('JWT_SECRET') 
        })

        return accessToken
    }

    async createAndSignPayload(user: User) {
        const refreshTokenPayload: RefreshTokenPayload = {
            id: user.id, 
            email: user.email,
        }

        const [accessToken, refreshToken] = await Promise.all([
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
            user: {
                id: user.id,
                email: user.email
            },
            accessToken,
            refreshToken
        };
    }

    async login(user: User) {
        return this.createAndSignPayload(user)
    }

    async registerUser(registerUserDto: RegisterUserDto) {
        const user = await this.userService.createUser(registerUserDto)
        return this.login(user)
    }

    async refreshAccessToken(user: User) {
        return { 
            user: {
                id: user.id,
                email: user.email
            }, 
            accessToken: await this.getSignedAccessToken(user) 
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

        const user = await this.userService.getUserBy({ refreshToken, id: payload.id })
        if (!user)
            throw new UnauthorizedException('Invalid Refresh Token')
        
        return user
    }
}