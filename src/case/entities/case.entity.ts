import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Index(['published', 'scene', 'budget', 'difficulty', 'createdAt'])
@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'varchar', length: 100 })
  scene: string;

  @Column({ type: 'varchar', length: 50 })
  budget: string;

  @Column({ type: 'varchar', length: 50 })
  difficulty: string;

  @Column({ name: 'material_grade', type: 'varchar', length: 50 })
  materialGrade: string;

  @Column({ name: 'material_name', type: 'varchar', length: 100 })
  materialName: string;

  @Column({ name: 'material_href', type: 'varchar', length: 200 })
  materialHref: string;

  @Column({ type: 'varchar', length: 100 })
  area: string;

  @Column({ type: 'varchar', length: 100 })
  timeline: string;

  @Column({ type: 'text' })
  challenge: string;

  @Column({ type: 'text' })
  solution: string;

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  materials: string[];

  @Column({
    name: 'process_images',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  processImages: string[];

  @Column({
    name: 'before_images',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  beforeImages: string[];

  @Column({
    name: 'after_images',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  afterImages: string[];

  @Column({
    name: 'related_problems',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  relatedProblems: { label: string; href: string }[];

  @Column({ name: 'cover_image', type: 'varchar', length: 500, nullable: true })
  coverImage: string | null;

  /** 施工过程/案例介绍视频（相对路径如 /videos/xx.mp4 或完整 URL） */
  @Column({ name: 'video_url', type: 'varchar', length: 800, nullable: true })
  videoUrl: string | null;

  @Column({ name: 'seo_title', type: 'varchar', length: 300, nullable: true })
  seoTitle: string | null;

  @Column({
    name: 'seo_description',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  seoDescription: string | null;

  @Column({ type: 'boolean', default: false })
  published: boolean;

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

  @Column({
    name: 'publish_meta',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  publishMeta: Record<string, unknown>;

  @Index({ fulltext: true })
  @Column({
    name: 'search_vector',
    type: 'tsvector',
    nullable: true,
    generatedType: 'STORED',
    asExpression:
      "to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(scene,'') || ' ' || coalesce(material_name,'') || ' ' || coalesce(challenge,'') || ' ' || coalesce(solution,''))",
  })
  searchVector: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
