import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(
        private authService: AuthService,
    ) {
        super({
            usernameField: 'email',
            passReqToCallback: true
        });  
    }

    async validate(request: Request, email: string, password: string) {
        const userResult = await this.authService.validateUser(email, password);
        if (!userResult) {  
            throw new NotFoundException("User not found");
        } else if ('invalidCredentials' in userResult) {
            throw new UnauthorizedException('Invalid credentials')
        }
        return userResult
    }
}