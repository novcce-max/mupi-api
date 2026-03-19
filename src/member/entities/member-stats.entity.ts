import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Member } from './member.entity';

@Entity('member_stats')
export class MemberStats {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'member_id', type: 'bigint', unique: true })
  memberId: string;

  @OneToOne(() => Member, (member) => member.stats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ type: 'integer', default: 0 })
  points: number;

  @Column({ name: 'favorites_count', type: 'integer', default: 0 })
  favoritesCount: number;

  @Column({ name: 'views_count', type: 'integer', default: 0 })
  viewsCount: number;
}
