import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from 'src/entities/Role.entity';
import { ROLE } from 'src/constants/role.enum';
import { List } from 'src/entities/List.entity';

@Injectable()
export class MetadataSeeder {
    constructor(private dataSource: DataSource) {}

    async seedData() {
        await Promise.all([
            this.seedRoles(),
        ])
    }

    async seedRoles() {
        const roleRepo = this.dataSource.getRepository(Role);

        const roles = [
            {
                id: ROLE.ADMIN,
                name: 'Admin', // todo: these should not be hardcoded 
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

    async seedLists(list, type: 'countries' | 'industries') {
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