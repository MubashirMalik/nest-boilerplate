import { Body, Controller, Get, Injectable, Post, Request, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "src/guards/local-auth.guard";
import { GuardMetadata, OptionalJwtAuthGuard } from "src/guards/config";
import { ApiTags } from "@nestjs/swagger";
import { RegisterUserDto } from "./dtos/register-user.dto";

@Injectable()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) {}

    @GuardMetadata(OptionalJwtAuthGuard)
    @Post('register-user')
    async registerTenant(
        @Body() registerUser: RegisterUserDto,
    ) {
        return await this.authService.registerUser(registerUser)
    }

    @GuardMetadata('LocalAuthGuard')
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
            { httpOnly: true, secure: true, sameSite: 'None', maxAge: 5 * 60 * 1000  }
        ).send({ success: true, user, accessToken })
   }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res) {
        res.send({  success: true , message: 'Logout successful' })
    }

    @Get('/refresh-token')
    async refreshToken() {
        //TODO: Should i update cookie time here?
        return { success: true, user: { email: 'Hello', id: 1 }}
    }
}