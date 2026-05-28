import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { RoleService } from "./role.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { GetPaginatedRecordsDto } from "src/dtos/get-paginated-records.dto";
import { ROLE } from "src/constants/role.enum";
import { Role } from "src/decorators/role.decorator";
import { Permission } from "src/decorators/permission.decorator";
import { PermissionEnum } from "src/constants/permission.enum";

@Controller('role')
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @Role(ROLE.SUPER_ADMIN)
    @Permission(PermissionEnum.ADD_EDIT_ROLE)
    @Post()
    async createOrUpdateRoleWithPermissions(@Body() createRoleDto: CreateRoleDto) {
        return this.roleService.createRoleWithPermissions(createRoleDto);
    }

    @Permission(PermissionEnum.VIEW_ROLE)
    @Post('all')
    async getPaginatedRoles(@Body() dto: GetPaginatedRecordsDto) {
        return this.roleService.getPaginatedRoles(dto);
    }

    @Permission(PermissionEnum.VIEW_ROLE)
    @Get(':id')
    async getRoleById(@Param('id', ParseIntPipe) id: number) {
        return this.roleService.getRoleById(id);
    }

    @Role(ROLE.SUPER_ADMIN)
    @Permission(PermissionEnum.DELETE_ROLE)
    @Delete(':id')
    async deleteRole(@Param('id', ParseIntPipe) id: number) {
        return this.roleService.deleteRole(id);
    }
}
