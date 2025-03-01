import { Injectable } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { UserService } from "../user/user.service";
import { JwtService } from "@nestjs/jwt";
import { User } from "src/entities/User.entity";
import { ConfigService } from "@nestjs/config";
import { UserPayload } from "./user-payload.model";
import { RegisterUserDto } from "./dtos/register-user.dto";

@Injectable()
export class AuthService {
    constructor (
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.userService.getUserByEmail(email);
        if (!user) 
            return null

        // Generate Password Hash
        if (!await bcrypt.compare(password, user.password)){
            return { invalidCredentials: true }
        }

        return user
    }

    async createAndSignPayload(user: User) {
        const payload: UserPayload = { 
            id: user.id, 
            email: user.email
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, { 
                expiresIn: "1m", 
                secret: this.configService.get('JWT_SECRET') 
            }),
            // don't increase payload size as its being stored in database.
            this.jwtService.signAsync(payload, { 
                expiresIn: "5m", 
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
        return await this.userService.createUser(registerUserDto)
    }
}