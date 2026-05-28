import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from 'src/entities/Role.entity';
import { ROLE } from 'src/constants/role.enum';
import { List } from 'src/entities/List.entity';
import { Permission } from 'src/entities/Permission.entity';
import { RoleXPermission } from 'src/entities/RoleXPermission.entity';
import { PERMISSIONS_DATA } from './data/permissions.data';

@Injectable()
export class MetadataSeeder {
    constructor(private dataSource: DataSource) {}

    async seedData() {
        await Promise.all([
            this.seedRoles(),
            this.seedPermissionsAndRoleXPermissions(),
        ])
    }

    async seedRoles() {
        const roleRepo = this.dataSource.getRepository(Role);

        const roles = [
            {
                id: ROLE.SUPER_ADMIN,
                name: 'Super Admin',
            },
            {
                id: ROLE.ADMIN,
                name: 'Admin',
            },
            {
                id: ROLE.NORMAL_USER,
                name: 'Normal User',
            },
        ]

        const rolesInDb = await roleRepo.find();
        for (const role of roles) {
            const exists = rolesInDb.find(dbRole => dbRole.name === role.name && dbRole.id === role.id);
            if (!exists) {
                await roleRepo.save(roleRepo.create(role));
            }
        }
    }

    async seedPermissionsAndRoleXPermissions() {
        const permissionRepo = this.dataSource.getRepository(Permission)
        const roleXPermissionRepo = this.dataSource.getRepository(RoleXPermission)

        const dbPermissions = await permissionRepo.find()
        if (dbPermissions.length > 0) {
            return
        }

        const permissionsToInsert: Permission[] = []
        for (const permission of PERMISSIONS_DATA) {
            const { roles, ...rest } = permission
            permissionsToInsert.push(permissionRepo.create(rest))
        }

        await permissionRepo.save(permissionsToInsert)

        const roleXPermissionsToInsert: RoleXPermission[] = []
        for (const permission of PERMISSIONS_DATA) {
            const permissionInDb = permissionsToInsert.find(p => p.name === permission.name)
            if (!permissionInDb) continue

            for (const roleId of permission.roles) {
                roleXPermissionsToInsert.push(
                    roleXPermissionRepo.create({ roleId, permissionId: permissionInDb.id }),
                )
            }
        }

        await roleXPermissionRepo.save(roleXPermissionsToInsert)
    }

    async seedLists(list, type: 'countries' | 'industries' | 'dateFormats') {
        const listRepo = this.dataSource.getRepository(List);
        const recordsInDb = await listRepo.find({ where: { type }});
        for (const l of list) {
            const exists = recordsInDb.find(dbRecord => dbRecord.label === l.label);
            if (!exists) {
                await listRepo.save(listRepo.create({ 
                    label: l.label,
                    value: l.label, 
                    type
                }));
            }
        }
    }
}
