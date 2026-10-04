import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200, unique: true })
  slug: string;

  @Column({ name: 'color_group', type: 'varchar', length: 100 })
  colorGroup: string;

  @Column({
    name: 'texture_type',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  textureType: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  finish: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  thickness: string | null;

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  images: string[];

  /** 与前端 MaterialItem 对齐的扩展字段（aliases, category, texture, priceRange, tags 等） */
  @Column({ type: 'jsonb', nullable: true })
  properties: Record<string, unknown> | null;

  @Index()
  @Column({
    type: 'varchar',
    length: 32,
    default: 'draft',
  })
  status: string;

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  tags: string[];

  @Column({
    name: 'cover_layout',
    type: 'varchar',
    length: 32,
    default: 'single',
  })
  coverLayout: string;

  /** 选材详情页展示视频（相对路径或完整 URL） */
  @Column({ name: 'video_url', type: 'varchar', length: 800, nullable: true })
  videoUrl: string | null;

  @Column({
    name: 'publish_meta',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  publishMeta: Record<string, unknown>;
}
