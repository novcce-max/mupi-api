-- 会员邮箱注册 / 验证码 / 找回密码（生产环境请按需执行）
-- PostgreSQL

ALTER TABLE members ADD COLUMN IF NOT EXISTS email varchar(255) NULL;

-- 邮箱唯一（忽略 NULL）
CREATE UNIQUE INDEX IF NOT EXISTS uq_members_email_lower ON members (lower((email)::text))
  WHERE email IS NOT NULL AND trim(email) <> '';

-- 旧账号手机号可空（新用户可仅邮箱）
ALTER TABLE members ALTER COLUMN phone DROP NOT NULL;

CREATE TABLE IF NOT EXISTS auth_email_otps (
  id bigserial PRIMARY KEY,
  email varchar(255) NOT NULL,
  purpose varchar(32) NOT NULL,
  code_hash varchar(255) NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_email_otps_lookup
  ON auth_email_otps (lower((email)::text), purpose)
  WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS auth_password_resets (
  id bigserial PRIMARY KEY,
  member_id bigint NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  token_hash varchar(128) NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_password_resets_token
  ON auth_password_resets (token_hash)
  WHERE consumed_at IS NULL;
