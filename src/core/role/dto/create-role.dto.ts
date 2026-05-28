import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsString, MinLength } from "class-validator";

export class CreateRoleDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    id?: number;

    @ApiProperty({ example: 'Editor' })
    @IsString()
    @MinLength(2)
    name: string;

    @ApiProperty({ example: [1, 2, 3] })
    @IsArray()
    @IsNumber({}, { each: true })
    permissions: number[];
}
