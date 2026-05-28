import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./User.entity"
import { RoleXPermission } from "./RoleXPermission.entity"

@Entity('role')
export class Role extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column('varchar', { length: 50, unique: true })
    name: string

    @Column('int', { nullable: true })
    createdBy: number

    @Column('int', { nullable: true })
    modifiedBy: number

    @Column('datetime', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date

    @Column('datetime', { default: () => 'CURRENT_TIMESTAMP' })
    modifiedAt: Date

    // JOINS
    @OneToMany(() => RoleXPermission, relatedTable => relatedTable.Role)
    RoleXPermission: RoleXPermission[]

    @OneToMany(() => User, relatedTable => relatedTable.Role)
    @JoinColumn({ name: 'id', referencedColumnName:'roleId'})
    Users: User[]

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdBy', referencedColumnName: 'id' })
    CreatedBy: User
}
