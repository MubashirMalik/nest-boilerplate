import { BaseEntity, Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./User.entity"

@Entity('role')
export class Role extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column('varchar', { length: 50, unique: true })
    name: string

    // JOINS
    @OneToMany(() => User, relatedTable => relatedTable.Role)
    @JoinColumn({ name: 'id', referencedColumnName:'roleId'})
    Users: User[]
}