import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, MinLength, Matches } from "class-validator"

export class RegisterUserDto {
    @ApiProperty({
        name: 'email',
        example: 'mubashir@gmail.com'
    })
    @IsEmail()
    email: string

    @ApiProperty({
        name: 'password',
        example: 'Password1'
    })
    @Matches('[a-zA-Z]', undefined, { message: 'Password must contain at least 1 character'})
    @MinLength(8)
    @Matches('[0-9]', undefined, { message: 'Password must contain at least 1 number' })
    password: string
}