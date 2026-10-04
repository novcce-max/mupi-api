import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('veneer_knowledge')
@Index(['status', 'updatedAt'])
export class VeneerKnowledge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32, default: 'draft' })
  status: string;

  @Column({ name: 'display_name', type: 'varchar', length: 200 })
  displayName: string;

  @Column({ name: 'source_url', type: 'text', nullable: true })
  sourceUrl: string | null;

  @Column({ name: 'source_type', type: 'varchar', length: 32, nullable: true })
  sourceType: string | null;

  @Column({ name: 'source_date', type: 'varchar', length: 64, nullable: true })
  sourceDate: string | null;

  @Column({ name: 'raw_content_excerpt', type: 'text', nullable: true })
  rawContentExcerpt: string | null;

  @Column({ name: 'raw_ai_extract', type: 'jsonb', nullable: true })
  rawAiExtract: Record<string, unknown> | null;

  @Column({ type: 'jsonb' })
  veneer: Record<string, unknown>;

  @Column({
    name: 'linked_wiki_slug',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  linkedWikiSlug: string | null;

  @Column({
    name: 'linked_material_slug',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  linkedMaterialSlug: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
