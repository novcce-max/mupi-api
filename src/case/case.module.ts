import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaseMaterialModule } from '../case-material/case-material.module';
import { Case } from './entities/case.entity';
import { CaseController } from './case.controller';
import { CaseService } from './case.service';
import { CaseSeedService } from './case-seed.service';
import { CaseAdminController } from './case-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Case]), CaseMaterialModule],
  controllers: [CaseController, CaseAdminController],
  providers: [CaseService, CaseSeedService],
  exports: [CaseService],
})
export class CaseModule {}
