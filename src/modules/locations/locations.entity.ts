import { 
    Entity, 
    Column, 
    PrimaryGeneratedColumn, 
    Index, 
    ManyToOne, 
    JoinColumn, 
  } from 'typeorm';
import { Hotels } from '../hotels/hotels.entity';
import { TLanguage } from 'src/types/t-language';
  
  @Entity()
  export class Locations {
      @PrimaryGeneratedColumn('uuid')
      id: string;

      @Column()
      address: string;

      @Index()
      @ManyToOne(() => Hotels, (hotel) => hotel.locations, { nullable: true })
      @JoinColumn({ name: 'hotel_id' }) // Явное имя столбца
      hotel?: Hotels;

      @Column({type: String, nullable: true })
      language: TLanguage;

      @Column({ type: 'jsonb' })
      geocode_data: any;
  }
