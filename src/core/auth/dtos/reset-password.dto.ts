import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsString, Matches, MinLength } from "class-validator"

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
        example: 'NewPassword1'
    })
    @Matches('[a-zA-Z]', undefined, { message: 'Password must contain at least 1 character'})
    @MinLength(8)
    @Matches('[0-9]', undefined, { message: 'Password must contain at least 1 number' })
    newPassword: string
} 