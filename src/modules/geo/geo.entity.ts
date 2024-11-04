import { 
    Entity, 
    Column, 
    PrimaryGeneratedColumn, 
    CreateDateColumn, 
    UpdateDateColumn, 
  } from 'typeorm';
  
  @Entity()
  export class GeoData {
    @PrimaryGeneratedColumn("uuid")
    id: string;
  
    @Column()
    name: string;
  
    @Column()
    address: string;
  
    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
  
    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
  }
  