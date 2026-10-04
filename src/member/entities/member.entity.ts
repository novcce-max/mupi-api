import {
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { MemberStats } from './member-stats.entity';
import { MemberHistory } from './member-history.entity';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nickname: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  email: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  phone: string | null;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordHash: string | null;

  @Column({
    name: 'last_login_at',
    type: 'timestamptz',
    nullable: true,
  })
  lastLoginAt: Date | null;

  @OneToOne(() => MemberStats, (stats) => stats.member)
  stats?: MemberStats;

  @OneToMany(() => MemberHistory, (history) => history.member)
  histories?: MemberHistory[];
}
