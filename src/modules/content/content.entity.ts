import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ContentStatus = 'draft' | 'published';

@Entity('content_items')
@Index(['slug'], { unique: true })
@Index(['status', 'updatedAt'])
@Index(['channel', 'status', 'updatedAt'])
export class ContentItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 220 })
  slug: string;

  @Column({ type: 'varchar', length: 800, nullable: true })
  summary: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  content: unknown;

  @Column({ name: 'cover_image', type: 'varchar', length: 500, nullable: true })
  coverImage: string | null;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: ContentStatus;

  /** baike | mupi | wenti — AI 草稿与运营归类 */
  @Column({ type: 'varchar', length: 32, nullable: true })
  channel: string | null;

  @Column({ name: 'ai_meta', type: 'jsonb', nullable: true })
  aiMeta: Record<string, unknown> | null;

  @Column({ name: 'seo_title', type: 'varchar', length: 220, nullable: true })
  seoTitle: string | null;

  @Column({
    name: 'seo_description',
    type: 'varchar',
    length: 800,
    nullable: true,
  })
  seoDescription: string | null;

  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  tags: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
