import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MEDIA_UPLOAD_MAX_BYTES } from './media-upload.limits';
import { R2UploadService } from './r2-upload.service';

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
      limits: { fileSize: MEDIA_UPLOAD_MAX_BYTES },
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

  @Delete(':name')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('name') name: string) {
    await this.r2.deleteByFileName(name);
    return { deleted: true };
  }
}
