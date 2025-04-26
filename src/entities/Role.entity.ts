import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity('role')
export class Role extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column('varchar', { length: 50, unique: true })
    name: string
}