import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaseMaterialModule } from '../case-material/case-material.module';
import { Material } from './entities/material.entity';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { MaterialSeedService } from './material-seed.service';
import { MaterialAdminController } from './material-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Material]), CaseMaterialModule],
  controllers: [MaterialController, MaterialAdminController],
  providers: [MaterialService, MaterialSeedService],
  exports: [TypeOrmModule, MaterialService],
})
export class MaterialModule {}
