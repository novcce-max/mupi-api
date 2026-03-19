import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Member } from './entities/member.entity';
import { MemberStats } from './entities/member-stats.entity';
import { MemberHistory } from './entities/member-history.entity';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, MemberStats, MemberHistory]),
    AuthModule,
  ],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [TypeOrmModule, MemberService],
})
export class MemberModule {}
