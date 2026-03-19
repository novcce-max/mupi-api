import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WikiSpecies } from './entities/wiki-species.entity';
import { WikiService } from './wiki.service';
import { WikiController } from './wiki.controller';
import { WikiSeedService } from './wiki-seed.service';
import { WikiAdminController } from './wiki-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WikiSpecies])],
  controllers: [WikiController, WikiAdminController],
  providers: [WikiService, WikiSeedService],
  exports: [TypeOrmModule, WikiService, WikiSeedService],
})
export class WikiModule {}
