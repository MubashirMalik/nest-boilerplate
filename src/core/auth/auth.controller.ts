import { Body, Controller, Get, Injectable, Post, Request, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "src/guards/local-auth.guard";
import { ApiTags } from "@nestjs/swagger";
import { RegisterUserDto } from "./dtos/register-user.dto";
import { PublicRoute } from "../decorators/public-route.decorator";
import { RefreshTokenGuard } from "src/guards/refresh-token.guard";
import { REFRESH_TOKEN_MAX_AGE } from "src/constants";

@Injectable()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) {}

    @PublicRoute()
    @Post('register-user')
    async registerTenant(
        @Body() registerUser: RegisterUserDto,
    ) {
        return await this.authService.registerUser(registerUser)
    }

    @PublicRoute()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(
       @Request() req,
       @Res({ passthrough: true }) res
    ) { 
        const { user, accessToken, refreshToken } = await this.authService.login(req.user)

        res.cookie(
            'refreshToken', 
            refreshToken, 
            { 
                httpOnly: true, 
                secure: true, 
                sameSite: 'None',
                maxAge: REFRESH_TOKEN_MAX_AGE  
            }
        ).send({ success: true, user, accessToken })
   }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res) {
        res.send({  success: true , message: 'Logout successful' })
    }

    @PublicRoute()
    @UseGuards(RefreshTokenGuard)
    @Get('refresh-token')
    async refreshAccessToken(
        @Request() req,
    ) {
        return await this.authService.refreshAccessToken(req.user)
    }
}