import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MaterialModule } from '../material/material.module';
import { WikiModule } from '../wiki/wiki.module';
import { VeneerKnowledge } from './entities/veneer-knowledge.entity';
import { VeneerExtractService } from './veneer-extract.service';
import { VeneerKnowledgeAdminController } from './veneer-knowledge-admin.controller';
import { VeneerKnowledgePublishService } from './veneer-knowledge-publish.service';
import { VeneerKnowledgeService } from './veneer-knowledge.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VeneerKnowledge]),
    WikiModule,
    MaterialModule,
  ],
  controllers: [VeneerKnowledgeAdminController],
  providers: [
    VeneerKnowledgeService,
    VeneerExtractService,
    VeneerKnowledgePublishService,
  ],
  exports: [
    VeneerKnowledgeService,
    VeneerExtractService,
    VeneerKnowledgePublishService,
  ],
})
export class VeneerKnowledgeModule {}
