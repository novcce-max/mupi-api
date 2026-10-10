-- 案例 ↔ 木皮 多对多真实关联（按记录 ID，非标题猜测）
CREATE TABLE IF NOT EXISTS case_materials (
  id bigserial PRIMARY KEY,
  case_id bigint NOT NULL REFERENCES cases (id) ON DELETE CASCADE,
  material_id bigint NOT NULL REFERENCES materials (id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_case_materials_pair UNIQUE (case_id, material_id)
);

CREATE INDEX IF NOT EXISTS idx_case_materials_case_id
  ON case_materials (case_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_case_materials_material_id
  ON case_materials (material_id, sort_order);
