import { Hotels } from 'src/modules/hotels/hotels.entity';
import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TDescription } from './abouts.types';


@Entity()
export class Abouts {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ nullable: true })
    title: string;

    @Column("jsonb", { array: true }) // Используем jsonb и указываем, что это массив
    descriptions: TDescription[];

    @Index()
    @ManyToOne(() => Hotels, (hotel) => hotel.images, { nullable: true })
    @JoinColumn({ name: 'hotel_id' }) // Явное имя столбца
    hotel?: Hotels;

    @CreateDateColumn({ type: 'timestamp' }) // Автоматическое заполнение даты создания
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' }) // Автоматическое обновление даты изменения
    updated_at: Date;
}
