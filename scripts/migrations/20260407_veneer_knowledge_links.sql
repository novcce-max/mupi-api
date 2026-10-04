-- 知识库与前台百科 / 选材 slug 关联（发布联动）
ALTER TABLE veneer_knowledge
  ADD COLUMN IF NOT EXISTS linked_wiki_slug varchar(200) NULL,
  ADD COLUMN IF NOT EXISTS linked_material_slug varchar(200) NULL;

CREATE INDEX IF NOT EXISTS idx_veneer_knowledge_linked_wiki
  ON veneer_knowledge (linked_wiki_slug)
  WHERE linked_wiki_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_veneer_knowledge_linked_material
  ON veneer_knowledge (linked_material_slug)
  WHERE linked_material_slug IS NOT NULL;
