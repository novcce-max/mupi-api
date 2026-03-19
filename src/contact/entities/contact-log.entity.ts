import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Index(['createdAt'])
@Index(['visitorId'])
@Index(['sourceTag'])
@Entity('contact_logs')
export class ContactLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({
    name: 'from_page',
    type: 'varchar',
    length: 200,
    default: 'contact',
  })
  fromPage: string;

  @Column({ name: 'visitor_id', type: 'varchar', length: 80, nullable: true })
  visitorId: string | null;

  @Column({ name: 'source_tag', type: 'varchar', length: 50, nullable: true })
  sourceTag: string | null;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20, default: 'new' })
  status: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  assignee: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // honeypot 字段，不应在正常表单中被真实用户填写
  @Column({ type: 'text', nullable: true })
  website: string | null;

  @Column({ name: 'source_ip', type: 'varchar', length: 100, nullable: true })
  sourceIp: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  createdAt: Date;

  @Column({
    type: 'timestamptz',
    name: 'follow_up_at',
    nullable: true,
  })
  followUpAt: Date | null;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
    nullable: true,
  })
  updatedAt: Date | null;
}
