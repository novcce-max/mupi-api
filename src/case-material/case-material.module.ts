import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Case } from '../case/entities/case.entity';
import { Material } from '../material/entities/material.entity';
import { CaseMaterial } from './entities/case-material.entity';
import { CaseMaterialService } from './case-material.service';

@Module({
  imports: [TypeOrmModule.forFeature([CaseMaterial, Case, Material])],
  providers: [CaseMaterialService],
  exports: [CaseMaterialService, TypeOrmModule],
})
export class CaseMaterialModule {}
