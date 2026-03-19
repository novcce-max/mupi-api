import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import {
  MemberService,
  MemberResponse,
  MemberOverview,
} from './member.service';
import { MemberHistory } from './entities/member-history.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IdParamDto } from '../common/dto/id-param.dto';

@UseGuards(JwtAuthGuard)
@Controller('member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get(':id')
  async getOverview(
    @Param() param: IdParamDto,
  ): Promise<MemberResponse<MemberOverview | null>> {
    return this.memberService.getOverviewById(param.id);
  }

  @Get(':id/history')
  async getHistory(
    @Param() param: IdParamDto,
  ): Promise<MemberResponse<MemberHistory[]>> {
    return this.memberService.getHistoryById(param.id);
  }
}
