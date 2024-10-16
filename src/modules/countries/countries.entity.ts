import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Countries {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ default: null })
  description?: string;

  @Column({ default: null })
  location?: string;

  @Column("simple-array", { default: null })
  image_urls?: string[];

  @CreateDateColumn({ type: 'timestamp' }) // Автоматическое заполнение даты создания
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' }) // Автоматическое обновление даты изменения
  updated_at: Date;

}