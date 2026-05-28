import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { RoleXPermission } from "./RoleXPermission.entity";
import { UserXPermission } from "./UserXPermission.entity";

@Entity('permission')
export class Permission extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column('varchar', { length: 50 })
    name: string

    @Column('varchar', { length: 255, default: '' })
    description: string

    @Column('varchar', { length: 50, default: '' })
    resource: string

    @OneToMany(() => RoleXPermission, relatedTable => relatedTable.Permission)
    RoleXPermission: RoleXPermission[]

    @OneToMany(() => UserXPermission, relatedTable => relatedTable.Permission)
    UserXPermission: UserXPermission[]
}
