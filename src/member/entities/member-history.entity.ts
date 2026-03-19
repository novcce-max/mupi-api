import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Member } from './member.entity';

@Entity('member_history')
export class MemberHistory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'member_id', type: 'bigint' })
  memberId: string;

  @ManyToOne(() => Member, (member) => member.histories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ type: 'varchar', length: 200 })
  slug: string;

  @Column({ name: 'history_type', type: 'varchar', length: 50 })
  historyType: string;
}
