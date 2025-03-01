import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { Request as RequestType } from 'express'
import { Injectable } from "@nestjs/common";
import { UserPayload } from "./user-payload.model"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
      private readonly configService: ConfigService
    ) {
        super({
            jwtFromRequest: JwtStrategy.authExtractor,
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        });
    }

    private static authExtractor(req: RequestType) {
        if (
            req && req.headers && req.headers.authorization  
        ) {
            return req.headers.authorization
        }
        return null
    }

    async validate(payload: UserPayload) {
        return payload
    }
}
  