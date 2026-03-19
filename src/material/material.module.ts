import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Material } from './entities/material.entity';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { MaterialSeedService } from './material-seed.service';
import { MaterialAdminController } from './material-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Material])],
  controllers: [MaterialController, MaterialAdminController],
  providers: [MaterialService, MaterialSeedService],
  exports: [TypeOrmModule, MaterialService],
})
export class MaterialModule {}
