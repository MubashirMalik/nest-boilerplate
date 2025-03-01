import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('user')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column('varchar', { length: 254 })
    email: string

    @Column('varchar', { length: 60 })
    password: string

    @Column('varchar', { length: 255, default: '' })
    refreshToken: string
}
