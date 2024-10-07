import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ default: null })
  description?: string;

  @Column({ default: null })
  location?: string;

  @Column("simple-array", { default: null })
  imageUrls?: string[];
}