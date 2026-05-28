import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.entity";

export enum ActivityArea {
    USER = 'user',
    ROLE = 'role',
    AUTH = 'auth',
}

export enum ActivityAction {
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    FORBIDDEN = 'forbidden',
    AUTHENTICATION = 'authentication',
}

@Entity('activity_log')
export class ActivityLog extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column('varchar', { length: 512 })
    description: string

    @Column('varchar', { length: 50 })
    area: ActivityArea

    @Column('varchar', { length: 50 })
    action: ActivityAction

    @Column('int', { nullable: true })
    recordId: number

    @Column('text', { nullable: true })
    recordBeforeAction: string

    @Column('varchar', { length: 45, nullable: true })
    ipAddress: string

    @Column('varchar', { length: 255, nullable: true })
    userAgent: string

    @Column('datetime', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date

    @Column('int', { nullable: true })
    userId: number

    @Column('varchar', { length: 100, nullable: true })
    userName: string

    @ManyToOne(() => User, relatedTable => relatedTable.ActivityLogs)
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    User: User
}
