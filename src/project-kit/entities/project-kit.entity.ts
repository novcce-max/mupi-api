import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ProjectKitPayload = {
  name: string;
  materials: string[];
  cases: string[];
  problems: string[];
};

@Entity('project_kits')
export class ProjectKit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 用于分享链接的唯一标识，如 /project-kit/share?id=xxx */
  @Index({ unique: true })
  @Column({ name: 'share_id', type: 'varchar', length: 64, unique: true })
  shareId: string;

  @Column({ name: 'member_id', type: 'bigint', nullable: true })
  memberId: string | null;

  @Column({ type: 'varchar', length: 255, default: '' })
  name: string;

  @Column({ type: 'jsonb', default: {} })
  payload: ProjectKitPayload;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
