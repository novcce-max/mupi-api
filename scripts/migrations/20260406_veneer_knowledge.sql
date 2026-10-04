-- 木皮结构化知识库（AI 抽取 → 人工确认 → 后续生成百科/文章）
-- PostgreSQL

CREATE TABLE IF NOT EXISTS veneer_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status varchar(32) NOT NULL DEFAULT 'draft',
  display_name varchar(200) NOT NULL,
  source_url text NULL,
  source_type varchar(32) NULL,
  source_date varchar(64) NULL,
  raw_content_excerpt text NULL,
  raw_ai_extract jsonb NULL,
  veneer jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_veneer_knowledge_display_name
  ON veneer_knowledge (display_name);

CREATE INDEX IF NOT EXISTS idx_veneer_knowledge_status_updated
  ON veneer_knowledge (status, updated_at DESC);
