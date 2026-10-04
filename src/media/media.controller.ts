import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { R2UploadService } from './r2-upload.service';

/** Vercel Function 请求体上限 4.5MB，预留 multipart 开销。 */
const MAX_BYTES = 4 * 1024 * 1024;

@Controller('media')
export class MediaController {
  constructor(private readonly r2: R2UploadService) {}

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async listGallery() {
    return this.r2.listGalleryObjects();
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_BYTES },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('请上传文件字段 file');
    }
    const result = await this.r2.uploadImage({
      buffer: file.buffer,
      mimeType: file.mimetype || 'application/octet-stream',
      originalName: file.originalname,
    });
    return result;
  }
}
