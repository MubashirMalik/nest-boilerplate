import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Role } from "src/entities/Role.entity";
import { RoleXPermission } from "src/entities/RoleXPermission.entity";
import { Permission } from "src/entities/Permission.entity";
import { User } from "src/entities/User.entity";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UtilityService } from "../utility/utility.service";
import { GetPaginatedRecordsDto } from "src/dtos/get-paginated-records.dto";
import { ActivityAction } from "src/entities/ActivityLog.entity";
import { ActivityLogService } from "../activity-log/activity-log.service";
import { ROLE } from "src/constants/role.enum";

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
        @InjectRepository(RoleXPermission) private readonly roleXPermissionRepo: Repository<RoleXPermission>,
        @InjectRepository(Permission) private readonly permissionRepo: Repository<Permission>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        private readonly utilityService: UtilityService,
        private readonly activityLogService: ActivityLogService,
    ) {}

    async createRoleWithPermissions(createRoleDto: CreateRoleDto) {
        let role: Role;
        const requestUser = this.utilityService.getRequestUser();

        if (createRoleDto.id) {
            role = await this.roleRepo.findOne({ where: { id: createRoleDto.id } });
            if (!role) {
                throw new NotFoundException('Role not found');
            }
            role.modifiedBy = requestUser.id;
            await this.roleRepo.save(role);
        } else {
            const existingRole = await this.roleRepo.findOne({ where: { name: createRoleDto.name } });
            if (existingRole) {
                throw new BadRequestException('Role name already exists');
            }

            role = await this.roleRepo.save({
                name: createRoleDto.name,
                createdBy: requestUser.id,
                modifiedBy: requestUser.id,
            });
            await this.activityLogService.logRoleChange(
                `Role ${createRoleDto.name} created (ID: ${role.id})`,
                ActivityAction.CREATE,
                role.id,
            );
        }

        const existingPermissions = await this.permissionRepo.find({
            where: { id: In(createRoleDto.permissions) },
        });

        if (existingPermissions.length !== createRoleDto.permissions.length) {
            const existingIds = existingPermissions.map(p => p.id);
            const invalidIds = createRoleDto.permissions.filter(id => !existingIds.includes(id));
            throw new BadRequestException(`Invalid permission IDs: ${invalidIds.join(', ')}`);
        }

        await this.roleXPermissionRepo.delete({ roleId: role.id });

        await this.roleXPermissionRepo.save(
            createRoleDto.permissions.map(permissionId => ({
                roleId: role.id,
                permissionId,
            })),
        );

        return { success: true, message: 'Role created/updated successfully' };
    }

    async getPaginatedRoles(getPaginatedRecordsDto: GetPaginatedRecordsDto) {
        const query = this.roleRepo.createQueryBuilder('r')
            .leftJoin('role_x_permission', 'rxp', 'r.id = rxp.roleId')
            .leftJoin('user', 'u', 'r.createdBy = u.id')
            .select(['r.id as id', 'r.name as name', 'COUNT(rxp.permissionId) as permissionCount', 'u.email as createdBy'])
            .groupBy('r.id, r.name, u.email');

        getPaginatedRecordsDto.primaryAlias = 'r';

        const { totalRecords } = await this.utilityService.getPaginatedRecords(query, getPaginatedRecordsDto);
        const roles = await query.getRawMany();

        return {
            records: roles.map(role => ({
                ...role,
                permissionCount: parseInt(role.permissionCount, 10) || 0,
            })),
            totalRecords,
        };
    }

    async getRoleById(roleId: number) {
        const role = await this.roleRepo.findOne({
            where: { id: roleId },
            relations: { RoleXPermission: { Permission: true } },
        });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

        return role;
    }

    async deleteRole(roleId: number) {
        if ([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.NORMAL_USER].includes(roleId)) {
            throw new BadRequestException('You cannot delete a system role');
        }

        const role = await this.roleRepo.findOne({ where: { id: roleId } });
        if (!role) {
            throw new BadRequestException('Role not found');
        }

        const usersWithRole = await this.userRepo.count({ where: { roleId } });
        if (usersWithRole > 0) {
            throw new BadRequestException(`Cannot delete role assigned to ${usersWithRole} user(s)`);
        }

        await this.roleXPermissionRepo.delete({ roleId });
        await this.roleRepo.delete({ id: roleId });
        await this.activityLogService.logRoleChange(
            `Role ${role.name} deleted`,
            ActivityAction.DELETE,
            roleId,
        );

        return { success: true, message: 'Role deleted successfully' };
    }
}
