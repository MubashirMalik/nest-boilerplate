import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, MinLength } from "class-validator"

export class RegisterUserDto {
    @ApiProperty({
        name: 'email',
        example: 'mubashir@gmail.com'
    })
    @IsEmail()
    email: string

    @ApiProperty({
        name: 'password',
        example: 'SecurePass123!word'
    })
    @MinLength(16, { message: 'Password must be at least 16 characters' })
    password: string
}