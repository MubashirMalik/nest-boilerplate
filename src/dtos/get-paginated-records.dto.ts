import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsInt, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";

export interface FilterCondition {
    filterType: string;
    type: string;
    filter: number | string;
    operator?: string;
    dateFrom?: string;
    dateTo?: string;
    filterTo?: number | string;
    condition1?: FilterCondition;
    condition2?: FilterCondition
}
export interface FilterModel {
    [key: string]: FilterCondition;
}

export enum SortDirection {
    asc  = 'asc',
    desc = 'desc',
}
  
export class SortModelDto {
    @ApiProperty({ example: 'desc' })
    @IsEnum(SortDirection)
    sort: SortDirection;
  
    @ApiProperty({ example: 'id' })
    @IsString()
    colId: string;
}

export class GetPaginatedRecordsDto {
    @ApiProperty({
        name: 'startRow',
        example: 0
    })
    @IsInt()
    startRow: number

    @ApiProperty({
        name: 'endRow',
        example: 10
    })
    @IsInt()
    endRow: number

    @ApiProperty({
        name: 'filterModel',
        example: {
            "id": {
                "filterType": "number",
                "type": "lessThan",
                "filter": 1
            },
            "name": {
                "filterType": "text",
                "type": "notEqual",
                "filter": "1"
            }
        }
    })
    @IsObject()
    filterModel: FilterModel

    @ApiProperty({
        example: [
          { sort: 'desc', colId: 'id' },
          { sort: 'asc',  colId: 'name' },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SortModelDto)
    sortModel: SortModelDto[];

    @IsOptional()
    primaryAlias?: string

    @IsOptional()
    secondaryColumnAliases?: Object

    @IsOptional()
    customFilter?: { [key: string]: string | number | boolean }
}