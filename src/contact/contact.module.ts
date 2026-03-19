import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ContactLog } from './entities/contact-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContactLog])],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
