import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { Role } from "./Role.entity"
import { Permission } from "./Permission.entity"

@Entity('role_x_permission')
export class RoleXPermission extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column('int')
    roleId: number

    @Column('int')
    permissionId: number

    @ManyToOne(() => Role, relatedTable => relatedTable.RoleXPermission)
    @JoinColumn({ name: 'roleId', referencedColumnName: 'id' })
    Role: Role

    @ManyToOne(() => Permission, relatedTable => relatedTable.RoleXPermission)
    @JoinColumn({ name: 'permissionId', referencedColumnName: 'id' })
    Permission: Permission
}
