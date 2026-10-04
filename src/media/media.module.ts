import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { MediaController } from './media.controller';
import { R2UploadService } from './r2-upload.service';

@Module({
  imports: [AuthModule],
  controllers: [MediaController],
  providers: [R2UploadService],
  exports: [R2UploadService],
})
export class MediaModule {}
