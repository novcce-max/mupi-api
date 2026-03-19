import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Index(['createdAt'])
@Entity('admin_logs')
export class AdminLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'username', type: 'varchar', length: 100, nullable: true })
  username: string | null;

  @Column({ name: 'role', type: 'varchar', length: 50, nullable: true })
  role: string | null;

  @Column({ name: 'action', type: 'varchar', length: 50 })
  action: string;

  @Column({ name: 'resource_type', type: 'varchar', length: 100 })
  resourceType: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 100, nullable: true })
  resourceId: string | null;

  @Column({ name: 'method', type: 'varchar', length: 16 })
  method: string;

  @Column({ name: 'path', type: 'varchar', length: 255 })
  path: string;

  @Column({ name: 'ip', type: 'varchar', length: 100, nullable: true })
  ip: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'summary', type: 'text', nullable: true })
  summary: string | null;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  createdAt: Date;
}
