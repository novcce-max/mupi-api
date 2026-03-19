import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectKit } from './entities/project-kit.entity';
import { ProjectKitService } from './project-kit.service';
import { ProjectKitController } from './project-kit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectKit])],
  controllers: [ProjectKitController],
  providers: [ProjectKitService],
  exports: [ProjectKitService],
})
export class ProjectKitModule {}
