import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.entity";

@Entity('error')
export class ErrorLog extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column('varchar', { length: 10, default: '' })
    statusCode: number

    @Column('text', { nullable: true, default: null })
    path: string

    @Column('varchar', { length: 10, nullable: true, default: null })
    method: string

    @Column('text', { nullable: true, default: null })
    message: string

    @Column('text', { nullable: true, default: null })
    stack: string

    @Column('varchar', { default: '', length: 100 })
    username: string

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date

    @Column('int', { nullable: true, default: null })
    userId: number

    @Column('text', { nullable: true, default: null })
    requestData: string

    @ManyToOne(() => User, relatedTable => relatedTable.Errors)
    @JoinColumn({ name: 'userId' })
    User: User
}
