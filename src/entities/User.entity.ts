import { Role } from "./Role.entity";
import { ErrorLog } from "./Error.entity";
import { UserXPermission } from "./UserXPermission.entity";
import { ActivityLog } from "./ActivityLog.entity";
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('user')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column('varchar', { length: 254, unique: true })
    email: string

    @Column('varchar', { length: 60 })
    password: string

    @Column('varchar', { length: 255, default: '' })
    refreshToken: string

    @Column('varchar', { length: 6, default: '' })
    emailVerificationCode: string

    @Column('varchar', { length: 6, default: '' })
    passwordResetCode: string

    @Column('int')
    roleId: number

    // JOINS
    @ManyToOne(() => Role, relatedTable => relatedTable.Users)
    @JoinColumn({ name: 'roleId', referencedColumnName:'id'})
    Role: Role

    @OneToMany(() => ErrorLog, relatedTable => relatedTable.User)
    Errors: ErrorLog[]

    @OneToMany(() => UserXPermission, relatedTable => relatedTable.User)
    UserXPermission: UserXPermission[]

    @OneToMany(() => ActivityLog, relatedTable => relatedTable.User)
    ActivityLogs: ActivityLog[]
}
