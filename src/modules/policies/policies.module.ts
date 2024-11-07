import { Module } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Policies } from './policies.entity';
import { PoliciesRepository } from './policies.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Policies])
  ],
  providers: [PoliciesService, PoliciesRepository],
  exports: [PoliciesService, PoliciesRepository],
})
export class PoliciesModule { }
