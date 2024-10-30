import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Districts } from '../districts/districts.entity';
import { Images } from 'src/modules/images/images.entity';

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

  @Column({ type: 'int', nullable: true })
  stars?: number;

  @Index()  // Индекс для district_id
  @ManyToOne(() => Districts, district => district.hotels, { nullable: true })
  @JoinColumn({ name: 'district_id' })
  district?: Districts;

  @OneToMany(() => Images, image => image.hotel, { nullable: true })
  images?: Images[];

  @Column({ default: false })
  page_loaded: boolean;

  @Column({ default: false })
  page_processed: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
