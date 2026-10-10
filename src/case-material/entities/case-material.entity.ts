import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Case } from '../../case/entities/case.entity';
import { Material } from '../../material/entities/material.entity';

@Entity('case_materials')
@Unique('uq_case_materials_pair', ['caseId', 'materialId'])
@Index('idx_case_materials_case_id', ['caseId', 'sortOrder'])
@Index('idx_case_materials_material_id', ['materialId', 'sortOrder'])
export class CaseMaterial {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'case_id', type: 'bigint' })
  caseId: string;

  @Column({ name: 'material_id', type: 'bigint' })
  materialId: string;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @ManyToOne(() => Material, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
