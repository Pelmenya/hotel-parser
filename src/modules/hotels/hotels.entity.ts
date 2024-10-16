import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
@Index(["name", "address"], { unique: true })
export class Hotels {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column({ nullable: true }) // Используем nullable для демонстрации возможности null
    location_value?: string;

    @Column({ nullable: true })
    location_from?: string;

    @Column({ nullable: true })
    hotel_link_ostrovok?: string;

    @Column({ nullable: true })
    location_name?: string;

    @Column({ type: 'int', nullable: true }) // Указываем тип для числа
    stars?: number;

    @Column("simple-array", { nullable: true })
    prev_image_urls?: string[];

    @CreateDateColumn({ type: 'timestamp' }) // Автоматическое заполнение даты создания
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' }) // Автоматическое обновление даты изменения
    updated_at: Date;
}
