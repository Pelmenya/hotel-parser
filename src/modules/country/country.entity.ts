import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique: true})
  name: string;

  @Column()
  description?: string;

  @Column()
  location?: string;

  @Column("simple-array")
  imageUrls?: string[];
}