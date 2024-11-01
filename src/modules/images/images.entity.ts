import { Hotels } from 'src/modules/hotels/hotels.entity';
import { TCategory } from 'src/types/t-category';
import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

export type TImageSize = 'large' | 'medium' | 'main' | 'small' | 'thumbnail';
export type TImageWidth = 1024 | 828 | 640 | 220 | 240;
export type TImageHeight = 768 | 560 | 400 | 220 | 240;

@Entity()
export class Images {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    alt: string;

    @Column({ nullable: true })
    size: TImageSize;

    @Column({ nullable: true })
    width: TImageWidth;

    @Column({ nullable: true })
    height: TImageHeight;

    @Column({type: String, nullable: true })
    type: TCategory;

    @Index()
    @ManyToOne(() => Hotels, (hotel) => hotel.images, { nullable: true })
    @JoinColumn({ name: 'hotel_id' }) // Явное имя столбца
    hotel?: Hotels;

    @Column({ nullable: true })
    path: string;

    @CreateDateColumn({ type: 'timestamp' }) // Автоматическое заполнение даты создания
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' }) // Автоматическое обновление даты изменения
    updated_at: Date;
}
