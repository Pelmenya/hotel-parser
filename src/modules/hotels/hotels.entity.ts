import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Districts } from '../districts/districts.entity';

@Entity()
@Index(["hotel_link_ostrovok", "address"], { unique: true })
export class Hotels {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column({ nullable: true, unique: true })
    hotel_link_ostrovok?: string;

    @Column("simple-array", { nullable: true })
    locations_from?: string[];

    @Column({ type: 'int', nullable: true }) // Указываем тип для числа
    stars?: number;

    @Column({ nullable: true })
    main_image_url?: string;

    @Column("simple-array", { nullable: true })
    images_urls?: string[] = [];

    @ManyToOne(() => Districts, (district) => district.hotels, { nullable: true })
    @JoinColumn({ name: 'district_id' }) // Укажите явное имя столбца
    district?: Districts;

    @Column({ default: false })
    page_loaded: boolean;

    @Column({ default: false })
    page_processed: boolean;

    @Column("simple-array", { nullable: true })
    image_urls?: string[];

    @Column({ default: false })
    all_images_loaded: boolean;

    @CreateDateColumn({ type: 'timestamp' }) // Автоматическое заполнение даты создания
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' }) // Автоматическое обновление даты изменения
    updated_at: Date;
}
