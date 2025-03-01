import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { UnauthorizedException } from '@nestjs/common';
import { Request as RequestType } from 'express'
import { AuthService } from './auth.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'refresh-token') {
    constructor(
        private authService: AuthService,
    ) {
        super();
    }
  
    extractRefreshTokenFromCookie(req: RequestType): string | null {
        if (req.cookies && 'refreshToken' in req.cookies && req.cookies.refreshToken.length > 0) {
            return req.cookies.refreshToken;
        }
        return null;
    }

    async validate(req: RequestType) {
        // Extract the refresh token from the cookie
        const refreshToken = this.extractRefreshTokenFromCookie(req);
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        return await this.authService.validateRefreshToken(refreshToken);
    }
}