-- PostgreSQL: 案例 / 木皮详情页视频地址（可空）
ALTER TABLE cases ADD COLUMN IF NOT EXISTS video_url VARCHAR(800);
ALTER TABLE materials ADD COLUMN IF NOT EXISTS video_url VARCHAR(800);
