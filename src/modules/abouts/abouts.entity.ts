import { Hotels } from 'src/modules/hotels/hotels.entity';
import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TDescription } from './abouts.types';
import { TLanguage } from 'src/types/t-language';


@Entity()
export class Abouts {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ nullable: true })
    title: string;

    @Column("jsonb", { array: true }) // Используем jsonb и указываем, что это массив
    descriptions: TDescription[];

    @Column({ nullable: true })
    language: TLanguage;

    @Index()
    @ManyToOne(() => Hotels, (hotel) => hotel.images, { nullable: true })
    @JoinColumn({ name: 'hotel_id' }) // Явное имя столбца
    hotel?: Hotels;

    @CreateDateColumn({ type: 'timestamp' }) // Автоматическое заполнение даты создания
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' }) // Автоматическое обновление даты изменения
    updated_at: Date;
}
