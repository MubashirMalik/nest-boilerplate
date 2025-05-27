import { ApiProperty } from "@nestjs/swagger"
import { IsEmail } from "class-validator"

export class ForgotPasswordDto {
    @ApiProperty({
        name: 'email',
        example: 'johndoe@gmail.com'
    })
    @IsEmail({}, { message: 'Please provide valid email address'})
    email: string
} 