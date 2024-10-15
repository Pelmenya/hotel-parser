import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
}