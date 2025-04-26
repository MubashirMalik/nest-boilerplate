import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('list')
export class List extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 255})
    label: string;

    @Column('varchar', { length: 255 })
    value: string;

    @Column('varchar', { length: 50 })
    type: string;

    @Column('boolean', { default: true })
    isActive: boolean;

    @Column('int', { default: 0 })
    sortOrder: number
}