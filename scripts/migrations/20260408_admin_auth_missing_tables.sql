-- 补齐与 TYPEORM_ENTITIES 一致但本地库缺失的表：后台用户、邮箱 OTP、密码重置令牌
-- PostgreSQL；可重复执行（IF NOT EXISTS）

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  username varchar(100) NOT NULL,
  password_hash varchar(255) NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'editor',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_admin_users_username
  ON admin_users (username);

CREATE TABLE IF NOT EXISTS auth_email_otps (
  id BIGSERIAL PRIMARY KEY,
  email varchar(255) NOT NULL,
  purpose varchar(32) NOT NULL,
  code_hash varchar(255) NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_email_otps_email
  ON auth_email_otps (email);

CREATE TABLE IF NOT EXISTS auth_password_resets (
  id BIGSERIAL PRIMARY KEY,
  member_id bigint NOT NULL,
  token_hash varchar(128) NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_auth_password_resets_member
    FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_password_resets_token_hash
  ON auth_password_resets (token_hash);
