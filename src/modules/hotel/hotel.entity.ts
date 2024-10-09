import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Hotel {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column({default: null })
    stars: number;

    @Column({ default: null })
    description?: string;

    @Column({ default: null })
    location?: string;

    @Column("simple-array", { default: null })
    imageUrls?: string[];
}