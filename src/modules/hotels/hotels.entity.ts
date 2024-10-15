import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity()
@Index(["name", "address"], { unique: true })
export class Hotels {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column({ default: null })
    location_value: string;

    @Column({ default: null })
    location_from: string;

    @Column({ default: null })
    hotel_link_ostrovok: string;

    @Column({ default: null })
    location_name: string;

    @Column({ default: null })
    stars: number;

    @Column("simple-array", { default: null })
    prev_image_urls?: string[];

    @Column({ default: new Date() })
    created_at: Date;

    @Column({ default: new Date() })
    updated_at: Date;
}