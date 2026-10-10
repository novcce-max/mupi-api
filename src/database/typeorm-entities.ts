import { AdminLog } from '../admin-log/entities/admin-log.entity';
import { AdminUser } from '../admin-user/entities/admin-user.entity';
import { AuthEmailOtp } from '../auth/entities/auth-email-otp.entity';
import { AuthPasswordReset } from '../auth/entities/auth-password-reset.entity';
import { Case } from '../case/entities/case.entity';
import { CaseMaterial } from '../case-material/entities/case-material.entity';
import { ContactLog } from '../contact/entities/contact-log.entity';
import { Material } from '../material/entities/material.entity';
import { Member } from '../member/entities/member.entity';
import { MemberHistory } from '../member/entities/member-history.entity';
import { MemberStats } from '../member/entities/member-stats.entity';
import { AnalyticsEvent } from '../modules/analytics/analytics.entity';
import { ContentItem } from '../modules/content/content.entity';
import { Problem } from '../problem/entities/problem.entity';
import { ProjectKit } from '../project-kit/entities/project-kit.entity';
import { Setting } from '../settings/entities/setting.entity';
import { VeneerKnowledge } from '../veneer-knowledge/entities/veneer-knowledge.entity';
import { WikiSpecies } from '../wiki/entities/wiki-species.entity';

/**
 * 显式注册全部实体，避免仅依赖 autoLoadEntities 时偶发遗漏（如 Setting 未进入 DataSource）。
 */
export const TYPEORM_ENTITIES = [
  AdminLog,
  AdminUser,
  AuthEmailOtp,
  AuthPasswordReset,
  Case,
  CaseMaterial,
  ContactLog,
  ContentItem,
  AnalyticsEvent,
  Material,
  Member,
  MemberHistory,
  MemberStats,
  Problem,
  ProjectKit,
  Setting,
  VeneerKnowledge,
  WikiSpecies,
] as const;
