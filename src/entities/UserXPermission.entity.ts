import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { Permission } from "./Permission.entity"
import { User } from "./User.entity"

@Entity('user_x_permission')
export class UserXPermission extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column('int')
    userId: number

    @Column('int')
    permissionId: number

    @Column('boolean', { default: false })
    suppressPermission: boolean

    @ManyToOne(() => User, relatedTable => relatedTable.UserXPermission)
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    User: User

    @ManyToOne(() => Permission, relatedTable => relatedTable.UserXPermission)
    @JoinColumn({ name: 'permissionId', referencedColumnName: 'id' })
    Permission: Permission
}
