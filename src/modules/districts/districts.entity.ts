import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, Index } from 'typeorm';

@Entity()
export class Districts {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    @Index() // Индекс для ускорения поиска по имени
    name: string;

    @Column({ nullable: true })
    description?: string;

    // Тип данных 'geography' для PostGIS с координатами полигона
    @Column({ type: 'geography', spatialFeatureType: 'Polygon', srid: 4326, nullable: true })
    location?: any; // Используем 'any', так как TypeORM напрямую не поддерживает GeoJSON

    @Column({ nullable: true })
    district_link_ostrovok: string;

    @ManyToOne(() => Districts, (district) => district.children, { nullable: true })
    parent?: Districts | null; // Поле может быть null, если у района нет родителя

    @OneToMany(() => Districts, (district) => district.parent, { nullable: true })
    children?: Districts[]; // Поле может быть пустым, если у района нет детей

    @Column({ default: 1 })
    count_pages: number;

    @Column("simple-array", { nullable: true })
    image_urls?: string[];
}
