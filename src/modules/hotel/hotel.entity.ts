import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity()
@Index(["name", "address"], { unique: true })
export class Hotel {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column({ default: null })
    locationValue: string;

    @Column({ default: null })
    locationFrom: string;

    @Column({ default: null })
    locationName: string;

    @Column({ default: null })
    stars: number;

    @Column("simple-array", { default: null })
    prevImageUrls?: string[];
}