import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('problems')
export class Problem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ name: 'hero_title', type: 'varchar', length: 400 })
  heroTitle: string;

  @Column({ name: 'hero_subtitle', type: 'varchar', length: 400 })
  heroSubtitle: string;

  @Column({ name: 'hero_image', type: 'varchar', length: 300 })
  heroImage: string;

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  symptoms: { title: string; frequency: string; scene: string }[];

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  reasons: string[];

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  steps: string[];

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  tools: string[];

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  materials: string[];

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  preventions: string[];

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  faq: { q: string; a: string }[];

  @Column({
    name: 'recommended_material_slugs',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  recommendedMaterialSlugs: string[];

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

  @Column({
    name: 'publish_meta',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  publishMeta: Record<string, unknown>;
}
