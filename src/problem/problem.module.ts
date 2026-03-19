import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Problem } from './entities/problem.entity';
import { ProblemController } from './problem.controller';
import { ProblemAdminController } from './problem-admin.controller';
import { ProblemService } from './problem.service';
import { ProblemSeedService } from './problem-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Problem])],
  controllers: [ProblemController, ProblemAdminController],
  providers: [ProblemService, ProblemSeedService],
  exports: [ProblemService],
})
export class ProblemModule {}
