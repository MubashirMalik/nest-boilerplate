import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsString, MinLength } from "class-validator"

export class ResetPasswordDto {
    @ApiProperty({
        name: 'email',
        example: 'johndoe@gmail.com'
    })
    @IsEmail({}, { message: 'Please provide valid email address'})
    email: string

    @ApiProperty({
        name: 'otp',
        example: '123456'
    })
    @IsString()
    @MinLength(6, { message: 'OTP must be 6 characters long' })
    otp: string

    @ApiProperty({
        name: 'newPassword',
        example: 'SecurePass123!word'
    })
    @MinLength(16, { message: 'Password must be at least 16 characters' })
    newPassword: string
} 