import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Index(['source', 'createdAt'])
@Index(['path', 'createdAt'])
@Index(['visitorId', 'createdAt'])
@Index(['eventType', 'action', 'createdAt'])
@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'visitor_id', type: 'varchar', length: 80 })
  visitorId: string;

  @Column({ type: 'varchar', length: 300, default: '/' })
  path: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  referer: string | null;

  @Column({ type: 'varchar', length: 20, default: 'direct' })
  source: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 800, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  ip: string | null;

  @Column({
    name: 'event_type',
    type: 'varchar',
    length: 30,
    default: 'page_view',
  })
  eventType: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  action: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  label: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
