import { Module } from '@nestjs/common';

import { AiService } from './ai.service';
import { AiAdminController } from './ai-admin.controller';

@Module({
  controllers: [AiAdminController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
