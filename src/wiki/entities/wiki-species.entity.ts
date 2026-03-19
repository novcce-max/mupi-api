import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Index(['status', 'category', 'createdAt'])
@Entity('wiki_species')
export class WikiSpecies {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({
    name: 'english_name',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  englishName: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  photos: unknown[];

  @Column({
    name: 'suitable_scenes',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  suitableScenes: unknown[];

  @Column({ name: 'price_range', type: 'varchar', length: 100, nullable: true })
  priceRange: string | null;

  @Column({
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  properties: Record<string, unknown>;

  @Column({
    type: 'varchar',
    length: 50,
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

  @Index()
  @Column({
    name: 'featured_on_home',
    type: 'boolean',
    nullable: true,
    generatedType: 'STORED',
    asExpression: "COALESCE((publish_meta->>'featuredOnHome')::boolean, false)",
  })
  featuredOnHome: boolean;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  createdAt: Date;
}
